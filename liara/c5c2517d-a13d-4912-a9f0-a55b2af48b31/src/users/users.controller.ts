// src/users/users.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private svc: UsersService) {}

  @Get()
  list(@Query('skip') skip = '0', @Query('take') take = '50') {
    return this.svc.listAll(Number(skip), Number(take));
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findById(id);
  }

  @Post()
  create(@Body() body: any) {
    // This controller is minimal — in production protect/create validations
    return this.svc.create(body);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.delete(id);
  }
}
