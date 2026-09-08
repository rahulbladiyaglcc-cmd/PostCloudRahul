export const EMBEDDING_DIMENSIONS = 768;

export function validateEmbedding(embedding: number[]): void {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding model returned ${embedding.length} dimensions; expected ${EMBEDDING_DIMENSIONS}`,
    );
  }

  if (embedding.some((value) => !Number.isFinite(value))) {
    throw new Error('Embedding contains a non-finite value');
  }
}

export function formatPgVector(embedding: number[]): string {
  validateEmbedding(embedding);
  return `[${embedding.join(',')}]`;
}
