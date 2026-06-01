import { DocumentBuilder } from '@nestjs/swagger';

export function getSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Ecommerce-api-free')
    .setDescription('Special for RSSchool students')
    .setVersion('1.0')
    .addBasicAuth()
    .build();
}
