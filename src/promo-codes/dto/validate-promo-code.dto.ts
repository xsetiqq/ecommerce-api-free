import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidatePromoCodeDto {
  @ApiProperty({ example: 'SUMMER10' })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Code must not be empty' })
  code: string;
}
