# RAG

Answers questions using indexed document chunks.

- `RecordRagService` supports one-record questions and cross-record semantic search.
- `DocumentHybridSearchService` embeds retrieval logic for pgvector plus optional Elasticsearch BM25.
- When BM25 is disabled, retrieve by pgvector cosine distance only.
- When BM25 is enabled, merge pgvector and BM25 ranks with configured weights.
- Apply `RecordQueryService.guardQueryAccess()` before returning final chunks.
- Send only retrieved redacted chunks to Ollama.
- Return record results plus document name, record ID, and page citations.

Elasticsearch is only used to suggest candidate chunk IDs. Final chunks are
always fetched from PostgreSQL through authorized queries before they are sent
to Ollama.
