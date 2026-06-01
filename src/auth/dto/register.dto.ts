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
    description: 'Имя пользователя',
    example: 'Иван Иванов',
  })
  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Имя не должно быть пустым' })
  name: string;

  @ApiProperty({
    description: 'Уникальный email пользователя',
    example: 'ivan_dev@example.com',
  })
  @IsString({ message: 'Email должен быть строкой' })
  @IsNotEmpty({ message: 'Email не должен быть пустым' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'strongPass123!',
    minLength: 6,
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль не должен быть пустым' })
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  password: string;

  @ApiPropertyOptional({
    description: 'URL адрес фотографии профиля',
    example: 'https://example.com/avatars/ivan.jpg',
  })
  @IsOptional()
  @IsString({ message: 'URL фото должен быть строкой' })
  photoUrl?: string;
}
