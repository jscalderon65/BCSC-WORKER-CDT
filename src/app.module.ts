import { Module } from '@nestjs/common';
import { FixedRateCdtWorker } from './fixed_rate_cdt_worker/FixedRateCdt.worker';
import { SendEmailForLiquidatedCdtWorker } from './fixed_rate_cdt_worker/sendEmailForLiquidatedCdt.worker';
@Module({
  providers: [FixedRateCdtWorker, SendEmailForLiquidatedCdtWorker],
})
export class AppModule {}
