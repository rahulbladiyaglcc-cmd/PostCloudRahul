import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { RecordStatus } from '../../enums/record-status.enum';

export class CreateOccupationDto {
  @IsOptional()
  @IsEnum(RecordStatus, {
    message: 'Status must be DRAFT or COMPLETED.',
  })
  status?: RecordStatus;

  @IsOptional()
  @IsBoolean({ message: 'Redirection address must be a boolean.' })
  redirectionAddress: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Is abroad must be a boolean.' })
  isAbroad: boolean;

  @IsOptional()
  @IsString({ message: 'Redirected house name must be a string.' })
  redirectedHouseName: string;

  @IsOptional()
  @IsString({ message: 'Redirected house number must be a string.' })
  redirectedHouseNumber: string;

  @IsOptional()
  @IsString({ message: 'Job must be a string.' })
  job: string;

  @ValidateIf((o) => o.retirementDate != '')
  @IsOptional()
  @IsDateString({}, { message: 'Retirement date must be a valid date.' })
  retirementDate: string;

  @IsOptional()
  @IsBoolean({ message: 'Is redirected must be a boolean.' })
  isRedirected: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses: AddressDto[];
}

export class AddressDto {
  @IsOptional()
  id: number;

  @IsOptional()
  @IsString({ message: 'House name must be a string.' })
  houseName?: string;

  @IsOptional()
  @IsString({ message: 'House number must be a string.' })
  houseNumber?: string;

  @IsOptional()
  @IsString({ message: 'Street name must be a string.' })
  streetName?: string;

  @IsOptional()
  @IsString({ message: 'Street number must be a string.' })
  streetNumber?: string;

  @IsOptional()
  @IsString({ message: 'Village must be a string.' })
  village?: string;

  @IsOptional()
  @IsString({ message: 'Post office must be a string.' })
  postOffice?: string;

  @IsOptional()
  @IsString({ message: 'Location type must be a string.' })
  locationType?: string;
}
export class UpdateOccupationDto extends PartialType(CreateOccupationDto) {}
