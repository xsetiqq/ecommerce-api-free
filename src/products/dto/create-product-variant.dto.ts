import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductVariantDto {
  @ApiProperty({ example: 'TSHIRT-BLACK-M' })
  @IsString({ message: 'SKU must be a string' })
  @IsNotEmpty({ message: 'SKU must not be empty' })
  sku: string;

  @ApiPropertyOptional({ example: 'Black' })
  @IsOptional()
  @IsString({ message: 'Color must be a string' })
  color?: string;

  @ApiPropertyOptional({ example: 'M' })
  @IsOptional()
  @IsString({ message: 'Size must be a string' })
  size?: string;

  @ApiPropertyOptional({ example: 99.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price?: number;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt({ message: 'Stock must be an integer' })
  @Min(0, { message: 'Stock must be greater than or equal to 0' })
  stock: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: 'Active flag must be a boolean' })
  isActive?: boolean;
}
