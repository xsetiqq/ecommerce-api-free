import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDeliveryAddressDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name must not be empty' })
  fullName: string;

  @ApiProperty({ example: '+48123456789' })
  @IsString({ message: 'Phone must be a string' })
  @IsNotEmpty({ message: 'Phone must not be empty' })
  phone: string;

  @ApiPropertyOptional({ example: 'Poland' })
  @IsOptional()
  @IsString({ message: 'Country must be a string' })
  country?: string;

  @ApiProperty({ example: 'Lublin' })
  @IsString({ message: 'City must be a string' })
  @IsNotEmpty({ message: 'City must not be empty' })
  city: string;

  @ApiProperty({ example: 'Krakowskie Przedmieście' })
  @IsString({ message: 'Street must be a string' })
  @IsNotEmpty({ message: 'Street must not be empty' })
  street: string;

  @ApiProperty({ example: '10A' })
  @IsString({ message: 'Building must be a string' })
  @IsNotEmpty({ message: 'Building must not be empty' })
  building: string;

  @ApiPropertyOptional({ example: '12' })
  @IsOptional()
  @IsString({ message: 'Apartment must be a string' })
  apartment?: string;

  @ApiPropertyOptional({ example: '20-002' })
  @IsOptional()
  @IsString({ message: 'Postal code must be a string' })
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Call before delivery' })
  @IsOptional()
  @IsString({ message: 'Comment must be a string' })
  comment?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean({ message: 'Default flag must be a boolean' })
  isDefault?: boolean;
}
