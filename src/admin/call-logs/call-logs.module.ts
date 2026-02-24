import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminCallLogsController } from './call-logs.controller';
import { AdminCallLogsService } from './call-logs.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminCallLogsController],
  providers: [AdminCallLogsService],
})
export class AdminCallLogsModule {}