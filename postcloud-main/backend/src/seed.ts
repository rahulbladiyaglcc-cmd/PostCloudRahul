import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeederService } from './shared/seeder/seeder.service';

async function runSeed() {
  const app = await NestFactory.create(AppModule);
  await app.init();
  const seederService = app.get(SeederService);

  // Parse command line argument for record count
  const args = process.argv.slice(2);
  let numRecords = 100;

  if (args.length > 0) {
    const parsedCount = parseInt(args[0], 10);
    if (!isNaN(parsedCount) && parsedCount > 0) {
      numRecords = parsedCount;
    } else {
      console.error('Invalid record count provided. Using default: 100');
    }
  }

  try {
    console.log(`Starting seed with ${numRecords} records...`);
    await seederService.seedRecords(numRecords);
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown seeding error';
    console.error('Seeding failed:', message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runSeed();
