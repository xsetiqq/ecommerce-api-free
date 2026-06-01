import { ConfigService } from '@nestjs/config';

export const isDev = (configService: ConfigService): boolean =>
  configService.getOrThrow<string>('NODE_ENV') === 'development';
