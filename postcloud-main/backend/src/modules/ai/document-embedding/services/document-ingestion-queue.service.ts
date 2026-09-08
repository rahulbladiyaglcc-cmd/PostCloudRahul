import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  DOCUMENT_EMBEDDING_JOB,
  DOCUMENT_EMBEDDING_QUEUE,
} from 'src/shared/constants/document-embedding.constants';

@Injectable()
export class DocumentIngestionQueueService {
  constructor(
    @InjectQueue(DOCUMENT_EMBEDDING_QUEUE)
    private readonly documentIngestionQueue: Queue,
  ) {}

  async queueDocuments(documentIds: number[]): Promise<void> {
    await Promise.all(
      documentIds.map((documentId) =>
        this.documentIngestionQueue.add(
          DOCUMENT_EMBEDDING_JOB,
          { documentId },
          {
            attempts: 2,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: 200,
            removeOnFail: 500,
          },
        ),
      ),
    );
  }
}
