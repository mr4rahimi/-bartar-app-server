import { Module } from '@nestjs/common';
import { AdminPartPricesService } from './part-prices.service';
import { AdminPartPricesController } from './part-prices.controller';

@Module({
  providers: [AdminPartPricesService],
  controllers: [AdminPartPricesController],
  exports: [AdminPartPricesService],
})
export class AdminPartPricesModule {}
