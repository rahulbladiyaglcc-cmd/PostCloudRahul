# Document Embedding

Converts uploaded record documents into redacted chunks, stores embeddings in PostgreSQL/pgvector, and optionally indexes chunk text in Elasticsearch for BM25 search.

- `DocumentIngestionQueueService` queues document IDs after record step six commits.
- `DocumentParserService` parses text PDFs and sends images or rendered scanned pages to OCR.
- Scanned PDFs are processed sequentially at scale `2` and limited to 10 pages.
- Temporary rendered pages must always be deleted.
- `DocumentChunkingService` owns redaction, chunking, and content hashes.
- `DocumentIngestionProcessor` runs the background ingestion pipeline.
- `DocumentIngestionService` owns document status changes, old chunk cleanup, embedding generation, embedding validation, and PostgreSQL chunk persistence.
- `DocumentSearchIndexingService` owns Elasticsearch index updates and search-index status update payloads.
- Validate embeddings with `shared/utilities/vector.utility.ts`.

## Flow

```text
Document queued
  -> parse text or OCR pages
  -> redact and split into chunks
  -> generate and validate embedding for each chunk
  -> save chunk and embedding in PostgreSQL
  -> if BM25 is enabled, index saved chunk text and metadata in Elasticsearch
```

PostgreSQL is the source of truth. Embeddings are not stored in Elasticsearch.
Elasticsearch indexing happens only after embedding generation, embedding
validation, and PostgreSQL chunk save all succeed.
