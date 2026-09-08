import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { EMBEDDING_DIMENSIONS } from '../../../shared/utilities/vector.utility';
import { Document } from './document.entity';

@Entity('document_chunks')
export class DocumentChunk {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  documentId: number;

  @ManyToOne(() => Document, (document) => document.chunks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'documentId' })
  document: Relation<Document>;

  @Column()
  recordsId: number;

  @Column()
  chunkIndex: number;

  @Column({ nullable: true })
  pageNumber?: number;

  @Column({ type: 'text' })
  content: string;

  @Column('vector' as never, { length: EMBEDDING_DIMENSIONS })
  embedding: number[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
