import { Injectable, Scope } from '@nestjs/common';
import { RecordSearchFilterDto } from '../../records/dto/search/record-search-filter.dto';
import { RecordStatus } from '../../records/enums/record-status.enum';
import { AiChatIntentDto } from '../dto/ai-chat-intent.dto';
import { AiChatResponseDto } from '../dto/ai-chat-response.dto';
import { AiChatIntent } from '../enums/ai-chat-intent.enum';
import { OllamaService } from '../ollama/ollama.service';
import { RECORD_INTENT_PROMPT } from '../prompts/ai-chat.prompts';
import { RecordRagService } from '../rag/record-rag.service';
import { StructuredRetrievalService } from '../structured-retrieval/structured-retrieval.service';

@Injectable({ scope: Scope.REQUEST })
export class AiChatService {
  constructor(
    private readonly ollamaService: OllamaService,
    private readonly recordRagService: RecordRagService,
    private readonly structuredRetrievalService: StructuredRetrievalService,
  ) { }

  async ask(message: string): Promise<AiChatResponseDto> {
    const recordIntent = await this.getRecordIntent(message);

    switch (recordIntent.intent) {
      case AiChatIntent.RECORD_SEARCH:
        return this.structuredRetrievalService.getFilteredRecords(recordIntent.filters ?? {});
      case AiChatIntent.RECORD_NEXT_PAGE:
        return this.structuredRetrievalService.getNextOrPreviousRecords('next', recordIntent.filters?.limit);
      case AiChatIntent.RECORD_PREVIOUS_PAGE:
        return this.structuredRetrievalService.getNextOrPreviousRecords('previous', recordIntent.filters?.limit);
      case AiChatIntent.RECORD_SUMMARY:
        return this.structuredRetrievalService.getRecordSummary(recordIntent.recordId);
      case AiChatIntent.DOCUMENT_QUESTION:
        return this.recordRagService.searchInRecord(message, recordIntent.recordId);
      case AiChatIntent.DOCUMENT_SEARCH:
        return this.recordRagService.searchRecords(message);
      case AiChatIntent.UNSUPPORTED:
      default:
        return {
          role: 'assistant',
          intent: AiChatIntent.UNSUPPORTED,
          answer:
            'I can help you find records, summarize records, or answer questions using uploaded documents.',
          records: [],
          total: 0,
        };
    }
  }

  private async getRecordIntent(message: string): Promise<AiChatIntentDto> {
    const content = await this.ollamaService.chat({
      systemPrompt: RECORD_INTENT_PROMPT,
      userContent: message,
      temperature: 0,
      format: 'json',
      unavailableMessage:
        'Posta AI Assistant cannot reach Ollama right now. Start the Ollama Docker service and pull the configured model, then try again.',
    });

    if (!content) {
      return { intent: AiChatIntent.UNSUPPORTED };
    }

    try {
      return this.normalizeIntent(JSON.parse(content));
    } catch {
      return { intent: AiChatIntent.UNSUPPORTED };
    }
  }

  private normalizeIntent(value: unknown): AiChatIntentDto {
    if (!this.isObject(value)) {
      return { intent: AiChatIntent.UNSUPPORTED };
    }

    const requestedIntent = String(value.intent) as AiChatIntent;
    const intent = Object.values(AiChatIntent).includes(requestedIntent)
      ? requestedIntent
      : AiChatIntent.UNSUPPORTED;

    if (intent === AiChatIntent.UNSUPPORTED) {
      return { intent };
    }

    return {
      intent,
      filters: this.normalizeFilters(value.filters),
      recordId: this.normalizeRecordId(value.recordId),
    };
  }

  private normalizeFilters(value: unknown): RecordSearchFilterDto {
    if (!this.isObject(value)) {
      return {};
    }

    const filters = new RecordSearchFilterDto();

    if (
      value.status === RecordStatus.DRAFT ||
      value.status === RecordStatus.COMPLETED
    ) {
      filters.status = value.status;
    }

    for (const key of [
      'search',
      'name',
      'email',
      'mobileNumber',
      'village',
      'panchayat',
      'district',
    ] as const) {
      if (typeof value[key] === 'string' && value[key].trim()) {
        filters[key] = value[key].trim();
      }
    }

    if (
      typeof value.postOffice === 'number' &&
      Number.isFinite(value.postOffice)
    ) {
      filters.postOffice = value.postOffice;
    }

    if (
      typeof value.limit === 'number' &&
      Number.isFinite(value.limit) &&
      value.limit > 0
    ) {
      filters.limit = Math.floor(value.limit);
    }

    for (const key of [
      'isRedirected',
      'isAbroad',
      'hasDocuments',
      'hasPolicies',
    ] as const) {
      if (typeof value[key] === 'boolean') {
        filters[key] = value[key];
      }
    }

    return filters;
  }

  private normalizeRecordId(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) {
      return undefined;
    }

    return Math.floor(value);
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
