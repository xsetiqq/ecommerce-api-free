import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ example: 'product-id' })
  @IsString({ message: 'Product ID must be a string' })
  @IsNotEmpty({ message: 'Product ID must not be empty' })
  productId: string;

  @ApiPropertyOptional({ example: 'variant-id' })
  @IsOptional()
  @IsString({ message: 'Variant ID must be a string' })
  variantId?: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be greater than or equal to 1' })
  quantity: number;
}
