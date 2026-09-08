import { Injectable } from '@nestjs/common';
import { DocumentChunkIndexPayload } from '../../../search/interfaces/document-chunk-index.interface';
import { ElasticsearchService } from '../../../search/services/elasticsearch.service';
import { DocumentChunk } from '../../../records/entities/document-chunk.entity';
import { Document } from '../../../records/entities/document.entity';
import { Record as RecordEntity } from '../../../records/entities/record.entity';
import { DocumentSearchIndexStatus } from '../../../records/enums/document-search-index-status.enum';

type DocumentSearchIndexingUpdate = {
  searchIndexStatus: DocumentSearchIndexStatus;
  searchIndexedAt?: Date | null;
  searchIndexError?: string | null;
};

@Injectable()
export class DocumentSearchIndexingService {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  isEnabled(): boolean {
    return this.elasticsearchService.isEnabled();
  }

  async deleteIndexedDocumentChunks(documentId: number): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    await this.elasticsearchService.deleteDocumentChunksForDocument(documentId);
  }

  async indexSavedDocumentChunk(
    document: Document,
    chunk: DocumentChunk,
    record?: RecordEntity,
  ): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    await this.elasticsearchService.indexDocumentChunk(
      this.buildDocumentChunkIndexPayload(document, chunk, record),
    );
  }

  async ensureDocumentChunkIndex(): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    await this.elasticsearchService.ensureDocumentChunkIndex();
  }

  createSearchIndexingStartedUpdate(): DocumentSearchIndexingUpdate {
    const isEnabled = this.isEnabled();

    return {
      searchIndexStatus: isEnabled
        ? DocumentSearchIndexStatus.INDEXING
        : DocumentSearchIndexStatus.DISABLED,
      searchIndexedAt: null,
      searchIndexError: null,
    };
  }

  createSearchIndexingCompletedUpdate(): DocumentSearchIndexingUpdate {
    const isEnabled = this.isEnabled();

    return {
      searchIndexStatus: isEnabled
        ? DocumentSearchIndexStatus.INDEXED
        : DocumentSearchIndexStatus.DISABLED,
      searchIndexedAt: isEnabled ? new Date() : null,
      searchIndexError: null,
    };
  }

  createSearchIndexingFailedUpdate(
    errorMessage: string,
  ): DocumentSearchIndexingUpdate {
    const isEnabled = this.isEnabled();

    return {
      searchIndexStatus: isEnabled
        ? DocumentSearchIndexStatus.FAILED
        : DocumentSearchIndexStatus.DISABLED,
      searchIndexedAt: null,
      searchIndexError: isEnabled ? errorMessage : null,
    };
  }

  private buildDocumentChunkIndexPayload(
    document: Document,
    chunk: DocumentChunk,
    record?: RecordEntity,
  ): DocumentChunkIndexPayload {
    const sourceRecord = record ?? document.records;

    return {
      chunkId: chunk.id,
      documentId: document.id,
      recordId: sourceRecord?.id ?? document.recordsId,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      content: chunk.content,
      documentName: document.name ?? undefined,
      recordStatus: sourceRecord?.status,
      firstName: sourceRecord?.firstName,
      lastName: sourceRecord?.lastName,
      email: sourceRecord?.email,
      mobileNumber: sourceRecord?.mobileNumber,
      village: sourceRecord?.village,
      panchayat: sourceRecord?.panchayat,
      district: sourceRecord?.district,
      createdAt: chunk.createdAt ?? new Date(),
    };
  }
}
