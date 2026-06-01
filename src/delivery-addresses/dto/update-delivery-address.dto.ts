import { PartialType } from '@nestjs/swagger';
import { CreateDeliveryAddressDto } from './create-delivery-address.dto';

export class UpdateDeliveryAddressDto extends PartialType(
  CreateDeliveryAddressDto,
) {}
