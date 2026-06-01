import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FileStorageModule } from './file-storage/storage.module';
import { DeliveryAddressesModule } from './delivery-addresses/delivery-addresses.module';

@Module({
  imports: [
    // CategoriesModule,
    // ProductsModule,
    // CartModule,
    // OrdersModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    FileStorageModule,
    DeliveryAddressesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
