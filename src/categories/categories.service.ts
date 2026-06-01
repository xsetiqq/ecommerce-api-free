import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll() {
    return this.prismaService.category.findMany({
      where: { isDelete: false, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async findBySlug(slug: string) {
    const category = await this.prismaService.category.findFirst({
      where: { slug, isDelete: false, isActive: true },
      include: {
        products: {
          where: { isDelete: false, isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  public async create(dto: CreateCategoryDto) {
    await this.ensureSlugAvailable(dto.slug);

    return this.prismaService.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive ?? true,
      },
    });
  }

  public async update(id: string, dto: UpdateCategoryDto) {
    await this.ensureCategoryExists(id);

    if (dto.slug) {
      await this.ensureSlugAvailable(dto.slug, id);
    }

    return this.prismaService.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive,
      },
    });
  }

  public async remove(id: string) {
    await this.ensureCategoryExists(id);

    return this.prismaService.category.update({
      where: { id },
      data: {
        isDelete: true,
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  private async ensureCategoryExists(id: string) {
    const category = await this.prismaService.category.findFirst({
      where: { id, isDelete: false },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  private async ensureSlugAvailable(slug: string, excludeId?: string) {
    const category = await this.prismaService.category.findUnique({
      where: { slug },
    });

    if (category && category.id !== excludeId) {
      throw new ConflictException('Category with this slug already exists');
    }
  }
}
