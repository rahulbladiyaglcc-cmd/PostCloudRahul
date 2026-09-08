import { PartialType } from '@nestjs/mapped-types';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  Validate,
  ValidateIf,
} from 'class-validator';
import { ExistsRule } from 'src/shared/validators/exist-rule.validator';
import { Gender } from '../../enums/gender.enum';
import { RecordStatus } from '../../enums/record-status.enum';

export class CreateProfileDto {
  @ValidateIf((o) => o.id != '')
  @IsOptional()
  @IsNumber()
  id: number;

  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsOptional()
  @IsString({ message: 'Profile image must be a string.' })
  profileImage: string;

  @IsNotEmpty({ message: 'First name is required.' })
  firstName: string;

  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsOptional()
  @IsString({ message: 'Last name must be a string.' })
  lastName?: string;

  @IsNotEmpty({ message: 'E-mail is required.' })
  @IsEmail({}, { message: 'E-mail must be valid.' })
  @Validate(ExistsRule, ['records:email:id'])
  email: string;

  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsOptional()
  @IsEnum(Gender, {
    message: 'Gender must be Male, Female, or Other.',
  })
  gender?: Gender;

  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsOptional()
  @IsString({ message: 'House name must be a string.' })
  houseName?: string;

  @IsOptional()
  @IsString({ message: 'House number must be a string.' })
  houseNumber?: string;

  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsOptional()
  @IsString({ message: 'Street name must be a string.' })
  streetName?: string;

  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsOptional()
  @IsString({ message: 'Street number must be a string.' })
  streetNumber?: string;

  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsOptional()
  @Min(100000, { message: 'PostOffice Number must be 6 digit ' })
  @Max(999999, { message: 'PostOffice Number must be 6 digit ' })
  @IsNumber()
  postOffice?: number;

  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsOptional()
  @IsString({ message: 'Panchayath must be a string.' })
  panchayat?: string;

  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsOptional()
  @IsString({ message: 'District must be a string.' })
  district?: string;

  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsOptional()
  @Validate(ExistsRule, ['records:mobileNumber:id'])
  @Matches(/^\d{10}$/, { message: 'Mobile number must be 10 digits.' })
  mobileNumber?: string;

  @ValidateIf((o) => o.whatsappNumber != '')
  @IsOptional()
  whatsappNumber?: string;

  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsOptional()
  @IsString({ message: 'Village must be a string.' })
  village?: string;

  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid date.' })
  dateOfBirth?: string;

  @ValidateIf((o) => o.userId != null)
  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsEnum(RecordStatus, {
    message: 'Status must be DRAFT or COMPLETED.',
  })
  status?: RecordStatus;
}

export class UpdateProfileDto extends PartialType(CreateProfileDto) {}
