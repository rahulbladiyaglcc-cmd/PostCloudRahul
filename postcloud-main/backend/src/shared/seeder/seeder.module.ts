import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Record } from '../../modules/records/entities/record.entity';
import { User } from '../../modules/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Record, User])],
  providers: [SeederService],
})
export class SeederModule {}
