import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Record } from './entities/record.entity';
import { RecordsController } from './records.controller';
import { RecordsService } from './services/records.service';
import { DocumentEmbeddingModule } from '../ai/document-embedding/document-embedding.module';
import { RecordQueryService } from './services/record-query.service';
import { SharedModule } from '../../shared/shared.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Record]),
    DocumentEmbeddingModule,
    SharedModule,
  ],
  controllers: [RecordsController],
  providers: [RecordsService, RecordQueryService],
  exports: [RecordQueryService],
})
export class RecordsModule {}
