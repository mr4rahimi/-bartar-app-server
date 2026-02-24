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

@Controller('admin/call-logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminCallLogsController {
  constructor(private svc: AdminCallLogsService) {}

  @Post()
  @Roles('admin')
  create(@Req() req: any, @Body() body: CreateCallLogDto) {
    const operatorId = req.user?.userId;
    return this.svc.create(operatorId, body);
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
  finalize(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: FinalizeCallLogDto,
  ) {
    return this.svc.setFinalized(id, body.finalized);
  }
}