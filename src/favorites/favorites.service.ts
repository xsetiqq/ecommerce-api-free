import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll(userId: string) {
    return this.prismaService.favoriteItem.findMany({
      where: {
        userId,
        product: { isDelete: false, isActive: true },
      },
      include: { product: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async add(userId: string, productId: string) {
    await this.ensureProductIsAvailable(productId);

    return this.prismaService.favoriteItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
      include: { product: { include: { category: true } } },
    });
  }

  public async remove(userId: string, productId: string) {
    const favorite = await this.prismaService.favoriteItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite item not found');
    }

    await this.prismaService.favoriteItem.delete({
      where: { id: favorite.id },
    });

    return { success: true };
  }

  private async ensureProductIsAvailable(productId: string) {
    const product = await this.prismaService.product.findFirst({
      where: { id: productId, isDelete: false, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }
}
