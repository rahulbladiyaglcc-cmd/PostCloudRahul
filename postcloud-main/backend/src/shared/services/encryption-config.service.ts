import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EncryptionUtility } from 'src/utilities/encryption.utility';

@Injectable()
export class EncryptionConfigService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const encryptionKey = this.configService.get<string>('config.encryptionKey');
    EncryptionUtility.configureFromRawKey(encryptionKey);
  }
}
