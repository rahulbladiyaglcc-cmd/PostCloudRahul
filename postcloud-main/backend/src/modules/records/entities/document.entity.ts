import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import { Record } from './record.entity';
import { DocumentExtractionStatus } from '../enums/document-extraction-status.enum';
import { DocumentChunk } from './document-chunk.entity';
import { DocumentSearchIndexStatus } from '../enums/document-search-index-status.enum';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string ;

  @Column({ nullable: true })
  file: string ;

  @Column({ nullable: true })
  mimeType?: string;

  @Column({
    type: 'enum',
    enum: DocumentExtractionStatus,
    default: DocumentExtractionStatus.PENDING,
  })
  extractionStatus: DocumentExtractionStatus;

  @Column({ type: 'text', nullable: true })
  extractionError?: string;

  @Column({ nullable: true })
  contentHash?: string;

  @Column({ type: 'timestamp', nullable: true })
  indexedAt?: Date;

  @Column({
    type: 'enum',
    enum: DocumentSearchIndexStatus,
    default: DocumentSearchIndexStatus.NOT_INDEXED,
  })
  searchIndexStatus: DocumentSearchIndexStatus;

  @Column({ type: 'timestamp', nullable: true })
  searchIndexedAt?: Date;

  @Column({ type: 'text', nullable: true })
  searchIndexError?: string;

  @OneToMany(() => DocumentChunk, (chunk) => chunk.document, {
    cascade: true,
  })
  chunks: Relation<DocumentChunk>[];

  @ManyToOne(() => Record, (records) => records.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recordsId' })
  records:  Relation<Record>;

  @Column({ nullable: false })
  recordsId: number;
}
