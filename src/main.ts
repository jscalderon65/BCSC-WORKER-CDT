import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FixedRateCdtWorker } from './fixed_rate_cdt_worker/FixedRateCdt.worker';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3005);

  const worker = app.get(FixedRateCdtWorker);
  await worker.startListening();
}
bootstrap();
