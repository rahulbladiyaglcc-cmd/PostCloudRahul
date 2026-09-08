# Backend

NestJS API for Posta Cloud. Start here when working inside `backend/`, then read
only the README for the feature module you are changing.

## Module Map

- [`auth`](src/modules/auth/README.md): JWT authentication and global auth/role guards.
- [`users`](src/modules/users/README.md): user persistence and default admin setup.
- [`records`](src/modules/records/README.md): six-step record workflow and authorized record queries.
- [`ai`](src/modules/ai/README.md): Posta Mitra, document embedding, and RAG.
- [`shared`](src/shared/README.md): queues, Redis, common services, and utilities.

Database migrations live in `database/migrations`.

## Commands

Run backend commands through Docker from the repository root:

```sh
docker compose logs -f backend
docker compose exec backend npm run build
docker compose exec backend npm run seed
docker compose exec backend npm run migration:generate --name=<migration-name>
docker compose exec backend npm run migration:run
```

Project-wide workflow and agent rules live in [`../AGENTS.md`](../AGENTS.md).
System architecture lives in [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).
