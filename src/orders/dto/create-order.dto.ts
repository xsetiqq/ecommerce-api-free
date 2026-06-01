import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'delivery-address-id' })
  @IsOptional()
  @IsString({ message: 'Delivery address ID must be a string' })
  deliveryAddressId?: string;

  @ApiPropertyOptional({
    example: 'Krakowskie Przedmieście 10A/12, 20-002 Lublin, Poland',
  })
  @IsOptional()
  @IsString({ message: 'Delivery address must be a string' })
  deliveryAddress?: string;

  @ApiPropertyOptional({ example: '+48123456789' })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Call before delivery' })
  @IsOptional()
  @IsString({ message: 'Comment must be a string' })
  comment?: string;
}
