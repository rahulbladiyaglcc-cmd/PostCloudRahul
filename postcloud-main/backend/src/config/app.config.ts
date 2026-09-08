import { registerAs } from '@nestjs/config';

const readBooleanEnv = (value: string | undefined, fallback: boolean) => {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  return value.toLowerCase() === 'true';
};

const readNumberEnv = (
  value: string | undefined,
  fallback: number,
  min?: number,
  max?: number,
) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  if (min !== undefined && parsed < min) {
    return min;
  }

  if (max !== undefined && parsed > max) {
    return max;
  }

  return parsed;
};

export default registerAs('config', () => ({
  port: parseInt(process.env.PORT ?? '5001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isDevelopment: (process.env.NODE_ENV ?? 'development') === 'development',
  baseUrl: process.env.BASE_URL ?? 'http://localhost:5001',
  redisHost: process.env.REDIS_HOST ?? 'redis',
  redisPort: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  encryptionKey: process.env.ENCRYPTION_KEY ?? '',
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://ollama:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2:3b',
  ollamaEmbeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'embeddinggemma',
  aiChatEnabled: readBooleanEnv(process.env.AI_CHAT_ENABLED, true),
  documentSearchBm25Enabled: readBooleanEnv(
    process.env.DOCUMENT_SEARCH_BM25_ENABLED,
    false,
  ),
  elasticsearchNode:
    process.env.ELASTICSEARCH_NODE || 'http://elasticsearch:9200',
  elasticsearchIndex: process.env.ELASTICSEARCH_INDEX || 'document_chunks',
  documentSearchVectorWeight: readNumberEnv(
    process.env.DOCUMENT_SEARCH_VECTOR_WEIGHT,
    0.6,
    0,
    1,
  ),
  documentSearchBm25Weight: readNumberEnv(
    process.env.DOCUMENT_SEARCH_BM25_WEIGHT,
    0.4,
    0,
    1,
  ),
  documentSearchBm25ResultLimit: Math.round(
    readNumberEnv(process.env.DOCUMENT_SEARCH_BM25_RESULT_LIMIT, 20, 1),
  ),
}));
