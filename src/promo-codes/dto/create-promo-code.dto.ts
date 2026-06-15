import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PromoCodeType } from '../../generated/prisma';

export class CreatePromoCodeDto {
  @ApiProperty({ example: 'SUMMER10' })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Code must not be empty' })
  code: string;

  @ApiProperty({ enum: PromoCodeType, example: PromoCodeType.PERCENT })
  @IsEnum(PromoCodeType, { message: 'Type must be PERCENT or FIXED' })
  type: PromoCodeType;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber({}, { message: 'Value must be a number' })
  @Min(0, { message: 'Value must be greater than 0' })
  value: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Minimum order amount must be a number' })
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Usage limit must be an integer' })
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Start date must be a valid date' })
  startsAt?: Date;

  @ApiPropertyOptional({ example: '2026-07-01T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Expiration date must be a valid date' })
  expiresAt?: Date;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: 'Active flag must be a boolean' })
  isActive?: boolean;
}
