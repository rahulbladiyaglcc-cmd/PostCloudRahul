import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('config.redisHost');
    const port = this.configService.get<number>('config.redisPort');

    this.client = new Redis({
      host,
      port,
    });

    this.client.on('ready', () => {
      this.logger.log(`Redis connection ready at ${host}:${port}.`);
    });

    this.client.on('reconnecting', (delay) => {
      this.logger.warn(`Redis reconnecting in ${delay}ms.`);
    });

    this.client.on('close', () => {
      this.logger.warn('Redis connection closed.');
    });

    this.client.on('error', (error: Error) => {
      this.logger.error(`Redis connection error: ${error.message}`);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) {
      return;
    }

    await this.client.quit();
  }
}
