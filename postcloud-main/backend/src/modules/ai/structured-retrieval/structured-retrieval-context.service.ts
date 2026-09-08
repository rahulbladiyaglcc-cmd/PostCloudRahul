import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { RedisService } from '../../../shared/services/redis.service';
import { AuthenticatedRequest } from '../../auth/types/express';
import { RecordSearchContextDto } from '../dto/record-search-context.dto';

const SEARCH_CONTEXT_TTL_SECONDS = 60 * 30;

@Injectable({ scope: Scope.REQUEST })
export class StructuredRetrievalContextService {
  constructor(
    @Inject(REQUEST)
    private readonly request: AuthenticatedRequest,
    private readonly redisService: RedisService,
  ) {}

  async setContext(context: RecordSearchContextDto): Promise<void> {
    await this.redisService.getClient().set(
      this.getContextKey(),
      JSON.stringify(context),
      'EX',
      SEARCH_CONTEXT_TTL_SECONDS,
    );
  }

  async getContext(): Promise<RecordSearchContextDto | null> {
    const redis = this.redisService.getClient();
    const context = await redis.get(this.getContextKey());
    if (!context) {
      return null;
    }

    try {
      return JSON.parse(context) as RecordSearchContextDto;
    } catch {
      await redis.del(this.getContextKey());
      return null;
    }
  }

  private getContextKey(): string {
    return `ai_chat:user:${this.request.user.sub}:last_record_search`;
  }
}
