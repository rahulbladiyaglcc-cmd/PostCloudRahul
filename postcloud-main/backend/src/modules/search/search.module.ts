import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticsearchService } from './services/elasticsearch.service';

@Module({
  imports: [ConfigModule],
  providers: [ElasticsearchService],
  exports: [ElasticsearchService],
})
export class SearchModule {}
