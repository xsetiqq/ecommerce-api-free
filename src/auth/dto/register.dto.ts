import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterRequest {
  @ApiProperty({ description: 'User first name', example: 'John' })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name must not be empty' })
  @MaxLength(50, {
    message: 'First name must be shorter than or equal to 50 characters',
  })
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name must not be empty' })
  @MaxLength(50, {
    message: 'Last name must be shorter than or equal to 50 characters',
  })
  lastName: string;

  @ApiPropertyOptional({
    description: 'User date of birth in ISO date format',
    example: '2001-05-20',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid ISO date' })
  dateOfBirth?: string;

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
