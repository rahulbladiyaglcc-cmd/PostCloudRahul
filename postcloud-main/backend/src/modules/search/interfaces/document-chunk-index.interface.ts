import { RecordStatus } from '../../records/enums/record-status.enum';

export interface DocumentChunkIndexPayload {
  chunkId: number;
  documentId: number;
  recordId: number;
  chunkIndex: number;
  pageNumber?: number;
  content: string;
  documentName?: string;
  recordStatus?: RecordStatus;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: string;
  village?: string;
  panchayat?: string;
  district?: string;
  createdAt: Date;
}
