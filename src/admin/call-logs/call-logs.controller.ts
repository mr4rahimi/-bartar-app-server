import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { AdminCallLogsService } from './call-logs.service';
import { CreateCallLogDto } from './dto/create-call-log.dto';
import { UpdateCallLogDto } from './dto/update-call-log.dto';
import { FinalizeCallLogDto } from './dto/finalize-call-log.dto';
import { ListCallLogsDto } from './dto/list-call-logs.dto';
import { CallLogsDailyReportDto } from './dto/call-logs-daily-report.dto';

@Controller('admin/call-logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminCallLogsController {
  constructor(private svc: AdminCallLogsService) {}

  @Get('history')
  @Roles('admin')
  history(@Query() q: ListCallLogsDto) {
    return this.svc.history(q);
  }

  @Post()
  @Roles('admin')
  create(@Req() req: { user?: { userId?: number } }, @Body() body: CreateCallLogDto) {
    const operatorId = req.user?.userId;
    return this.svc.create(operatorId as number, body);
  }

  @Get()
  @Roles('admin')
  list(@Query('date') date?: string) {
    return this.svc.list({ date });
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateCallLogDto) {
    return this.svc.update(id, body);
  }

  @Patch(':id/finalize')
  @Roles('admin')
  finalize(@Param('id', ParseIntPipe) id: number, @Body() body: FinalizeCallLogDto) {
    return this.svc.setFinalized(id, body.finalized);
  }

    @Get('reports/daily')
  @Roles('admin')
  daily(@Query() q: CallLogsDailyReportDto) {
    const serviceId =
      q.serviceId == null || q.serviceId === '' ? undefined : Number(q.serviceId);

    return this.svc.dailyReport({
      range: q.range,
      from: q.from,
      to: q.to,
      serviceId: Number.isFinite(serviceId as number) ? (serviceId as number) : undefined,
    });
  }
}