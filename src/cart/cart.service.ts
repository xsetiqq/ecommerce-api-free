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
      include: { product: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async add(userId: string, dto: AddCartItemDto) {
    const product = await this.ensureProductIsAvailable(dto.productId);

    const existingItem = await this.prismaService.cartItem.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });

    const nextQuantity = (existingItem?.quantity ?? 0) + dto.quantity;

    if (nextQuantity > product.stock) {
      throw new BadRequestException(
        'Requested quantity exceeds available stock',
      );
    }

    return this.prismaService.cartItem.upsert({
      where: { userId_productId: { userId, productId: dto.productId } },
      update: { quantity: nextQuantity },
      create: { userId, productId: dto.productId, quantity: dto.quantity },
      include: { product: { include: { category: true } } },
    });
  }

  public async update(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.ensureCartItemBelongsToUser(userId, itemId);
    const product = await this.ensureProductIsAvailable(item.productId);

    if (dto.quantity > product.stock) {
      throw new BadRequestException(
        'Requested quantity exceeds available stock',
      );
    }

    return this.prismaService.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
      include: { product: { include: { category: true } } },
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
}
