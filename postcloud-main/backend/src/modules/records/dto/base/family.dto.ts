import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Gender } from '../../enums/gender.enum';
import { RecordStatus } from '../../enums/record-status.enum';

export class CreateFamilyDto {
  @IsOptional()
  @IsEnum(RecordStatus, {
    message: 'Status must be DRAFT or COMPLETED.',
  })
  status?: RecordStatus;

  @ValidateIf((o) => o.marriageDate != '')
  @IsOptional()
  @IsDateString({}, { message: 'Marriage date must be a valid date.' })
  marriageDate: string;

  @IsOptional()
  @IsString({ message: 'Previous address must be a string.' })
  previousAddress: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChildDto)
  children: ChildDto[];
}

export class ChildDto {
  @IsOptional()
  @IsString({ message: 'Child name must be a string.' })
  name?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid date.' })
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Gender, {
    message: 'Gender must be Male, Female, or Other.',
  })
  gender?: Gender;
}

export class UpdateFamilyDto extends PartialType(CreateFamilyDto) {}
