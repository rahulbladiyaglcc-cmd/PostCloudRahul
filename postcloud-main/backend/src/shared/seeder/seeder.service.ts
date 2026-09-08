import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Record } from '../../modules/records/entities/record.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Gender } from '../../modules/records/enums/gender.enum';
import { UserRole } from '../../modules/users/enums/user-role.enum';
import { RecordStatus } from '../../modules/records/enums/record-status.enum';
import { Address } from '../../modules/records/entities/address.entity';
import { Child } from '../../modules/records/entities/child.entity';
import { Document } from '../../modules/records/entities/document.entity';
import { Policy } from '../../modules/records/entities/policy.entity';
import * as bcrypt from 'bcrypt';

interface SeedUserDefinition {
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

@Injectable()
export class SeederService {
  private readonly seedPassword = 'test@12345';
  private readonly seedUsers: SeedUserDefinition[] = [
    {
      username: 'admin@gmail.com',
      firstName: 'Primary',
      lastName: 'Admin',
      role: UserRole.ADMIN,
    },
    {
      username: 'admin2@gmail.com',
      firstName: 'Operations',
      lastName: 'Admin',
      role: UserRole.ADMIN,
    },
    {
      username: 'admin3@gmail.com',
      firstName: 'Review',
      lastName: 'Admin',
      role: UserRole.ADMIN,
    },
    {
      username: 'user1@gmail.com',
      firstName: 'Seed',
      lastName: 'User One',
      role: UserRole.USER,
    },
    {
      username: 'user2@gmail.com',
      firstName: 'Seed',
      lastName: 'User Two',
      role: UserRole.USER,
    },
    {
      username: 'user3@gmail.com',
      firstName: 'Seed',
      lastName: 'User Three',
      role: UserRole.USER,
    },
    {
      username: 'user4@gmail.com',
      firstName: 'Seed',
      lastName: 'User Four',
      role: UserRole.USER,
    },
    {
      username: 'user5@gmail.com',
      firstName: 'Seed',
      lastName: 'User Five',
      role: UserRole.USER,
    },
    {
      username: 'user6@gmail.com',
      firstName: 'Seed',
      lastName: 'User Six',
      role: UserRole.USER,
    },
    {
      username: 'user7@gmail.com',
      firstName: 'Seed',
      lastName: 'User Seven',
      role: UserRole.USER,
    },
  ];
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(Record)
    private readonly recordRepository: Repository<Record>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seedRecords(numRecords: number): Promise<void> {
    const isDevelopment = this.configService.get<boolean>(
      'config.isDevelopment',
    );
    if (!isDevelopment) {
      this.logger.warn('Skipping seed: seeding is only allowed in development');
      return;
    }

    const seedUsers = await this.getOrCreateSeedUsers();
    this.logger.log(`Seed users available: ${seedUsers.length}`);

    const existingRecordCount = await this.recordRepository.count();
    if (existingRecordCount > 0) {
      this.logger.debug(
        `Skipping seed: ${existingRecordCount} records already exist`,
      );
      return;
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const recordRepository = manager.getRepository(Record);
        const addressRepository = manager.getRepository(Address);
        const childRepository = manager.getRepository(Child);
        const documentRepository = manager.getRepository(Document);
        const policyRepository = manager.getRepository(Policy);

        for (let i = 0; i < numRecords; i++) {
          const seedUser = seedUsers[i % seedUsers.length];
          const adminUser = seedUsers.find(
            (user) => user.role === UserRole.ADMIN,
          );
          const isCompleted = i % 4 === 0;
          const lastCompletedStep = isCompleted ? 6 : (i % 6) + 1;
          const updatedBy =
            isCompleted && adminUser ? adminUser.id : seedUser.id;
          const record = recordRepository.create({
            profileImage: `-User${i + 1}.jpg`,
            postBoxNumber: i + 1,
            email: `record${i + 1}@gmail.com`,
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            mobileNumber: faker.string.numeric(10),
            whatsappNumber: faker.phone.number({
              style: 'international',
            }),
            dateOfBirth: faker.date
              .birthdate({ min: 1970, max: 2000, mode: 'year' })
              .toISOString()
              .split('T')[0],
            gender: faker.helpers.arrayElement(Object.values(Gender)),
            houseName: faker.location.secondaryAddress(),
            houseNumber: faker.string.numeric(2),
            streetName: faker.location.street(),
            streetNumber: faker.string.numeric(3),
            panchayat: faker.location.city(),
            district: faker.location.state(),
            aadhaarNumber: faker.string.numeric(16),
            drivingLicense:
              i % 3 === 0 ? faker.string.alphanumeric(12) : undefined,
            electionID: i % 4 === 0 ? faker.string.alphanumeric(10) : undefined,
            passportNumber:
              i % 5 === 0 ? faker.string.alphanumeric(9) : undefined,
            redirectionAddress: i % 6 === 0,
            isAbroad: i % 7 === 0,
            redirectedHouseName:
              i % 6 === 0 ? faker.location.secondaryAddress() : undefined,
            redirectedHouseNumber:
              i % 6 === 0 ? faker.string.numeric(2) : undefined,
            job: faker.helpers.arrayElement([
              'Engineer',
              'Doctor',
              'Teacher',
              'Farmer',
              'Business Owner',
            ]),
            retirementDate:
              i % 8 === 0
                ? faker.date.future().toISOString().split('T')[0]
                : undefined,
            isRedirected: i % 6 === 0,
            postOffice: parseInt(faker.string.numeric(6), 10),
            status: isCompleted ? RecordStatus.COMPLETED : RecordStatus.DRAFT,
            lastCompletedStep,
            completedAt: isCompleted ? faker.date.recent({ days: 30 }) : null,
            marriageDate:
              i % 2 === 0
                ? faker.date.past({ years: 20 }).toISOString().split('T')[0]
                : undefined,
            village: faker.location.city(),
            previousAddress:
              i % 3 === 0 ? faker.location.streetAddress() : undefined,
            userId: seedUser.id,
            user: seedUser,
            createdBy: seedUser.id,
            updatedBy,
          });
          const savedRecord = await recordRepository.save(record);

          await addressRepository.insert(
            this.createSeedAddresses(savedRecord.id, i),
          );
          if (i % 2 === 0) {
            await childRepository.insert(
              this.createSeedChildren(savedRecord.id, i),
            );
          }
          if (i % 3 !== 0) {
            await policyRepository.insert(
              this.createSeedPolicies(savedRecord.id, i),
            );
          }
          if (lastCompletedStep >= 6 || isCompleted) {
            await documentRepository.insert(
              this.createSeedDocuments(savedRecord.id, i),
            );
          }
        }
      });
      this.logger.log(`${numRecords} records inserted successfully!`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown seeding error';
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to seed records: ${message}`, stack);
      throw error;
    }
  }

  private async getOrCreateSeedUsers(): Promise<User[]> {
    const seedUsernames = this.seedUsers.map((user) => user.username);
    const existingUsers = await this.userRepository.find({
      where: { username: In(seedUsernames) },
    });
    const existingUsersByUsername = new Map(
      existingUsers.map((user) => [user.username, user]),
    );
    const seedUsers: User[] = [];

    for (const seedUserDefinition of this.seedUsers) {
      const existingUser = existingUsersByUsername.get(
        seedUserDefinition.username,
      );

      if (existingUser) {
        const updatedUser = await this.syncExistingSeedUser(
          existingUser,
          seedUserDefinition,
        );
        this.logger.log(
          `Using existing seed user: ${seedUserDefinition.username}`,
        );
        seedUsers.push(updatedUser);
        continue;
      }

      const seedUser = this.userRepository.create({
        username: seedUserDefinition.username,
        password: this.seedPassword,
        firstName: seedUserDefinition.firstName,
        lastName: seedUserDefinition.lastName,
        isActive: true,
        role: seedUserDefinition.role,
      });

      const savedSeedUser = await this.userRepository.save(seedUser);
      this.logger.log(`Created new seed user: ${seedUserDefinition.username}`);
      seedUsers.push(savedSeedUser);
    }

    return seedUsers;
  }

  private async syncExistingSeedUser(
    existingUser: User,
    seedUserDefinition: SeedUserDefinition,
  ): Promise<User> {
    const passwordMatches = await bcrypt.compare(
      this.seedPassword,
      existingUser.password,
    );
    const nextPassword = passwordMatches
      ? existingUser.password
      : await bcrypt.hash(this.seedPassword, 10);
    const needsUpdate =
      existingUser.firstName !== seedUserDefinition.firstName ||
      existingUser.lastName !== seedUserDefinition.lastName ||
      existingUser.role !== seedUserDefinition.role ||
      !existingUser.isActive ||
      !passwordMatches;

    if (!needsUpdate) {
      return existingUser;
    }

    await this.userRepository.update(existingUser.id, {
      firstName: seedUserDefinition.firstName,
      lastName: seedUserDefinition.lastName,
      role: seedUserDefinition.role,
      isActive: true,
      password: nextPassword,
    });

    return this.userRepository.findOneOrFail({
      where: { id: existingUser.id },
    });
  }

  private createSeedAddresses(recordsId: number, index: number): Address[] {
    return [
      {
        houseName: faker.location.secondaryAddress(),
        houseNumber: faker.string.numeric(2),
        streetName: faker.location.street(),
        streetNumber: faker.string.numeric(3),
        village: faker.location.city(),
        postOffice: faker.string.numeric(6),
        locationType: 'current',
        recordsId,
      },
      {
        houseName: index % 2 === 0 ? faker.location.secondaryAddress() : '',
        houseNumber: index % 2 === 0 ? faker.string.numeric(2) : '',
        streetName: faker.location.street(),
        streetNumber: faker.string.numeric(3),
        village: faker.location.city(),
        postOffice: faker.string.numeric(6),
        locationType: 'permanent',
        recordsId,
      },
    ] as Address[];
  }

  private createSeedChildren(recordsId: number, index: number): Child[] {
    return Array.from({ length: (index % 3) + 1 }, () => ({
      name: faker.person.fullName(),
      dateOfBirth: faker.date
        .birthdate({ min: 2005, max: 2024, mode: 'year' })
        .toISOString()
        .split('T')[0],
      gender: faker.helpers.arrayElement(Object.values(Gender)),
      recordsId,
    })) as Child[];
  }

  private createSeedPolicies(recordsId: number, index: number): Policy[] {
    return [
      {
        type: faker.helpers.arrayElement(['Life', 'Health', 'Vehicle']),
        number: `POL-${String(index + 1).padStart(5, '0')}`,
        recordsId,
      },
    ] as Policy[];
  }

  private createSeedDocuments(recordsId: number, index: number): Document[] {
    return [
      {
        name: 'Aadhaar',
        file: `seed-documents/aadhaar-${index + 1}.pdf`,
        recordsId,
      },
      {
        name: 'Profile',
        file: `seed-documents/profile-${index + 1}.jpg`,
        recordsId,
      },
    ] as Document[];
  }
}
