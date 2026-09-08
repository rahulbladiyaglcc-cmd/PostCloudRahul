import { RecordStatus } from '../../records/enums/record-status.enum';
import { RagDocumentChunkDto } from './rag-document-chunk.dto';

export class RetrievedDocumentChunkDto extends RagDocumentChunkDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: string;
  status?: RecordStatus;
  village?: string;
  panchayat?: string;
  district?: string;
}
