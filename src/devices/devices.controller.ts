import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('register')
  async register(@Req() req: any, @Body() body: RegisterDeviceDto) {
    const userId = req.user.userId ?? req.user.sub ?? req.user?.sub;
    return this.devicesService.registerDevice(+userId, body);
  }
}
