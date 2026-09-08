import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OcrProcessor } from './ocr.processor';
import { RedisModule } from './redis.module';
import { StorageService } from './storage.service';

@Module({
  imports: [
    RedisModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'redis',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    BullModule.registerQueue({
      name: process.env.OCR_QUEUE_NAME || 'ocr-queue',
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 200,
        removeOnFail: 500,
      },
    }),
  ],
  exports: [],
  providers: [OcrProcessor, StorageService],
})
export class WorkerModule {}
