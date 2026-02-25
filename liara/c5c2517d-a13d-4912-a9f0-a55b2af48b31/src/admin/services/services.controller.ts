import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { AdminServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';

@Controller('admin/services')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminServicesController {
  constructor(private svc: AdminServicesService) {}

  @Post()
  @Roles('admin')
  create(@Body() body: CreateServiceDto) {
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
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<CreateServiceDto>) {
    return this.svc.update(id, body as any);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.svc.delete(id);
  }
}
