import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { DOCUMENT_EMBEDDING_QUEUE } from '../../../shared/constants/document-embedding.constants';
import { Document } from '../../records/entities/document.entity';
import { DocumentChunkingService } from './services/document-chunking.service';
import { DocumentIngestionService } from './services/document-ingestion.service';
import { DocumentParserService } from './services/document-parser.service';
import { DocumentSearchIndexingService } from './services/document-search-indexing.service';

@Processor(DOCUMENT_EMBEDDING_QUEUE, { concurrency: 1 })
export class DocumentIngestionProcessor extends WorkerHost {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly documentParserService: DocumentParserService,
    private readonly documentChunkingService: DocumentChunkingService,
    private readonly documentIngestionService: DocumentIngestionService,
    private readonly documentSearchIndexingService: DocumentSearchIndexingService,
  ) {
    super();
  }

  async process(job: Job<{ documentId: number }>): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id: job.data.documentId },
      relations: { records: true },
    });
    if (!document) {
      return;
    }

    await this.documentIngestionService.markDocumentIngestionStarted(
      document.id,
    );

    try {
      await this.documentIngestionService.deleteSavedDocumentChunks(
        document.id,
      );

      // Only delete from search index if enabled, otherwise it will be a no-op but will still consume time
      if (this.documentSearchIndexingService.isEnabled()) {
        await this.documentSearchIndexingService.ensureDocumentChunkIndex();
        await this.documentSearchIndexingService.deleteIndexedDocumentChunks(
          document.id,
        );
      }

      const pages = await this.documentParserService.extract(document.file);
      const chunks = this.documentChunkingService.prepareDocumentChunks(pages);
      if (chunks.length === 0) {
        throw new Error('No usable text was found in this document');
      }

      await this.documentIngestionService.ingestDocumentChunks(
        document,
        chunks,
      );

      await this.documentIngestionService.markDocumentIngestionCompleted(
        document.id,
        this.documentChunkingService.createDocumentChunksHash(chunks),
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : 'Document indexing failed';
      await this.documentIngestionService.markDocumentIngestionFailed(
        document.id,
        error,
        errorMessage,
      );
      throw error;
    }
  }
}
