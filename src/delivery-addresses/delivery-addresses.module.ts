import { Module } from '@nestjs/common';
import { DeliveryAddressesController } from './delivery-addresses.controller';
import { DeliveryAddressesService } from './delivery-addresses.service';

@Module({
  controllers: [DeliveryAddressesController],
  providers: [DeliveryAddressesService],
  exports: [DeliveryAddressesService],
})
export class DeliveryAddressesModule {}
