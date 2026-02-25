import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { AdminBasePricingService } from './base-pricing.service';

@Controller('admin/base-pricing')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminBasePricingController {
  constructor(private svc: AdminBasePricingService) {}

  @Post('problem/:problemId/part/:partId')
  @Roles('admin')
  attach(
    @Param('problemId', ParseIntPipe) problemId: number,
    @Param('partId', ParseIntPipe) partId: number,
  ) {
    return this.svc.attachPartToProblem(problemId, partId);
  }

  @Delete('problem/:problemId/part')
  @Roles('admin')
  detach(@Param('problemId', ParseIntPipe) problemId: number) {
    return this.svc.detachPartFromProblem(problemId);
  }

  @Get('service/:serviceId/mappings')
  @Roles('admin')
  listMappings(@Param('serviceId', ParseIntPipe) serviceId: number) {
    return this.svc.listMappingsByService(serviceId);
  }

  @Put('markup')
  @Roles('admin')
  async setMarkup(@Body() body: { percent: number }) {
    return this.svc.setMarkupPercent(body.percent ?? 0);
  }

  @Get('markup')
  @Roles('admin')
  getMarkup() {
    return this.svc.getMarkupPercent();
  }
}
