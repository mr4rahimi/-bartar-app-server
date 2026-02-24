import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { AdminPartsService } from './parts.service';
import { CreatePartDto } from './dto/create-part.dto';

@Controller('admin/parts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminPartsController {
  constructor(private svc: AdminPartsService) {}

  @Post()
  @Roles('admin')
  create(@Body() body: CreatePartDto) {
    return this.svc.create(body as any);
  }

  @Get()
  @Roles('admin')
  list(
    @Query('serviceId') serviceId?: string,
    @Query('q') q?: string,
  ) {
    return this.svc.list({
      serviceId: serviceId ? +serviceId : undefined,
      q: q || undefined,
    });
  }

  @Get(':id')
  @Roles('admin')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.svc.get(id);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<CreatePartDto>) {
    return this.svc.update(id, body as any);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
