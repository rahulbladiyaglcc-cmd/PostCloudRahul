import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, Min } from 'class-validator';

export class RetryDocumentSearchIndexDto {
  @IsArray({ message: 'Document IDs must be an array.' })
  @ArrayNotEmpty({ message: 'At least one document ID is required.' })
  @Type(() => Number)
  @IsInt({ each: true, message: 'Each document ID must be an integer.' })
  @Min(1, { each: true, message: 'Each document ID must be greater than zero.' })
  documentIds: number[];
}
