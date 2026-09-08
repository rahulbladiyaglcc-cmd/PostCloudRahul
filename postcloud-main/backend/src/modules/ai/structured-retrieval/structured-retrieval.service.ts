import { Injectable, Scope, ServiceUnavailableException } from '@nestjs/common';
import { RecordSearchFilterDto } from '../../records/dto/search/record-search-filter.dto';
import { Record as RecordEntity } from '../../records/entities/record.entity';
import { RecordQueryService } from '../../records/services/record-query.service';
import { AiChatResponseDto } from '../dto/ai-chat-response.dto';
import { RecordSummaryDto } from '../dto/record-summary.dto';
import { AiChatIntent } from '../enums/ai-chat-intent.enum';
import { OllamaService } from '../ollama/ollama.service';
import { RECORD_SUMMARY_PROMPT } from '../prompts/ai-chat.prompts';
import { StructuredRetrievalContextService } from './structured-retrieval-context.service';

const DEFAULT_RECORD_LIMIT = 10;
const MAX_RECORD_LIMIT = 50;

@Injectable({ scope: Scope.REQUEST })
export class StructuredRetrievalService {
  constructor(
    private readonly recordQueryService: RecordQueryService,
    private readonly ollamaService: OllamaService,
    private readonly contextService: StructuredRetrievalContextService,
  ) {}

  async getFilteredRecords(
    filters: RecordSearchFilterDto,
  ): Promise<AiChatResponseDto> {
    const limit = this.getRecordLimit(filters.limit);
    const { records, total } = await this.recordQueryService.searchAccessibleRecords(
      filters,
      limit,
      0,
    );
    
    await this.contextService.setContext({ filters, limit, offset: 0, total });

    return {
      role: 'assistant',
      intent: AiChatIntent.RECORD_SEARCH,
      answer: this.getSearchAnswer(total, records.length),
      records,
      total,
    };
  }

  async getNextOrPreviousRecords(
    direction: 'next' | 'previous',
    requestedLimit?: number,
  ): Promise<AiChatResponseDto> {
    const context = await this.contextService.getContext();
    const intent =
      direction === 'next'
        ? AiChatIntent.RECORD_NEXT_PAGE
        : AiChatIntent.RECORD_PREVIOUS_PAGE;

    if (!context) {
      return {
        role: 'assistant',
        intent,
        answer:
          'I do not have a previous record search to continue. Try searching first, for example “Show draft records.”',
        records: [],
        total: 0,
      };
    }

    const limit = requestedLimit
      ? this.getRecordLimit(requestedLimit)
      : context.limit;
    const offset =
      direction === 'next'
        ? context.offset + context.limit
        : Math.max(context.offset - limit, 0);
    const { records, total } = await this.recordQueryService.searchAccessibleRecords(
      context.filters,
      limit,
      offset,
    );
    await this.contextService.setContext({
      filters: context.filters,
      limit,
      offset,
      total,
    });

    return {
      role: 'assistant',
      intent,
      answer: this.getPageAnswer(total, records.length, offset, direction),
      records,
      total,
    };
  }

  async getRecordSummary(recordId?: number): Promise<AiChatResponseDto> {
    if (!recordId) {
      return {
        role: 'assistant',
        intent: AiChatIntent.RECORD_SUMMARY,
        answer:
          'Please include the record ID you want me to summarize, for example “Summarize record 151.”',
        records: [],
        total: 0,
      };
    }

    const record = await this.recordQueryService.findAccessibleRecord(recordId, [
      'documents',
      'policies',
      'addresses',
      'children',
    ]);
    const answer = await this.ollamaService.chat({
      systemPrompt: RECORD_SUMMARY_PROMPT,
      userContent: JSON.stringify(this.getRecordSummaryData(record)),
      temperature: 0.2,
      unavailableMessage:
        'Posta AI Assistant cannot summarize this record right now. Make sure Ollama is running and the configured model is installed, then try again.',
    });

    if (!answer) {
      throw new ServiceUnavailableException(
        'Posta AI Assistant cannot summarize this record right now.',
      );
    }

    return {
      role: 'assistant',
      intent: AiChatIntent.RECORD_SUMMARY,
      answer,
      records: [],
      total: 1,
    };
  }

  private getRecordLimit(limit?: number): number {
    if (!limit || !Number.isFinite(limit) || limit < 1) {
      return DEFAULT_RECORD_LIMIT;
    }

    return Math.min(Math.floor(limit), MAX_RECORD_LIMIT);
  }

  private getRecordSummaryData(record: RecordEntity): RecordSummaryDto {
    return {
      id: record.id,
      name:
        [record.firstName, record.lastName].filter(Boolean).join(' ') ||
        `Record #${record.id}`,
      status: record.status,
      contact: record.email || record.mobileNumber || 'Not saved',
      location:
        [record.village, record.panchayat, record.district]
          .filter(Boolean)
          .join(', ') || 'Not saved',
      documentsCount: record.documents?.length ?? 0,
      documentNames: (record.documents ?? [])
        .map((document) => document.name)
        .filter(Boolean),
      policiesCount: record.policies?.length ?? 0,
      policyTypes: (record.policies ?? [])
        .map((policy) => policy.type)
        .filter(Boolean),
      addressesCount: record.addresses?.length ?? 0,
      childrenCount: record.children?.length ?? 0,
      postRetirementAddressEnabled: Boolean(
        record.isRedirected || record.redirectionAddress,
      ),
      abroad: Boolean(record.isAbroad),
      lastCompletedStep: record.lastCompletedStep,
    };
  }

  private getSearchAnswer(total: number, shown: number): string {
    if (total === 0) {
      return 'I could not find any matching records.';
    }
    if (total > shown) {
      return `I found ${total} matching records. Showing the first ${shown}.`;
    }
    return `I found ${total} matching ${total === 1 ? 'record' : 'records'}.`;
  }

  private getPageAnswer(
    total: number,
    shown: number,
    offset: number,
    direction: 'next' | 'previous',
  ): string {
    if (shown === 0) {
      return direction === 'next'
        ? 'There are no more matching records to show.'
        : 'You are already at the beginning of the matching records.';
    }
    return `Showing records ${offset + 1}-${offset + shown} of ${total}.`;
  }
}
