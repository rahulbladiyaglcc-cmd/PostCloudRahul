import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Record } from './record.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  houseName: string;

  @Column({ nullable: true })
  houseNumber: string;

  @Column({ nullable: true })
  streetName: string;

  @Column({ nullable: true })
  streetNumber: string;

  @Column({ nullable: true })
  village: string;

  @Column({ nullable: true })
  postOffice: string;

  @Column({ nullable: true })
  locationType: string;

  @ManyToOne(() => Record, (records) => records.addresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recordsId' })
  records:  Relation<Record>;

  @Column({ nullable: false })
  recordsId: number;
}
