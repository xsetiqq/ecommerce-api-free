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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Authorization } from '../auth/decorators/authorization.decorator';
import { Authorized } from '../auth/decorators/authorized.decorator';
import { UserRole } from '../generated/prisma';
import { DeliveryAddressesService } from './delivery-addresses.service';
import { CreateDeliveryAddressDto } from './dto/create-delivery-address.dto';
import { UpdateDeliveryAddressDto } from './dto/update-delivery-address.dto';

@ApiTags('Delivery Addresses')
@ApiBearerAuth()
@Authorization(UserRole.USER, UserRole.ADMIN)
@Controller('delivery-addresses')
export class DeliveryAddressesController {
  constructor(
    private readonly deliveryAddressesService: DeliveryAddressesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current user delivery addresses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery addresses successfully retrieved',
  })
  public async findAll(@Authorized('id') userId: string) {
    return this.deliveryAddressesService.findAll(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a delivery address for current user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Delivery address successfully created',
  })
  public async create(
    @Authorized('id') userId: string,
    @Body() dto: CreateDeliveryAddressDto,
  ) {
    return this.deliveryAddressesService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update current user delivery address' })
  @ApiParam({ name: 'id', description: 'Delivery address ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery address successfully updated',
  })
  public async update(
    @Authorized('id') userId: string,
    @Param('id') addressId: string,
    @Body() dto: UpdateDeliveryAddressDto,
  ) {
    return this.deliveryAddressesService.update(userId, addressId, dto);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set current user default delivery address' })
  @ApiParam({ name: 'id', description: 'Delivery address ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Default delivery address successfully updated',
  })
  public async setDefault(
    @Authorized('id') userId: string,
    @Param('id') addressId: string,
  ) {
    return this.deliveryAddressesService.setDefault(userId, addressId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete current user delivery address' })
  @ApiParam({ name: 'id', description: 'Delivery address ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery address successfully deleted',
  })
  public async remove(
    @Authorized('id') userId: string,
    @Param('id') addressId: string,
  ) {
    return this.deliveryAddressesService.remove(userId, addressId);
  }
}
