import {
  Body,
  Controller,
  Delete,
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
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@Authorization(UserRole.USER, UserRole.ADMIN)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  public async findAll(@Authorized('id') userId: string) {
    return this.cartService.findAll(userId);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a product to current user cart' })
  public async add(
    @Authorized('id') userId: string,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.add(userId, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update current user cart item quantity' })
  @ApiParam({ name: 'id', description: 'Cart item ID' })
  public async update(
    @Authorized('id') userId: string,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.update(userId, itemId, dto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an item from current user cart' })
  @ApiParam({ name: 'id', description: 'Cart item ID' })
  public async remove(
    @Authorized('id') userId: string,
    @Param('id') itemId: string,
  ) {
    return this.cartService.remove(userId, itemId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear current user cart' })
  public async clear(@Authorized('id') userId: string) {
    return this.cartService.clear(userId);
  }
}
