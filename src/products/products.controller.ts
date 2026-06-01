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
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get active products' })
  @ApiQuery({ name: 'categorySlug', required: false })
  public async findAll(@Query('categorySlug') categorySlug?: string) {
    return this.productsService.findAll(categorySlug);
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
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  public async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
