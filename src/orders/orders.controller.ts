import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Authorization } from '../auth/decorators/authorization.decorator';
import { Authorized } from '../auth/decorators/authorized.decorator';
import { UserRole } from '../generated/prisma';
import type { AuthorizedUser } from '../auth/interfaces/authorized-user.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Authorization(UserRole.USER, UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an order from current user cart' })
  public async create(
    @Authorized('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(userId, dto);
  }

  @Authorization(UserRole.USER, UserRole.ADMIN)
  @Get('my')
  @ApiOperation({ summary: 'Get current user orders' })
  public async findMy(@Authorized('id') userId: string) {
    return this.ordersService.findMy(userId);
  }

  @Authorization(UserRole.USER, UserRole.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  public async findOne(
    @Authorized() user: AuthorizedUser,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.findOne(user.id, user.role, orderId);
  }

  @Authorization(UserRole.ADMIN)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  public async updateStatus(
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(orderId, dto);
  }
}
