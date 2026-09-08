import { Record } from './record.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';

@Entity('policies')
export class Policy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  type: string ;

  @Column({ nullable: true })
  number: string ;

  @ManyToOne(() => Record, (records) => records.policies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recordsId' })
  records: Relation<Record>;

  @Column({ nullable: false })
  recordsId: number;
}
