# Records Module

Owns the six-step record workflow, related record entities, and authorized
record queries.

## Responsibilities

- `RecordsController` and `RecordsService`: create, update, complete, reopen, list, and delete records.
- `RecordQueryService`: reusable permission-scoped queries for records and AI retrieval.
- `entities`: records, addresses, children, policies, documents, and document chunks.
- `dto`: request validation for each workflow step and record search.

## Boundaries

- Records are user-owned. Admins can access completed records plus their own drafts.
- Use `RecordQueryService.guardQueryAccess()` for reusable or cross-module record queries.
- Completed records are not editable unless an admin reopens them.
- Step six queues document embedding through the AI module only after its transaction commits.
- Document extraction status and chunks are persistence concerns; extraction logic belongs to `ai/document-embedding`.
