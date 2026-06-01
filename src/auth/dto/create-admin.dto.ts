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
    description: 'Имя администратора',
    example: 'Admin User',
  })
  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Имя не должно быть пустым' })
  name: string;

  @ApiProperty({
    description: 'Уникальный email администратора',
    example: 'admin@example.com',
  })
  @IsString({ message: 'Email должен быть строкой' })
  @IsNotEmpty({ message: 'Email не должен быть пустым' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Пароль администратора',
    example: 'strongAdminPass123!',
    minLength: 6,
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль не должен быть пустым' })
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  password: string;

  @ApiPropertyOptional({
    description: 'URL адрес фотографии профиля',
    example: 'https://example.com/avatars/admin.jpg',
  })
  @IsOptional()
  @IsString({ message: 'URL фото должен быть строкой' })
  photoUrl?: string;
}
