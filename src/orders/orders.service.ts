import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, UserRole } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prismaService: PrismaService) {}

  public async create(userId: string, dto: CreateOrderDto) {
    const addressSnapshot = await this.resolveAddressSnapshot(userId, dto);

    return this.prismaService.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId },
        include: { product: true },
      });

      if (cartItems.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      let total = 0;

      for (const item of cartItems) {
        if (item.product.isDelete || !item.product.isActive) {
          throw new BadRequestException(
            `Product ${item.product.title} is not available`,
          );
        }

        if (item.quantity > item.product.stock) {
          throw new BadRequestException(
            `Not enough stock for product ${item.product.title}`,
          );
        }

        total += Number(item.product.price) * item.quantity;
      }

      for (const item of cartItems) {
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
          total: total.toFixed(2),
          status: OrderStatus.PENDING,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          savedDeliveryAddress: true,
        },
      });

      await tx.cartItem.deleteMany({ where: { userId } });

      return order;
    });
  }

  public async findMy(userId: string) {
    return this.prismaService.order.findMany({
      where: { userId, isDelete: false },
      include: {
        items: { include: { product: true } },
        savedDeliveryAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async findOne(userId: string, userRole: UserRole, orderId: string) {
    const order = await this.prismaService.order.findFirst({
      where: { id: orderId, isDelete: false },
      include: {
        items: { include: { product: true } },
        savedDeliveryAddress: true,
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
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: dto.status },
        include: { items: { include: { product: true } } },
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
