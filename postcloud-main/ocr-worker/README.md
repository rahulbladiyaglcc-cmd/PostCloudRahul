# OCR Worker

The OCR worker is a containerized NestJS-style service that consumes Redis OCR jobs and downloads files from private MinIO buckets.

## Docker Workflow

From the repository root:

```sh
docker compose up -d ocr-worker
docker compose logs -f ocr-worker
docker compose exec ocr-worker sh
```

The development compose file mounts `./ocr-worker:/app`. MinIO access uses the
restricted `S3_OCR_ACCESS_KEY` and `S3_OCR_SECRET_KEY` credentials.

## Key Paths

- Entrypoint: `src/main.ts`
- Worker module: `src/worker.module.ts`
- OCR processor: `src/ocr.processor.ts`
- Redis integration: `src/redis.module.ts`, `src/redis.service.ts`
- Tesseract data: `eng.traineddata`

## Common Tasks

```sh
docker compose exec ocr-worker npx nest g module <name>
docker compose exec ocr-worker npx nest g service <name>
```

Agent rules for Nest CLI and specs live in [../AGENTS.md](../AGENTS.md).
