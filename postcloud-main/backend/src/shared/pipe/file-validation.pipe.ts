import { Injectable, PipeTransform } from '@nestjs/common';
import { ParseFilePipe, MaxFileSizeValidator } from '@nestjs/common';

@Injectable()
export class FileValidationPipe extends ParseFilePipe {
  constructor(maxSize = 2 * 1024 * 1024) {
    super({
      validators: [new MaxFileSizeValidator({ maxSize })],
      fileIsRequired: true,
    });
  }
}
