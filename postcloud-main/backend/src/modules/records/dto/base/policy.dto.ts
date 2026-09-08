import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

export class CreatePolicyDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsString({ message: 'Policy type must be a string.' })
  type?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @Matches(/^[A-Z0-9]{8,12}$/, {
    message: 'Policy number must be 8-12 alphanumeric characters.',
  })
  number?: string;
}

export class UpdatePolicyDto extends PartialType(CreatePolicyDto) {}
