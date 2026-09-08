# Development

Development is controlled through Docker Compose from the repository root.

## Start And Stop

```sh
./setup.sh
docker compose up -d
docker compose up --build -d
docker compose down
```

Use `./setup.sh` for first setup or a full dependency/container rebuild. It creates `.env` from `.env.example` when needed, installs service dependencies, and starts Docker Compose.

## Logs And Shells

```sh
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f ocr-worker
docker compose exec backend sh
docker compose exec frontend sh
docker compose exec ocr-worker sh
```

## Service Names

Use these Docker Compose service names:

- `backend`
- `frontend`
- `ocr-worker`
- `postgres_db`
- `redis`
- `pgadmin`

## Rebuilds

Rebuild containers after Dockerfile, package, or dependency changes:

```sh
docker compose up --build -d
```

Use targeted rebuilds when only one service changed:

```sh
docker compose up --build -d backend
docker compose up --build -d frontend
docker compose up --build -d ocr-worker
```

## NestJS Generation

Run Nest CLI through the relevant container:

```sh
docker compose exec backend npx nest g module <name>
docker compose exec backend npx nest g controller <name>
docker compose exec backend npx nest g service <name>
docker compose exec backend npx nest g resource <name>
docker compose exec ocr-worker npx nest g service <name>
```

Do not create new `.spec.ts` files for now unless explicitly requested.

## Troubleshooting

- If the frontend cannot reach the API, check `VITE_API_URL`, `CORS_ORIGINS`, and backend logs.
- If database connection fails, check `DB_HOST=postgres_db` and the PostgreSQL env values.
- If OCR work is not processed, check `redis`, `backend`, and `ocr-worker` logs.
- If generated files do not appear locally, confirm the service has the expected source volume mounted.
