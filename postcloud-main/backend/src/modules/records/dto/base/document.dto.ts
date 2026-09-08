import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, ValidateIf } from 'class-validator';

export class DocumentDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsString({ message: 'Document name must be a string.' })
  name?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsString({ message: 'Document file must be a string.' })
  file?: string;
}

export class UpdateDocumentDto extends PartialType(DocumentDto) {}
