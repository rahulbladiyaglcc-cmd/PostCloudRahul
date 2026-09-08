import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RedisService } from './redis.service';
import {
  OCR_IDENTITY_EXTRACTION_JOB,
  OCR_IMAGE_TEXT_EXTRACTION_JOB,
  OCR_QUEUE,
} from '../constants/queue.constants';
import { BullQueueEventsService } from './bull-queue-events.service';
import { StorageService } from './storage.service';
import { TRANSIENT_BUCKET } from '../constants/storage.constants';

const OCR_WORKER_HEARTBEAT_KEY = 'ocr_worker:heartbeat';

@Injectable()
export class OcrService {
  constructor(
    @InjectQueue(OCR_QUEUE) private ocrQueue: Queue,
    private redisService: RedisService,
    private readonly bullQueueEventsService: BullQueueEventsService,
    private readonly storageService: StorageService,
  ) {}

  async uploadAndQueue(
    file: Express.Multer.File,
    userId: number,
    documentType?: string,
  ) {
    const key = this.storageService.createAutofillKey(
      userId,
      file.originalname,
    );
    const reference = await this.storageService.upload(TRANSIENT_BUCKET, key, file);
    const job = await this.ocrQueue.add(OCR_IDENTITY_EXTRACTION_JOB, {
      storageReference: reference,
      deleteAfterProcessing: true,
      documentType,
    });

    return { jobId: job.id };
  }

  async extractImageText(
    storageReference: string,
    deleteAfterProcessing = false,
  ): Promise<string> {
    const job = await this.ocrQueue.add(OCR_IMAGE_TEXT_EXTRACTION_JOB, {
      storageReference,
      deleteAfterProcessing,
    });
    
    const result = await this.bullQueueEventsService.waitForJob<{ text?: string }>(
      OCR_QUEUE,
      job,
      120_000,
    );

    return result.text ?? '';
  }

  async getServiceStatus() {
    try {
      const redis = this.redisService.getClient();
      const lastHeartbeat = await redis.get(OCR_WORKER_HEARTBEAT_KEY);
      const workers = await this.ocrQueue.getWorkers();
      const hasActiveWorker = workers.length > 0;

      return {
        enabled: Boolean(lastHeartbeat) || hasActiveWorker,
        lastHeartbeat,
        workers: workers.length,
      };
    } catch (err: any) {
      return {
        enabled: false,
        error: err.message || 'Unable to check OCR service status',
      };
    }
  }

  async getJobResult(jobId: string) {
    const job = await this.ocrQueue.getJob(jobId);
    const redis = this.redisService.getClient();

    if (!job) {
      return { error: "Job not found" };
    }

    try {
      const redisData = await redis.get(`ocr_result:${jobId}`);

      if (!redisData) {
        return { pending: true };
      }

      let result = null;
      try {
        result = JSON.parse(redisData);
      } catch (parseError) {
        return { error: "Invalid JSON in Redis" };
      }

      if (result?.success === false) {
        await redis.del(`ocr_result:${jobId}`);
        return { error: result.error || 'OCR processing failed' };
      }

      if (result?.success === true) {
        await redis.del(`ocr_result:${jobId}`);
        return result.data ?? {};
      }

      await redis.del(`ocr_result:${jobId}`);
      return { ... result };
    } catch (err: any) {
      return { error: err.message || "Unknown error" };
    }
  }
}
