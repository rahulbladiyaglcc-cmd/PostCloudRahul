import { Injectable, BadRequestException } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'ValidateFile', async: false })
@Injectable()
export class ValidateFile implements ValidatorConstraintInterface {
  /**
   * Validate a single or multiple files based on custom rules.
   * @param value Can be a single file or an array of files.
   * @param args ValidationArguments
   * @returns true if validation passes, false otherwise.
   */
  validate(value: any, args: ValidationArguments): boolean {
    const { constraints } = args;
    const [maxSize, allowedTypes] = constraints;

    // If the value is an array (multiple files), validate each file.
    if (Array.isArray(value)) {
      return value.every((file) =>
        this.validateFile(file, maxSize, allowedTypes),
      );
    }

    // Validate a single file.
    return this.validateFile(value, maxSize, allowedTypes);
  }

  /**
   * Custom validation logic for a single file.
   * @param file The file to validate.
   * @param maxSize The maximum file size in bytes.
   * @param allowedTypes An array of allowed MIME types.
   * @returns true if validation passes, false otherwise.
   */
  private validateFile(
    file: Express.Multer.File,
    maxSize: number,
    allowedTypes: string[],
  ): boolean {

    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    // Check file size
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds the limit of ${maxSize} bytes.`,
      );
    }

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed.`,
      );
    }

    return true;
  }

  /**
   * Default error message.
   * @param args ValidationArguments
   * @returns A string message.
   */
  defaultMessage(args: ValidationArguments): string {
    const [maxSize, allowedTypes] = args.constraints;
    return `File(s) must not exceed ${maxSize} bytes and must be of type: ${allowedTypes.join(', ')}.`;
  }
}
