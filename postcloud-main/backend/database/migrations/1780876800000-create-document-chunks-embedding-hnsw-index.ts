import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentChunksEmbeddingHnswIndex1780876800000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_document_chunks_embedding"
      ON "document_chunks"
      USING hnsw ("embedding" vector_cosine_ops)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_document_chunks_embedding"
    `);
  }
}
