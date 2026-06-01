import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites')
@ApiBearerAuth()
@Authorization(UserRole.USER, UserRole.ADMIN)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user favorite products' })
  public async findAll(@Authorized('id') userId: string) {
    return this.favoritesService.findAll(userId);
  }

  @Post(':productId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a product to favorites' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  public async add(
    @Authorized('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.favoritesService.add(userId, productId);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a product from favorites' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  public async remove(
    @Authorized('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.favoritesService.remove(userId, productId);
  }
}
