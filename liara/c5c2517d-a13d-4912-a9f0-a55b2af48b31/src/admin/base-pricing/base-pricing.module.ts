import { Module } from '@nestjs/common';
import { AdminBasePricingService } from './base-pricing.service';
import { AdminBasePricingController } from './base-pricing.controller';

@Module({
  providers: [AdminBasePricingService],
  controllers: [AdminBasePricingController],
  exports: [AdminBasePricingService],
})
export class AdminBasePricingModule {}
