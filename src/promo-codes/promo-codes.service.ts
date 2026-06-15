import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PromoCodeType } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';

@Injectable()
export class PromoCodesService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll() {
    return this.prismaService.promoCode.findMany({
      where: { isDelete: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async findActiveByCode(code: string) {
    return this.findValidPromoCode(code, 0, false);
  }

  public async create(dto: CreatePromoCodeDto) {
    this.validatePromoDto(dto);
    const normalizedCode = this.normalizeCode(dto.code);

    const existing = await this.prismaService.promoCode.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      throw new ConflictException('Promo code with this code already exists');
    }

    return this.prismaService.promoCode.create({
      data: {
        code: normalizedCode,
        type: dto.type,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount,
        usageLimit: dto.usageLimit,
        startsAt: dto.startsAt,
        expiresAt: dto.expiresAt,
        isActive: dto.isActive ?? true,
      },
    });
  }

  public async update(id: string, dto: UpdatePromoCodeDto) {
    this.validatePromoDto(dto);
    await this.ensureExists(id);

    const normalizedCode = dto.code ? this.normalizeCode(dto.code) : undefined;

    if (normalizedCode) {
      const existing = await this.prismaService.promoCode.findUnique({
        where: { code: normalizedCode },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Promo code with this code already exists');
      }
    }

    return this.prismaService.promoCode.update({
      where: { id },
      data: {
        code: normalizedCode,
        type: dto.type,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount,
        usageLimit: dto.usageLimit,
        startsAt: dto.startsAt,
        expiresAt: dto.expiresAt,
        isActive: dto.isActive,
      },
    });
  }

  public async remove(id: string) {
    await this.ensureExists(id);

    return this.prismaService.promoCode.update({
      where: { id },
      data: { isDelete: true, isActive: false, deletedAt: new Date() },
    });
  }

  public async calculateDiscount(code: string | undefined, subtotal: number) {
    if (!code) {
      return { promoCode: null, discountAmount: 0 };
    }

    const promoCode = await this.findValidPromoCode(code, subtotal, true);
    const value = Number(promoCode.value);
    const discountAmount =
      promoCode.type === PromoCodeType.PERCENT
        ? Math.min(subtotal, (subtotal * value) / 100)
        : Math.min(subtotal, value);

    return {
      promoCode,
      discountAmount: Number(discountAmount.toFixed(2)),
    };
  }

  public async incrementUsage(
    tx: Prisma.TransactionClient,
    promoCodeId?: string,
  ) {
    if (!promoCodeId) {
      return;
    }

    await tx.promoCode.update({
      where: { id: promoCodeId },
      data: { usedCount: { increment: 1 } },
    });
  }

  private async ensureExists(id: string) {
    const promoCode = await this.prismaService.promoCode.findFirst({
      where: { id, isDelete: false },
    });

    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }

    return promoCode;
  }

  private async findValidPromoCode(
    code: string,
    subtotal: number,
    enforceMinAmount: boolean,
  ) {
    const promoCode = await this.prismaService.promoCode.findUnique({
      where: { code: this.normalizeCode(code) },
    });

    if (!promoCode || promoCode.isDelete || !promoCode.isActive) {
      throw new NotFoundException('Promo code not found');
    }

    const now = new Date();

    if (promoCode.startsAt && promoCode.startsAt > now) {
      throw new BadRequestException('Promo code is not active yet');
    }

    if (promoCode.expiresAt && promoCode.expiresAt < now) {
      throw new BadRequestException('Promo code has expired');
    }

    if (
      promoCode.usageLimit !== null &&
      promoCode.usedCount >= promoCode.usageLimit
    ) {
      throw new BadRequestException('Promo code usage limit exceeded');
    }

    if (
      enforceMinAmount &&
      promoCode.minOrderAmount !== null &&
      subtotal < Number(promoCode.minOrderAmount)
    ) {
      throw new BadRequestException(
        'Order amount is too low for this promo code',
      );
    }

    return promoCode;
  }

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  private validatePromoDto(dto: Partial<CreatePromoCodeDto>) {
    if (
      dto.type === PromoCodeType.PERCENT &&
      dto.value !== undefined &&
      dto.value > 100
    ) {
      throw new BadRequestException(
        'Percent promo code value cannot be greater than 100',
      );
    }

    if (dto.startsAt && dto.expiresAt && dto.startsAt >= dto.expiresAt) {
      throw new BadRequestException('Expiration date must be after start date');
    }
  }
}
