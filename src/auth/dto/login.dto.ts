import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginRequest {
  @ApiProperty({
    description: 'Email пользователя',
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
  passwordHash: string;
}
