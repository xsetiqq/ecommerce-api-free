import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRoles } from '../../generated/prisma/edge';

export class RegisterRequest {
  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Иван Иванов',
  })
  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Имя не должно быть пустым' })
  name: string;

  @ApiProperty({
    description: 'Уникальный логин пользователя',
    example: 'ivan_dev',
  })
  @IsString({ message: 'Логин должен быть строкой' })
  @IsNotEmpty({ message: 'Логин не должен быть пустым' })
  login: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'strongPass123!',
    minLength: 6,
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль не должен быть пустым' })
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  passwordHash: string;

  @ApiPropertyOptional({
    description: 'URL адрес фотографии профиля',
    example: 'https://example.com/avatars/ivan.jpg',
  })
  @IsOptional()
  @IsString({ message: 'URL фото должен быть строкой' })
  photoUrl?: string;

  @ApiProperty({ enum: UserRoles, default: UserRoles.VIEWER })
  @IsNotEmpty({ message: 'Роль пользователя не должна быть пустой' })
  @IsEnum(UserRoles)
  role: UserRoles;
}
