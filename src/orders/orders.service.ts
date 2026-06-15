import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, UserRole } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PromoCodesService } from '../promo-codes/promo-codes.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly promoCodesService: PromoCodesService,
  ) {}

  public async create(userId: string, dto: CreateOrderDto) {
    const addressSnapshot = await this.resolveAddressSnapshot(userId, dto);

    return this.prismaService.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId },
        include: { product: true, variant: true },
      });

      if (cartItems.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      let subtotal = 0;

      for (const item of cartItems) {
        if (item.product.isDelete || !item.product.isActive) {
          throw new BadRequestException(
            `Product ${item.product.title} is not available`,
          );
        }

        if (
          item.variantId &&
          (!item.variant || item.variant.isDelete || !item.variant.isActive)
        ) {
          throw new BadRequestException(
            `Selected variant for product ${item.product.title} is not available`,
          );
        }

        const availableStock = item.variant?.stock ?? item.product.stock;

        if (item.quantity > availableStock) {
          throw new BadRequestException(
            `Not enough stock for product ${item.product.title}`,
          );
        }

        const unitPrice = Number(item.variant?.price ?? item.product.price);
        subtotal += unitPrice * item.quantity;
      }

      const { promoCode, discountAmount } =
        await this.promoCodesService.calculateDiscount(dto.promoCode, subtotal);
      const total = Math.max(0, subtotal - discountAmount);

      for (const item of cartItems) {
        if (item.variantId) {
          const decrementVariantResult = await tx.productVariant.updateMany({
            where: {
              id: item.variantId,
              productId: item.productId,
              isDelete: false,
              isActive: true,
              stock: { gte: item.quantity },
            },
            data: { stock: { decrement: item.quantity } },
          });

          if (decrementVariantResult.count !== 1) {
            throw new BadRequestException(
              `Not enough stock for product ${item.product.title}`,
            );
          }

          continue;
        }

        const decrementResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            isDelete: false,
            isActive: true,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (decrementResult.count !== 1) {
          throw new BadRequestException(
            `Not enough stock for product ${item.product.title}`,
          );
        }
      }

      const order = await tx.order.create({
        data: {
          userId,
          deliveryAddressId: addressSnapshot.deliveryAddressId,
          deliveryAddress: addressSnapshot.deliveryAddress,
          phone: addressSnapshot.phone,
          comment: dto.comment ?? addressSnapshot.comment,
          subtotal: subtotal.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          total: total.toFixed(2),
          promoCodeId: promoCode?.id,
          status: OrderStatus.PENDING,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.variant?.price ?? item.product.price,
            })),
          },
        },
        include: {
          items: { include: { product: true, variant: true } },
          savedDeliveryAddress: true,
          promoCode: true,
        },
      });

      await this.promoCodesService.incrementUsage(tx, promoCode?.id);

      await tx.cartItem.deleteMany({ where: { userId } });

      return order;
    });
  }

  public async findMy(userId: string) {
    return this.prismaService.order.findMany({
      where: { userId, isDelete: false },
      include: {
        items: { include: { product: true, variant: true } },
        savedDeliveryAddress: true,
        promoCode: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async findOne(userId: string, userRole: UserRole, orderId: string) {
    const order = await this.prismaService.order.findFirst({
      where: { id: orderId, isDelete: false },
      include: {
        items: { include: { product: true, variant: true } },
        savedDeliveryAddress: true,
        promoCode: true,
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (userRole !== UserRole.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  public async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    return this.prismaService.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, isDelete: false },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (
        order.status === OrderStatus.CANCELLED &&
        dto.status !== OrderStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Cancelled order status cannot be changed',
        );
      }

      if (
        dto.status === OrderStatus.CANCELLED &&
        order.status !== OrderStatus.CANCELLED
      ) {
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
            continue;
          }

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: dto.status },
        include: { items: { include: { product: true, variant: true } } },
      });
    });
  }

  private async resolveAddressSnapshot(userId: string, dto: CreateOrderDto) {
    if (dto.deliveryAddressId) {
      const address = await this.prismaService.deliveryAddress.findFirst({
        where: {
          id: dto.deliveryAddressId,
          userId,
          isDelete: false,
        },
      });

      if (!address) {
        throw new NotFoundException('Delivery address not found');
      }

      return {
        deliveryAddressId: address.id,
        deliveryAddress: this.formatDeliveryAddress(address),
        phone: address.phone,
        comment: dto.comment ?? address.comment,
      };
    }

    if (!dto.deliveryAddress || !dto.phone) {
      throw new BadRequestException('Delivery address and phone are required');
    }

    return {
      deliveryAddressId: undefined,
      deliveryAddress: dto.deliveryAddress,
      phone: dto.phone,
      comment: dto.comment,
    };
  }

  private formatDeliveryAddress(address: {
    country: string | null;
    city: string;
    street: string;
    building: string;
    apartment: string | null;
    postalCode: string | null;
  }) {
    const streetLine = `${address.street} ${address.building}${address.apartment ? `/${address.apartment}` : ''}`;
    return [streetLine, address.postalCode, address.city, address.country]
      .filter(Boolean)
      .join(', ');
  }
}
