import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({
    description: 'Admin name',
    example: 'Admin User',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name must not be empty' })
  name: string;

  @ApiProperty({
    description: 'Unique admin email',
    example: 'admin@example.com',
  })
  @IsString({ message: 'Email must be a string' })
  @IsNotEmpty({ message: 'Email must not be empty' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'strongAdminPass123!',
    minLength: 6,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password must not be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiPropertyOptional({
    description: 'Profile photo URL',
    example: 'https://example.com/avatars/admin.jpg',
  })
  @IsOptional()
  @IsString({ message: 'Photo URL must be a string' })
  photoUrl?: string;
}
