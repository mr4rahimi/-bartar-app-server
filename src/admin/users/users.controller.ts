import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminUsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { WalletAdjustDto } from './dto/wallet-adjust.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('admin/users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminUsersController {
  constructor(private svc: AdminUsersService) {}

  @Get()
  @Roles('admin')
  list(@Query('skip') skip = '0', @Query('take') take = '50') {
    return this.svc.list(Number(skip), Number(take));
  }

  @Get(':id')
  @Roles('admin')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.svc.get(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() body: CreateUserDto) {
    return this.svc.create(body);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserDto) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }

  @Post(':id/wallet')
  @Roles('admin')
  adjustWallet(@Param('id', ParseIntPipe) id: number, @Body() body: WalletAdjustDto) {
    return this.svc.adjustWallet(id, body);
  }

  @Get(':id/transactions')
  @Roles('admin')
  transactions(@Param('id', ParseIntPipe) id: number, @Query('skip') skip = '0', @Query('take') take = '50') {
    return this.svc.transactions(id, Number(skip), Number(take));
  }
}
