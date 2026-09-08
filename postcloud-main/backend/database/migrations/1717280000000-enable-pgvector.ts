import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnablePgvector1717280000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
  }

  async down(): Promise<void> {}
}
