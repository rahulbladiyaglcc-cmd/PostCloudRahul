import { RecordStatus } from '../../records/enums/record-status.enum';

export class RecordSummaryDto {
  id: number;
  name: string;
  status: RecordStatus;
  contact: string;
  location: string;
  documentsCount: number;
  documentNames: string[];
  policiesCount: number;
  policyTypes: string[];
  addressesCount: number;
  childrenCount: number;
  postRetirementAddressEnabled: boolean;
  abroad: boolean;
  lastCompletedStep: number;
}
