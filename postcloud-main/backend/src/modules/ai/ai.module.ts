import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { DocumentEmbeddingModule } from './document-embedding/document-embedding.module';

@Module({
  imports: [AiChatModule, DocumentEmbeddingModule, SearchModule],
})
export class AiModule {}
