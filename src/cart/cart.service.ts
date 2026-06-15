import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll(userId: string) {
    return this.prismaService.cartItem.findMany({
      where: {
        userId,
        product: { isDelete: false, isActive: true },
      },
      include: {
        product: { include: { category: true } },
        variant: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async add(userId: string, dto: AddCartItemDto) {
    const product = await this.ensureProductIsAvailable(dto.productId);
    const variant = dto.variantId
      ? await this.ensureVariantIsAvailable(dto.productId, dto.variantId)
      : null;
    const availableStock = variant?.stock ?? product.stock;

    const existingItem = await this.prismaService.cartItem.findFirst({
      where: {
        userId,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
      },
    });

    const nextQuantity = (existingItem?.quantity ?? 0) + dto.quantity;

    if (nextQuantity > availableStock) {
      throw new BadRequestException(
        'Requested quantity exceeds available stock',
      );
    }

    if (existingItem) {
      return this.prismaService.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: nextQuantity },
        include: {
          product: { include: { category: true } },
          variant: true,
        },
      });
    }

    return this.prismaService.cartItem.create({
      data: {
        userId,
        productId: dto.productId,
        variantId: dto.variantId,
        quantity: dto.quantity,
      },
      include: {
        product: { include: { category: true } },
        variant: true,
      },
    });
  }

  public async update(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.ensureCartItemBelongsToUser(userId, itemId);
    const product = await this.ensureProductIsAvailable(item.productId);
    const variant = item.variantId
      ? await this.ensureVariantIsAvailable(item.productId, item.variantId)
      : null;
    const availableStock = variant?.stock ?? product.stock;

    if (dto.quantity > availableStock) {
      throw new BadRequestException(
        'Requested quantity exceeds available stock',
      );
    }

    return this.prismaService.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
      include: {
        product: { include: { category: true } },
        variant: true,
      },
    });
  }

  public async remove(userId: string, itemId: string) {
    await this.ensureCartItemBelongsToUser(userId, itemId);
    await this.prismaService.cartItem.delete({ where: { id: itemId } });
    return { success: true };
  }

  public async clear(userId: string) {
    await this.prismaService.cartItem.deleteMany({ where: { userId } });
    return { success: true };
  }

  private async ensureCartItemBelongsToUser(userId: string, itemId: string) {
    const item = await this.prismaService.cartItem.findFirst({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    return item;
  }

  private async ensureProductIsAvailable(productId: string) {
    const product = await this.prismaService.product.findFirst({
      where: { id: productId, isDelete: false, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock <= 0) {
      throw new BadRequestException('Product is out of stock');
    }

    return product;
  }

  private async ensureVariantIsAvailable(productId: string, variantId: string) {
    const variant = await this.prismaService.productVariant.findFirst({
      where: {
        id: variantId,
        productId,
        isDelete: false,
        isActive: true,
      },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    if (variant.stock <= 0) {
      throw new BadRequestException('Product variant is out of stock');
    }

    return variant;
  }
}
