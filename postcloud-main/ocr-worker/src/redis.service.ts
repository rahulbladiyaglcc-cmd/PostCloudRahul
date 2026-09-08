import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

const OCR_WORKER_HEARTBEAT_KEY = 'ocr_worker:heartbeat';
const HEARTBEAT_INTERVAL_MS = 5000;
const HEARTBEAT_TTL_SECONDS = 15;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private heartbeatTimer?: ReturnType<typeof setInterval>;

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'redis';
    const port = Number(process.env.REDIS_PORT) || 6379;

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

    this.startHeartbeat();
  }

  async onModuleDestroy() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    if (!this.client) {
      return;
    }

    await this.client.del(OCR_WORKER_HEARTBEAT_KEY);
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  private startHeartbeat(): void {
    void this.publishHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      void this.publishHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);
  }

  private async publishHeartbeat(): Promise<void> {
    try {
      await this.client.set(
        OCR_WORKER_HEARTBEAT_KEY,
        new Date().toISOString(),
        'EX',
        HEARTBEAT_TTL_SECONDS,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to publish OCR worker heartbeat: ${message}`);
    }
  }
}
