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
import { UserRole } from '../generated/prisma';
import { Authorization } from '../auth/decorators/authorization.decorator';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { ValidatePromoCodeDto } from './dto/validate-promo-code.dto';
import { PromoCodesService } from './promo-codes.service';

@ApiTags('Promo codes')
@Controller('promo-codes')
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @ApiBearerAuth()
  @Authorization(UserRole.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all promo codes' })
  public async findAll() {
    return this.promoCodesService.findAll();
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a promo code by code' })
  public async validate(@Body() dto: ValidatePromoCodeDto) {
    return this.promoCodesService.findActiveByCode(dto.code);
  }

  @ApiBearerAuth()
  @Authorization(UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a promo code' })
  public async create(@Body() dto: CreatePromoCodeDto) {
    return this.promoCodesService.create(dto);
  }

  @ApiBearerAuth()
  @Authorization(UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a promo code' })
  @ApiParam({ name: 'id', description: 'Promo code ID' })
  public async update(
    @Param('id') id: string,
    @Body() dto: UpdatePromoCodeDto,
  ) {
    return this.promoCodesService.update(id, dto);
  }

  @ApiBearerAuth()
  @Authorization(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a promo code' })
  @ApiParam({ name: 'id', description: 'Promo code ID' })
  public async remove(@Param('id') id: string) {
    return this.promoCodesService.remove(id);
  }
}
