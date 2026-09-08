import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullQueueEventsService } from './services/bull-queue-events.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [BullQueueEventsService],
  exports: [BullQueueEventsService],
})
export class BullQueueModule {}
