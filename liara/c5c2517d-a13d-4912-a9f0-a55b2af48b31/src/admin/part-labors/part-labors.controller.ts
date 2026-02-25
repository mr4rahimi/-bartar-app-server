import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { AdminPartLaborsService } from './part-labors.service';
import { CreatePartLaborDto } from './dto/create-part-labor.dto';

@Controller('admin/part-labors')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminPartLaborsController {
  constructor(private svc: AdminPartLaborsService) {}

  @Post()
  @Roles('admin')
  create(@Body() body: CreatePartLaborDto) {
    return this.svc.create(body as any);
  }

  @Get()
  @Roles('admin')
  list(
    @Query('serviceId') serviceId?: string,
    @Query('brandId') brandId?: string,
    @Query('modelId') modelId?: string,
    @Query('partId') partId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.svc.list({
      serviceId: serviceId ? +serviceId : undefined,
      brandId: brandId ? +brandId : undefined,
      modelId: modelId ? +modelId : undefined,
      partId: partId ? +partId : undefined,
      skip: skip ? +skip : undefined,
      take: take ? +take : undefined,
    });
  }

  @Get(':id')
  @Roles('admin')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.svc.get(id);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<CreatePartLaborDto>) {
    return this.svc.update(id, body as any);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.svc.delete(id);
  }
}
