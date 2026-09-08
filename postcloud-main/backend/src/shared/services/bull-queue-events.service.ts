import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, QueueEvents } from 'bullmq';
import { getBullConnection } from '../utilities/bull-connection.utility';

@Injectable()
export class BullQueueEventsService implements OnModuleDestroy {
  private readonly queueEvents = new Map<string, QueueEvents>();

  constructor(private readonly configService: ConfigService) { }

  async waitForJob<T>(
    queueName: string,
    job: Job,
    timeout: number,
  ): Promise<T> {
    return job.waitUntilFinished(this.getQueueEvents(queueName), timeout) as Promise<T>;
  }

  private getQueueEvents(queueName: string): QueueEvents {
    const existingQueueEvents = this.queueEvents.get(queueName);
    if (existingQueueEvents) {
      return existingQueueEvents;
    }

    const queueEvents = new QueueEvents(queueName, {
      connection: getBullConnection(this.configService),
    });
    this.queueEvents.set(queueName, queueEvents);
    return queueEvents;
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(
      [...this.queueEvents.values()].map((queueEvents) => queueEvents.close()),
    );
  }
}
