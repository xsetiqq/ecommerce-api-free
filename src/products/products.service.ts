import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsQueryDto, ProductSortBy, SortOrder } from './dto/find-products-query.dto';
import { Prisma } from '../generated/prisma';

@Injectable()
export class ProductsService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll(query: FindProductsQueryDto) {
    const {
      q,
      categorySlug,
      minPrice,
      maxPrice,
      sortBy = ProductSortBy.CREATED_AT,
      order = SortOrder.DESC,
    } = query;

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isDelete: false,
      isActive: true,
      category: categorySlug
       ? {
           slug: categorySlug,
           isDelete: false,
           isActive: true,
         }
       : {
           isDelete: false,
           isActive: true,
         },
    };

    const search = q?.trim();

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [sortBy]: order,
    };

    const [products, total] = await Promise.all([
      this.prismaService.product.findMany({
        where,
        include: { category: true },
        orderBy,
        skip,
        take: limit,
      }),
      this.prismaService.product.count({
        where,
      }),
    ]);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async findBySlug(slug: string) {
    const product = await this.prismaService.product.findFirst({
      where: {
        slug,
        isDelete: false,
        isActive: true,
        category: { isDelete: false, isActive: true },
      },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  public async create(dto: CreateProductDto) {
    await this.ensureSlugAvailable(dto.slug);
    await this.ensureCategoryExists(dto.categoryId);

    return this.prismaService.product.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        price: dto.price,
        oldPrice: dto.oldPrice,
        imageUrl: dto.imageUrl,
        images: dto.images ?? [],
        stock: dto.stock ?? 0,
        rating: dto.rating,
        isActive: dto.isActive ?? true,
        categoryId: dto.categoryId,
      },
      include: { category: true },
    });
  }

  public async update(id: string, dto: UpdateProductDto) {
    await this.ensureProductExists(id);

    if (dto.slug) {
      await this.ensureSlugAvailable(dto.slug, id);
    }

    if (dto.categoryId) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    return this.prismaService.product.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        price: dto.price,
        oldPrice: dto.oldPrice,
        imageUrl: dto.imageUrl,
        images: dto.images,
        stock: dto.stock,
        rating: dto.rating,
        isActive: dto.isActive,
        categoryId: dto.categoryId,
      },
      include: { category: true },
    });
  }

  public async remove(id: string) {
    await this.ensureProductExists(id);

    return this.prismaService.product.update({
      where: { id },
      data: {
        isDelete: true,
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  private async ensureProductExists(id: string) {
    const product = await this.prismaService.product.findFirst({
      where: { id, isDelete: false },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private async ensureCategoryExists(categoryId: string) {
    const category = await this.prismaService.category.findFirst({
      where: { id: categoryId, isDelete: false },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  private async ensureSlugAvailable(slug: string, excludeId?: string) {
    const product = await this.prismaService.product.findUnique({
      where: { slug },
    });

    if (product && product.id !== excludeId) {
      throw new ConflictException('Product with this slug already exists');
    }
  }
}
