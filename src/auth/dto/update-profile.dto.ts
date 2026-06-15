import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Tsimafei Liauchuk' })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MaxLength(100, {
    message: 'Name must be shorter than or equal to 100 characters',
  })
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.webp' })
  @IsOptional()
  @IsString({ message: 'Photo URL must be a string' })
  @MaxLength(500, {
    message: 'Photo URL must be shorter than or equal to 500 characters',
  })
  photoUrl?: string;
}
