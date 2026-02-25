import { Module } from '@nestjs/common';
import { AdminProblemsService } from './problems.service';
import { AdminProblemsController } from './problems.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AdminProblemsService],
  controllers: [AdminProblemsController],
})
export class AdminProblemsModule {}