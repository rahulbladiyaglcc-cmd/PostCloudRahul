import { RecordStatus } from '../../enums/record-status.enum';

export class RecordSearchFilterDto {
  status?: RecordStatus;
  search?: string;
  name?: string;
  email?: string;
  mobileNumber?: string;
  village?: string;
  panchayat?: string;
  district?: string;
  postOffice?: number;
  isRedirected?: boolean;
  isAbroad?: boolean;
  hasDocuments?: boolean;
  hasPolicies?: boolean;
  limit?: number;
}
