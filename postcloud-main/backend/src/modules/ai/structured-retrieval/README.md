# Structured Retrieval

Handles AI requests that use structured record data instead of document vectors.

- `StructuredRetrievalService` owns record search, pagination, and safe summaries.
- All record reads go through `RecordQueryService`.
- `StructuredRetrievalContextService` stores only the latest search filters and pagination state in Redis.
- Keep full records, chat transcripts, and raw model output out of Redis.
