// src/admin/technicians/technicians.module.ts
import { Module } from '@nestjs/common';
import { AdminTechniciansService } from './technicians.service';
import { AdminTechniciansController } from './technicians.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminTechniciansController],
  providers: [AdminTechniciansService],
  exports: [AdminTechniciansService],
})
export class AdminTechniciansModule {}
