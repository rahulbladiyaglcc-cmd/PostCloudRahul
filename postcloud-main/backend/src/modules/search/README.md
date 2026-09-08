# Search Module

Owns optional search infrastructure adapters.

## Boundaries

- Elasticsearch is disabled by default through `DOCUMENT_SEARCH_BM25_ENABLED`.
- `ElasticsearchService` owns client setup, health checks, index creation, chunk indexing, chunk deletion, and BM25 queries.
- Elasticsearch stores redacted chunk text and metadata only; embeddings stay in PostgreSQL/pgvector.
- RAG authorization does not happen in Elasticsearch. Elasticsearch returns candidate chunk IDs, and final chunks are fetched through guarded PostgreSQL queries.
- Hybrid ranking lives in `ai/rag/DocumentHybridSearchService`.

Useful local checks:

```sh
curl "http://localhost:9200/document_chunks/_count?pretty"
curl "http://localhost:9200/document_chunks/_search?pretty&size=5"
curl "http://localhost:9200/document_chunks/_mapping?pretty"
```
