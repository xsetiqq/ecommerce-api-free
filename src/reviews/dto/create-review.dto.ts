import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be greater than or equal to 1' })
  @Max(5, { message: 'Rating must be less than or equal to 5' })
  rating: number;

  @ApiPropertyOptional({ example: 'Great product' })
  @IsOptional()
  @IsString({ message: 'Comment must be a string' })
  comment?: string;
}
