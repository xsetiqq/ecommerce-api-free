import { Module } from '@nestjs/common';
import { FileStorageController } from './storage.controller';
import { FileStorageService } from './storage.service';

@Module({
  controllers: [FileStorageController],
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class FileStorageModule {}
