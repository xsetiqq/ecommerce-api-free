import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findByProduct(productId: string) {
    await this.ensureProductExists(productId);

    return this.prismaService.productReview.findMany({
      where: { productId, isDelete: false },
      include: { user: { select: { id: true, name: true, photoUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async create(userId: string, productId: string, dto: CreateReviewDto) {
    await this.ensureProductExists(productId);

    const existing = await this.prismaService.productReview.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing && !existing.isDelete) {
      throw new ConflictException('Review already exists for this product');
    }

    const review = existing
      ? await this.prismaService.productReview.update({
          where: { id: existing.id },
          data: {
            rating: dto.rating,
            comment: dto.comment,
            isDelete: false,
            deletedAt: null,
          },
        })
      : await this.prismaService.productReview.create({
          data: { userId, productId, rating: dto.rating, comment: dto.comment },
        });

    await this.recalculateProductRating(productId);
    return review;
  }

  public async update(
    userId: string,
    userRole: UserRole,
    reviewId: string,
    dto: UpdateReviewDto,
  ) {
    const review = await this.ensureReviewExists(reviewId);
    this.ensureCanModifyReview(userId, userRole, review.userId);

    const updatedReview = await this.prismaService.productReview.update({
      where: { id: reviewId },
      data: { rating: dto.rating, comment: dto.comment },
    });

    await this.recalculateProductRating(review.productId);
    return updatedReview;
  }

  public async remove(userId: string, userRole: UserRole, reviewId: string) {
    const review = await this.ensureReviewExists(reviewId);
    this.ensureCanModifyReview(userId, userRole, review.userId);

    const deletedReview = await this.prismaService.productReview.update({
      where: { id: reviewId },
      data: { isDelete: true, deletedAt: new Date() },
    });

    await this.recalculateProductRating(review.productId);
    return deletedReview;
  }

  private async ensureProductExists(productId: string) {
    const product = await this.prismaService.product.findFirst({
      where: { id: productId, isDelete: false, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private async ensureReviewExists(reviewId: string) {
    const review = await this.prismaService.productReview.findFirst({
      where: { id: reviewId, isDelete: false },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  private ensureCanModifyReview(
    userId: string,
    userRole: UserRole,
    reviewUserId: string,
  ) {
    if (userRole !== UserRole.ADMIN && reviewUserId !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  private async recalculateProductRating(productId: string) {
    const aggregate = await this.prismaService.productReview.aggregate({
      where: { productId, isDelete: false },
      _avg: { rating: true },
    });

    await this.prismaService.product.update({
      where: { id: productId },
      data: {
        rating: aggregate._avg.rating
          ? Number(aggregate._avg.rating.toFixed(2))
          : null,
      },
    });
  }
}
