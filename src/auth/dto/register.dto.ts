import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterRequest {
  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name must not be empty' })
  name: string;

  @ApiProperty({
    description: 'Unique user email',
    example: 'ivan_dev@example.com',
  })
  @IsString({ message: 'Email must be a string' })
  @IsNotEmpty({ message: 'Email must not be empty' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'strongPass123!',
    minLength: 6,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password must not be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiPropertyOptional({
    description: 'Profile photo URL',
    example: 'https://example.com/avatars/ivan.jpg',
  })
  @IsOptional()
  @IsString({ message: 'Photo URL must be a string' })
  photoUrl?: string;
}
