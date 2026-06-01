import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryAddressDto } from './dto/create-delivery-address.dto';
import { UpdateDeliveryAddressDto } from './dto/update-delivery-address.dto';

@Injectable()
export class DeliveryAddressesService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll(userId: string) {
    return this.prismaService.deliveryAddress.findMany({
      where: {
        userId,
        isDelete: false,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  public async create(userId: string, dto: CreateDeliveryAddressDto) {
    return this.prismaService.$transaction(async (tx) => {
      const shouldBeDefault = dto.isDefault ?? false;

      const existingCount = await tx.deliveryAddress.count({
        where: { userId, isDelete: false },
      });

      if (shouldBeDefault || existingCount === 0) {
        await tx.deliveryAddress.updateMany({
          where: { userId, isDelete: false },
          data: { isDefault: false },
        });
      }

      return tx.deliveryAddress.create({
        data: {
          userId,
          fullName: dto.fullName,
          phone: dto.phone,
          country: dto.country,
          city: dto.city,
          street: dto.street,
          building: dto.building,
          apartment: dto.apartment,
          postalCode: dto.postalCode,
          comment: dto.comment,
          isDefault: shouldBeDefault || existingCount === 0,
        },
      });
    });
  }

  public async update(
    userId: string,
    addressId: string,
    dto: UpdateDeliveryAddressDto,
  ) {
    await this.ensureAddressBelongsToUser(userId, addressId);

    return this.prismaService.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.deliveryAddress.updateMany({
          where: { userId, isDelete: false },
          data: { isDefault: false },
        });
      }

      return tx.deliveryAddress.update({
        where: { id: addressId },
        data: dto,
      });
    });
  }

  public async setDefault(userId: string, addressId: string) {
    await this.ensureAddressBelongsToUser(userId, addressId);

    return this.prismaService.$transaction(async (tx) => {
      await tx.deliveryAddress.updateMany({
        where: { userId, isDelete: false },
        data: { isDefault: false },
      });

      return tx.deliveryAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });
  }

  public async remove(userId: string, addressId: string) {
    const address = await this.ensureAddressBelongsToUser(userId, addressId);

    return this.prismaService.$transaction(async (tx) => {
      const deletedAddress = await tx.deliveryAddress.update({
        where: { id: addressId },
        data: {
          isDelete: true,
          deletedAt: new Date(),
          isDefault: false,
        },
      });

      if (address.isDefault) {
        const nextDefaultAddress = await tx.deliveryAddress.findFirst({
          where: {
            userId,
            isDelete: false,
            id: { not: addressId },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (nextDefaultAddress) {
          await tx.deliveryAddress.update({
            where: { id: nextDefaultAddress.id },
            data: { isDefault: true },
          });
        }
      }

      return deletedAddress;
    });
  }

  private async ensureAddressBelongsToUser(userId: string, addressId: string) {
    const address = await this.prismaService.deliveryAddress.findFirst({
      where: {
        id: addressId,
        userId,
        isDelete: false,
      },
    });

    if (!address) {
      throw new NotFoundException('Delivery address not found');
    }

    return address;
  }
}
