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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Authorization } from '../auth/decorators/authorization.decorator';
import { UserRole } from '../generated/prisma';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import {
  FindProductsQueryDto,
  ProductSortBy,
  SortOrder,
} from './dto/find-products-query.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get active products' })
  @ApiQuery({ name: 'categorySlug', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ProductSortBy })
  @ApiQuery({ name: 'order', required: false, enum: SortOrder })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  public async findAll(@Query() query: FindProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get active product by slug' })
  @ApiParam({ name: 'slug', description: 'Product slug' })
  public async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @ApiBearerAuth()
  @Authorization(UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a product' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Product created' })
  public async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @ApiBearerAuth()
  @Authorization(UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  public async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @ApiBearerAuth()
  @Authorization(UserRole.ADMIN)
  @Post(':id/variants')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a product variant' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  public async createVariant(
    @Param('id') productId: string,
    @Body() dto: CreateProductVariantDto,
  ) {
    return this.productsService.createVariant(productId, dto);
  }

  @ApiBearerAuth()
  @Authorization(UserRole.ADMIN)
  @Patch('variants/:variantId')
  @ApiOperation({ summary: 'Update a product variant' })
  @ApiParam({ name: 'variantId', description: 'Product variant ID' })
  public async updateVariant(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(variantId, dto);
  }

  @ApiBearerAuth()
  @Authorization(UserRole.ADMIN)
  @Delete('variants/:variantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a product variant' })
  @ApiParam({ name: 'variantId', description: 'Product variant ID' })
  public async removeVariant(@Param('variantId') variantId: string) {
    return this.productsService.removeVariant(variantId);
  }

  @ApiBearerAuth()
  @Authorization(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  public async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
