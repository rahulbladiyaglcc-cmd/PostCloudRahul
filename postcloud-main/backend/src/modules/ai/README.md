# AI Module

Owns Posta Mitra, document ingestion, document indexing, and document RAG.

## Local Map

- [`ai-chat`](ai-chat/README.md): classifies, validates, and routes user messages.
- [`structured-retrieval`](structured-retrieval/README.md): handles database-backed AI actions.
- [`rag`](rag/README.md): answers from authorized document chunks using vector search with optional BM25 hybrid retrieval.
- [`document-embedding`](document-embedding/README.md): prepares, embeds, and optionally BM25-indexes uploaded documents for RAG.
- [`ollama`](ollama/README.md): generic local model adapter.
- `prompts`, `dto`, and `enums`: shared AI contracts.

## Boundaries

- Database access and record authorization belong to `records/RecordQueryService`.
- `OllamaService` must not know about records, RAG, prompts, or response construction.
- Treat Ollama intent output and uploaded document content as untrusted.
- Send only authorized, redacted document chunks to Ollama.
- Records may import `DocumentIngestionQueueService`; other AI internals stay inside this module.
- Elasticsearch can suggest chunk IDs, but final RAG chunks must be fetched from PostgreSQL through authorized queries.

Supported intent values are defined in `AiChatIntent`. Runtime settings use
`AI_CHAT_ENABLED`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, and
`OLLAMA_EMBEDDING_MODEL`. Optional BM25 document search uses
`DOCUMENT_SEARCH_BM25_ENABLED`, `ELASTICSEARCH_NODE`, `ELASTICSEARCH_INDEX`,
`DOCUMENT_SEARCH_VECTOR_WEIGHT`, `DOCUMENT_SEARCH_BM25_WEIGHT`, and
`DOCUMENT_SEARCH_BM25_RESULT_LIMIT`.
