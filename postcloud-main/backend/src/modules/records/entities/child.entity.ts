import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Record } from './record.entity';
import { Gender } from '../enums/gender.enum';

@Entity('children')
export class Child {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.OTHER,
    nullable: true,
  })
  gender: Gender;

  @ManyToOne(() => Record, (records) => records.children, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recordsId' })
  records:  Relation<Record>;

  @Column({ nullable: false })
  recordsId: number;
}
