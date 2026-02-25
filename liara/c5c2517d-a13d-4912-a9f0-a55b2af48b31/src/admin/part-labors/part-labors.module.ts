import { Module } from '@nestjs/common';
import { AdminPartLaborsService } from './part-labors.service';
import { AdminPartLaborsController } from './part-labors.controller';

@Module({
  providers: [AdminPartLaborsService],
  controllers: [AdminPartLaborsController],
  exports: [AdminPartLaborsService],
})
export class AdminPartLaborsModule {}
