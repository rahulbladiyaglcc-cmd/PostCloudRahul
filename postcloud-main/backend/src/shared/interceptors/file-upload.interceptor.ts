import {
  FileInterceptor,
} from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

export function UploadInterceptor(fieldName: string) {
  return FileInterceptor(fieldName, {
    storage: memoryStorage(),
  });
}
