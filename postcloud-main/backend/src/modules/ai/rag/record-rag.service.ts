import { Injectable, Scope, ServiceUnavailableException } from '@nestjs/common';
import { RecordSearchResultDto } from '../../records/dto/search/record-search-result.dto';
import { AiChatCitationDto } from '../dto/ai-chat-citation.dto';
import { AiChatResponseDto } from '../dto/ai-chat-response.dto';
import { RagDocumentChunkDto } from '../dto/rag-document-chunk.dto';
import { RetrievedDocumentChunkDto } from '../dto/retrieved-document-chunk.dto';
import { AiChatIntent } from '../enums/ai-chat-intent.enum';
import { OllamaService } from '../ollama/ollama.service';
import { RAG_ANSWER_PROMPT } from '../prompts/rag.prompts';
import { DocumentHybridSearchService } from './document-hybrid-search.service';

@Injectable({ scope: Scope.REQUEST })
export class RecordRagService {
  constructor(
    private readonly ollamaService: OllamaService,
    private readonly documentHybridSearchService: DocumentHybridSearchService,
  ) {}

  async searchInRecord(
    question: string,
    recordId?: number,
  ): Promise<AiChatResponseDto> {
    if (!recordId) {
      return {
        role: 'assistant',
        intent: AiChatIntent.DOCUMENT_QUESTION,
        answer: 'Please include the record ID whose documents you want to ask about.',
        records: [],
        total: 0,
      };
    }

    return this.answerFromDocumentChunks(
      question,
      AiChatIntent.DOCUMENT_QUESTION,
      recordId,
    );
  }

  async searchRecords(question: string): Promise<AiChatResponseDto> {
    return this.answerFromDocumentChunks(question, AiChatIntent.DOCUMENT_SEARCH);
  }

  private async answerFromDocumentChunks(
    question: string,
    intent: AiChatIntent.DOCUMENT_QUESTION | AiChatIntent.DOCUMENT_SEARCH,
    recordId?: number,
  ): Promise<AiChatResponseDto> {
    const documentChunks = await this.findRecordDocumentChunks(question, recordId);
    if (documentChunks.length === 0) {
      return {
        role: 'assistant',
        intent,
        answer:
          'I could not find relevant indexed document content that you are allowed to access.',
        records: [],
        total: 0,
        citations: [],
      };
    }

    const answer = await this.ollamaService.chat({
      systemPrompt: RAG_ANSWER_PROMPT,
      userContent: JSON.stringify({ question, documentChunks }),
      temperature: 0.1,
      unavailableMessage:
        'Posta AI Assistant cannot answer document questions right now.',
    });

    if (!answer) {
      throw new ServiceUnavailableException(
        'Posta AI Assistant cannot answer document questions right now.',
      );
    }

    const records = this.getRecords(documentChunks);
    return {
      role: 'assistant',
      intent,
      answer,
      records,
      total: records.length,
      citations: this.getCitations(documentChunks),
    };
  }

  private async findRecordDocumentChunks(
    question: string,
    recordId?: number,
  ): Promise<RetrievedDocumentChunkDto[]> {
    const embedding = await this.ollamaService.embed(question);
    return this.documentHybridSearchService.findRecordDocumentChunks(
      question,
      embedding,
      recordId,
    );
  }

  private getCitations(
    documentChunks: RagDocumentChunkDto[],
  ): AiChatCitationDto[] {
    const citations = new Map<string, AiChatCitationDto>();
    for (const chunk of documentChunks) {
      citations.set(`${chunk.documentId}:${chunk.pageNumber ?? ''}`, {
        documentId: chunk.documentId,
        recordId: chunk.recordId,
        documentName: chunk.documentName,
        pageNumber: chunk.pageNumber,
      });
    }

    return [...citations.values()];
  }

  private getRecords(
    documentChunks: RetrievedDocumentChunkDto[],
  ): RecordSearchResultDto[] {
    const records = new Map<number, RecordSearchResultDto>();
    for (const chunk of documentChunks) {
      if (!records.has(chunk.recordId)) {
        records.set(chunk.recordId, {
          id: chunk.recordId,
          firstName: chunk.firstName,
          lastName: chunk.lastName,
          email: chunk.email,
          mobileNumber: chunk.mobileNumber,
          status: chunk.status,
          village: chunk.village,
          panchayat: chunk.panchayat,
          district: chunk.district,
        });
      }
    }

    return [...records.values()];
  }
}
