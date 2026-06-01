import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../generated/prisma';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PROCESSING })
  @IsEnum(OrderStatus, { message: 'Status must be a valid order status' })
  status: OrderStatus;
}
