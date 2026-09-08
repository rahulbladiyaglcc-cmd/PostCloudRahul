import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validateEmbedding } from '../../../../shared/utilities/vector.utility';
import { DocumentChunk } from '../../../records/entities/document-chunk.entity';
import { Document } from '../../../records/entities/document.entity';
import { DocumentExtractionStatus } from '../../../records/enums/document-extraction-status.enum';
import { OllamaService } from '../../ollama/ollama.service';
import { PreparedDocumentChunk } from './document-chunking.service';
import { DocumentSearchIndexingService } from './document-search-indexing.service';

@Injectable()
export class DocumentIngestionService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(DocumentChunk)
    private readonly documentChunkRepository: Repository<DocumentChunk>,
    private readonly ollamaService: OllamaService,
    private readonly documentSearchIndexingService: DocumentSearchIndexingService,
  ) { }

  async ingestDocumentChunks(
    document: Document,
    chunks: PreparedDocumentChunk[],
  ): Promise<void> {
    for (const chunk of chunks) {
      const savedChunk = await this.saveEmbeddedDocumentChunk(document, chunk);
      await this.documentSearchIndexingService.indexSavedDocumentChunk(
        document,
        savedChunk,
      );
    }
  }

  async markDocumentIngestionStarted(documentId: number): Promise<void> {
    await this.documentRepository.update(documentId, {
      extractionStatus: DocumentExtractionStatus.PROCESSING,
      extractionError: null,
      ...this.documentSearchIndexingService.createSearchIndexingStartedUpdate(),
    });
  }

  async markDocumentIngestionCompleted(
    documentId: number,
    contentHash: string,
  ): Promise<void> {
    await this.documentRepository.update(documentId, {
      extractionStatus: DocumentExtractionStatus.READY,
      extractionError: null,
      contentHash,
      indexedAt: new Date(),
      ...this.documentSearchIndexingService.createSearchIndexingCompletedUpdate(),
    });
  }

  async markDocumentIngestionFailed(
    documentId: number,
    error: unknown,
    errorMessage: string,
  ): Promise<void> {
    await this.documentRepository.update(documentId, {
      extractionStatus:
        error instanceof Error && error.message === 'Unsupported document type'
          ? DocumentExtractionStatus.UNSUPPORTED
          : DocumentExtractionStatus.FAILED,
      extractionError: errorMessage,
      ...this.documentSearchIndexingService.createSearchIndexingFailedUpdate(
        errorMessage,
      ),
    });
  }

  private async saveEmbeddedDocumentChunk(
    document: Document,
    chunk: PreparedDocumentChunk,
  ): Promise<DocumentChunk> {
    const embedding = await this.ollamaService.embed(chunk.content);
    validateEmbedding(embedding);

    return this.documentChunkRepository.save({
      documentId: document.id,
      recordsId: document.recordsId,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      content: chunk.content,
      embedding,
    });
  }

  async deleteSavedDocumentChunks(documentId: number): Promise<void> {
    await this.documentChunkRepository.delete({ documentId });
  }
}
