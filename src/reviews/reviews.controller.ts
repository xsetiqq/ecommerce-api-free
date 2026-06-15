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
import { Authorized } from '../auth/decorators/authorized.decorator';
import { Authorization } from '../auth/decorators/authorization.decorator';
import { UserRole } from '../generated/prisma';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('products/:productId/reviews')
  @ApiOperation({ summary: 'Get product reviews' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  public async findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @ApiBearerAuth()
  @Authorization(UserRole.USER, UserRole.ADMIN)
  @Post('products/:productId/reviews')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create product review' })
  public async create(
    @Authorized('id') userId: string,
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(userId, productId, dto);
  }

  @ApiBearerAuth()
  @Authorization(UserRole.USER, UserRole.ADMIN)
  @Patch('reviews/:id')
  @ApiOperation({ summary: 'Update own review or any review as admin' })
  public async update(
    @Authorized('id') userId: string,
    @Authorized('role') userRole: UserRole,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(userId, userRole, id, dto);
  }

  @ApiBearerAuth()
  @Authorization(UserRole.USER, UserRole.ADMIN)
  @Delete('reviews/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete own review or any review as admin' })
  public async remove(
    @Authorized('id') userId: string,
    @Authorized('role') userRole: UserRole,
    @Param('id') id: string,
  ) {
    return this.reviewsService.remove(userId, userRole, id);
  }
}
