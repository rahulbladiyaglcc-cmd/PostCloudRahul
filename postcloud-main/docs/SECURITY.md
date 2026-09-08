# Security

Posta Cloud handles personal records, uploaded documents, authentication data, and encrypted fields. Treat the repository and runtime data carefully.

## Secrets

Never commit:

- `.env`
- production secrets
- JWT secrets
- encryption keys
- database dumps
- uploaded documents
- real personal data
- generated credentials

Use `.env.example` only for local placeholder values.

## Personal Data

Avoid placing real names, addresses, phone numbers, identity details, documents, or screenshots containing private information in commits, docs, issues, seed files, or tests.

## Encryption

The backend contains encryption utilities and receives `ENCRYPTION_KEY` through Docker Compose. Treat encryption changes as high risk. Do not rotate or change encryption behavior without a migration and data recovery plan.

## Seeds

Seed data must be safe for local development. Seed credentials should come from environment variables or placeholders, not real production credentials.

## Production

Use production-only secrets in the deployment environment. Do not reuse local placeholder values. Confirm CORS origins, upload URLs, database credentials, Redis settings, and encryption/JWT secrets before deployment.
