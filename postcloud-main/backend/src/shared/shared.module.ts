import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExistsRule } from 'src/shared/validators/exist-rule.validator';
import { ValidateFile } from './validators/file.validator';
import { BullModule } from '@nestjs/bullmq';
import { OcrService } from './services/ocr.service';
import { RedisModule } from './redis.module';
import { OCR_QUEUE } from './constants/queue.constants';
import { EncryptionConfigService } from './services/encryption-config.service';
import { StorageService } from './services/storage.service';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    BullModule.registerQueue({
      name: OCR_QUEUE,
    }),
  ],
  providers: [
    ExistsRule,
    ValidateFile,
    OcrService,
    EncryptionConfigService,
    StorageService,
  ],
  exports: [ExistsRule, ValidateFile, OcrService, StorageService, RedisModule],
})
export class SharedModule { }
