import { Module } from '@nestjs/common';
import { PromoCodesModule } from '../promo-codes/promo-codes.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PromoCodesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
