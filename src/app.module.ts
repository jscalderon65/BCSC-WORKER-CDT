import { Module } from '@nestjs/common';
import { FixedRateCdtWorker } from './fixed_rate_cdt_worker/FixedRateCdt.worker';

@Module({
  providers: [FixedRateCdtWorker],
})
export class AppModule {}
