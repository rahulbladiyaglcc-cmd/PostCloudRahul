import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { RecordStatus } from '../enums/record-status.enum';
import { DocumentDto } from './base/document.dto';

export class StepSixDto {
  @IsOptional()
  @IsEnum(RecordStatus, {
    message: 'Status must be DRAFT or COMPLETED.',
  })
  status?: RecordStatus;

  @IsOptional()
  @IsArray({ message: 'Documents must be an array.' })
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  documents: DocumentDto[] = [];
}
