# Ollama

Generic adapter for the local Ollama APIs.

- `chat()` accepts prompts and returns model text.
- `embed()` returns an embedding for supplied text.
- Keep prompts, domain decisions, record data shaping, and RAG logic outside this folder.
- Feature availability and model endpoints come from backend configuration.

Pull the configured chat and embedding models before using AI:

```sh
docker compose exec ollama ollama pull llama3.2:3b
docker compose exec ollama ollama pull embeddinggemma
```
