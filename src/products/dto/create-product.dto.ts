import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro' })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title must not be empty' })
  title: string;

  @ApiProperty({ example: 'iphone-15-pro' })
  @IsString({ message: 'Slug must be a string' })
  @IsNotEmpty({ message: 'Slug must not be empty' })
  slug: string;

  @ApiProperty({ example: 'Apple smartphone with 256 GB storage' })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description must not be empty' })
  description: string;

  @ApiProperty({ example: 4999.99 })
  @Type(() => Number)
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price: number;

  @ApiPropertyOptional({ example: 5499.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Old price must be a number' })
  @Min(0, { message: 'Old price must be greater than or equal to 0' })
  oldPrice?: number;

  @ApiPropertyOptional({ example: 'https://example.com/products/iphone.webp' })
  @IsOptional()
  @IsString({ message: 'Image URL must be a string' })
  imageUrl?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://example.com/1.webp'],
  })
  @IsOptional()
  @IsArray({ message: 'Images must be an array' })
  @IsString({ each: true, message: 'Each image must be a string' })
  images?: string[];

  @ApiPropertyOptional({ example: 10, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Stock must be an integer' })
  @Min(0, { message: 'Stock must be greater than or equal to 0' })
  stock?: number;

  @ApiPropertyOptional({ example: 4.8 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Rating must be a number' })
  @Min(0, { message: 'Rating must be greater than or equal to 0' })
  rating?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: 'Active flag must be a boolean' })
  isActive?: boolean;

  @ApiProperty({ example: 'category-id' })
  @IsString({ message: 'Category ID must be a string' })
  @IsNotEmpty({ message: 'Category ID must not be empty' })
  categoryId: string;
}
