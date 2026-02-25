import { Module } from '@nestjs/common';
import { AdminBrandsService } from './brands.service';
import { AdminBrandsController } from './brands.controller';

@Module({
  providers: [AdminBrandsService],
  controllers: [AdminBrandsController],
})
export class AdminBrandsModule {}
