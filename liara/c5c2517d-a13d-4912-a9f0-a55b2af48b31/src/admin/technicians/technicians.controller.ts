// src/admin/technicians/technicians.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards, Req } from '@nestjs/common';
import { AdminTechniciansService } from './technicians.service';

@Controller('admin/technicians')
export class AdminTechniciansController {
  constructor(private readonly techniciansService: AdminTechniciansService) {}

  @Get()
  list() {
    return this.techniciansService.list();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.techniciansService.get(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.techniciansService.create(body);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.techniciansService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.techniciansService.remove(id);
  }

  @Get(':id/history')
  history(@Param('id', ParseIntPipe) id: number) {
    return this.techniciansService.history(id);
  }
}
