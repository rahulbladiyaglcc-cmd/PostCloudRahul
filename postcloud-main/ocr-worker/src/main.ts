import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection in OCR worker:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception in OCR worker:', error);
  });

  await NestFactory.createApplicationContext(WorkerModule, {
    bufferLogs: true,
  });
  console.info('✅ OCR Worker started and listening to the queues...');
}
bootstrap();
