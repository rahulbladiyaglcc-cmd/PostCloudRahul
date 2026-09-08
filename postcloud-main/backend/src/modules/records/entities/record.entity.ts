import { Transform } from 'class-transformer';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';

import { Gender } from '../enums/gender.enum';
import { RecordStatus } from '../enums/record-status.enum';
import { Address } from './address.entity';
import { Child } from './child.entity';
import { Document } from './document.entity';
import { Policy } from './policy.entity';
import { EncryptionUtility } from '../../../utilities/encryption.utility';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('records')
export class Record {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ nullable: true })
  postBoxNumber: number;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  mobileNumber: string;

  @Column({ nullable: true })
  whatsappNumber: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.OTHER,
  })
  gender: Gender;

  @Column({ nullable: true })
  houseName: string;

  @Column({ nullable: true })
  houseNumber: string;

  @Column({ nullable: true })
  streetName: string;

  @Column({ nullable: true })
  streetNumber: string;

  @Column({ nullable: true })
  panchayat: string;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  @Transform(
    ({ value }) => (value ? EncryptionUtility.decrypt(value) : value),
    {
      toPlainOnly: true,
    },
  )
  aadhaarNumber: string;

  @Column({ nullable: true })
  @Transform(
    ({ value }) => (value ? EncryptionUtility.decrypt(value) : value),
    {
      toPlainOnly: true,
    },
  )
  drivingLicense: string;

  @Column({ nullable: true })
  @Transform(
    ({ value }) => (value ? EncryptionUtility.decrypt(value) : value),
    {
      toPlainOnly: true,
    },
  )
  electionID: string;

  @Column({ nullable: true })
  @Transform(
    ({ value }) => (value ? EncryptionUtility.decrypt(value) : value),
    {
      toPlainOnly: true,
    },
  )
  passportNumber: string;

  @Column({ default: false })
  redirectionAddress: boolean;

  @Column({ default: false })
  isAbroad: boolean;

  @Column({ nullable: true })
  redirectedHouseName: string;

  @Column({ nullable: true })
  redirectedHouseNumber: string;

  @Column({ nullable: true })
  job: string;

  @Column({ nullable: true })
  retirementDate: string;

  @Column({ default: false })
  isRedirected: boolean;

  @Column({ nullable: true })
  postOffice: number;

  @Column({
    type: 'enum',
    enum: RecordStatus,
    default: RecordStatus.DRAFT,
  })
  status: RecordStatus;

  @Column({ type: 'int', default: 0 })
  lastCompletedStep: number;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @OneToMany(() => Address, (address) => address.records, {
    cascade: true,
  })
  @JoinColumn()
  addresses: Relation<Address>[];

  @Column({ nullable: true })
  marriageDate: string;

  @Column({ nullable: true })
  village: string;

  @Column({ nullable: true })
  previousAddress: string;

  @OneToMany(() => Child, (child) => child.records, { cascade: true })
  @JoinColumn()
  children:  Relation<Child>[];

  @OneToMany(() => Document, (document) => document.records, {
    cascade: true,
  })
  @JoinColumn()
  documents:  Relation<Document>[];

  @OneToMany(() => Policy, (policy) => policy.records, {
    cascade: true,
  })
  @JoinColumn()
  policies:  Relation<Policy>[];

  @ManyToOne(() => User, (user) => user.records, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  user:  Relation<User>;

  @Column({ nullable: false })
  userId: number;

  @Column({ type: 'int', nullable: false })
  createdBy: number;

  @Column({ type: 'int', nullable: false })
  updatedBy: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async encryptSensitiveInformation() {
    if (
      this.aadhaarNumber &&
      !EncryptionUtility.isEncrypted(this.aadhaarNumber)
    ) {
      this.aadhaarNumber = EncryptionUtility.encrypt(this.aadhaarNumber);
    }
    if (this.electionID && !EncryptionUtility.isEncrypted(this.electionID)) {
      this.electionID = EncryptionUtility.encrypt(this.electionID);
    }
    if (
      this.passportNumber &&
      !EncryptionUtility.isEncrypted(this.passportNumber)
    ) {
      this.passportNumber = EncryptionUtility.encrypt(this.passportNumber);
    }
    if (
      this.drivingLicense &&
      !EncryptionUtility.isEncrypted(this.drivingLicense)
    ) {
      this.drivingLicense = EncryptionUtility.encrypt(this.drivingLicense);
    }
  }
}
