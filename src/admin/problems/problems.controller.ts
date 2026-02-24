import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { AdminProblemsService } from './problems.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';

@Controller('admin/problems')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminProblemsController {
  constructor(private svc: AdminProblemsService) {}

  @Post()
  @Roles('admin')
  create(@Body() body: CreateProblemDto) {
    return this.svc.create(body as any);
  }

  @Get()
  @Roles('admin')
  list() {
    return this.svc.list();
  }

  @Get(':id')
  @Roles('admin')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.svc.get(id);
  }

  @Put(':id')
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any, // 🔹 اینجا رو باز گذاشتیم تا partId هم رد بشه
  ) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
