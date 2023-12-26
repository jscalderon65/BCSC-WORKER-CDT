import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FixedRateCdtWorker } from './fixed_rate_cdt_worker/FixedRateCdt.worker';
import { credentials } from './utils/constants/credentials';
import { SendEmailForLiquidatedCdtWorker } from './fixed_rate_cdt_worker/sendEmailForLiquidatedCdt.worker';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3005);
  process.env.TZ = credentials.TIME_ZONE;
  const fixedRateCdtWorker = app.get(FixedRateCdtWorker);
  await fixedRateCdtWorker.startListening();
  const sendEmailForLiquidatedCdtWorker = app.get(
    SendEmailForLiquidatedCdtWorker,
  );
  await sendEmailForLiquidatedCdtWorker.startListening();
}
bootstrap();
