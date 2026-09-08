import { FileValidator } from '@nestjs/common';

export type MimeTypeValidatorOptions = {
  allowedMimeTypes: string[];
};

export class MimeTypeFileValidator extends FileValidator<MimeTypeValidatorOptions> {
  isValid(file?: Express.Multer.File): boolean {
    if (!file || !file.mimetype) {
      return false;
    }

    return this.validationOptions.allowedMimeTypes.includes(
      file.mimetype.toLowerCase(),
    );
  }

  buildErrorMessage(): string {
    return `Invalid file type. Allowed types: ${this.validationOptions.allowedMimeTypes.join(', ')}`;
  }
}
