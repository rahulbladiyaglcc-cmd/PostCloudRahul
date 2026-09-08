import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { RecordStatus } from '../enums/record-status.enum';
import { UpdatePolicyDto } from './base/policy.dto';


export class StepFiveDto {
  @IsOptional()
  @IsEnum(RecordStatus, {
    message: 'Status must be DRAFT or COMPLETED.',
  })
  status?: RecordStatus;

  @IsOptional()
  @IsArray({ message: 'Policies must be an array.' })
  @ValidateNested({ each: true })
  @Type(() => UpdatePolicyDto)
  policies: UpdatePolicyDto[] = [];
}
