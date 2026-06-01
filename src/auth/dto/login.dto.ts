import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginRequest {
  @ApiProperty({
    description: 'User email',
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
}
