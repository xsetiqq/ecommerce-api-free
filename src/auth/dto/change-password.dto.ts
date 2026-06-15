import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current user password',
    example: 'oldStrongPass123!',
    minLength: 6,
  })
  @IsString({ message: 'Current password must be a string' })
  @IsNotEmpty({ message: 'Current password must not be empty' })
  currentPassword: string;

  @ApiProperty({
    description: 'New user password',
    example: 'newStrongPass123!',
    minLength: 6,
  })
  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password must not be empty' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;

  @ApiProperty({
    description: 'New password confirmation',
    example: 'newStrongPass123!',
    minLength: 6,
  })
  @IsString({ message: 'Password confirmation must be a string' })
  @IsNotEmpty({ message: 'Password confirmation must not be empty' })
  confirmPassword: string;
}
