import { RecordSearchFilterDto } from '../../records/dto/search/record-search-filter.dto';
import { AiChatIntent } from '../enums/ai-chat-intent.enum';

export class AiChatIntentDto {
  intent: AiChatIntent;
  filters?: RecordSearchFilterDto;
  recordId?: number;
}
