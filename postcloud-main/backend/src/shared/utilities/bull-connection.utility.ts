import { ConfigService } from '@nestjs/config';
import { ConnectionOptions } from 'bullmq';

export const getBullConnection = (
  configService: ConfigService,
): ConnectionOptions => ({
  host: configService.get<string>('config.redisHost'),
  port: configService.get<number>('config.redisPort'),
});
