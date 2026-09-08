import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { RecordStatus } from '../../enums/record-status.enum';

export class CreateIdentityDto {
  @IsOptional()
  @IsEnum(RecordStatus, {
    message: 'Status must be DRAFT or COMPLETED.',
  })
  status?: RecordStatus;

  @IsOptional()
  @ValidateIf((o) => o.aadhaarNumber != '')
  @Matches(/^\d{12}$/, {
    message: 'Aadhaar number must be 12 digits.',
  })
  aadhaarNumber?: string;

  @IsOptional()
  @MinLength(15, { message: 'Driving License must be 15 characters.' })
  @ValidateIf((o) => o.drivingLicense != '')
  drivingLicense?: string;

  @IsOptional()
  @ValidateIf((o) => o.electionID != '')
  @IsString({ message: 'Election ID must be a string.' })
  @MinLength(10, { message: 'Election ID must be 10 characters' })
  electionID?: string;

  @IsOptional()
  @ValidateIf((o) => o.passportNumber != '')
  @MinLength(8, { message: 'Passport number must be 8 characters.' })
  passportNumber?: string;

  @IsOptional()
  @IsNumber()
  postBoxNumber?: number;
}

export class UpdateIdentityDto extends PartialType(CreateIdentityDto) {}
