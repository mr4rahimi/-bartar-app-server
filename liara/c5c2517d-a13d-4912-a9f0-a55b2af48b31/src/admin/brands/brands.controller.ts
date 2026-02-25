import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { AdminBrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';

@Controller('admin/brands')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminBrandsController {
  constructor(private svc: AdminBrandsService) {}

  @Post()
  @Roles('admin')
  create(@Body() body: CreateBrandDto) {
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
    return this.svc.findOne(id);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<CreateBrandDto>) {
    return this.svc.update(id, body as any);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
