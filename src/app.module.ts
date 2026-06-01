import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FileStorageModule } from './file-storage/storage.module';
import { DeliveryAddressesModule } from './delivery-addresses/delivery-addresses.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { FavoritesModule } from './favorites/favorites.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    FileStorageModule,
    DeliveryAddressesModule,
    CategoriesModule,
    ProductsModule,
    FavoritesModule,
    CartModule,
    OrdersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
