import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  async registerDevice(userId: number, dto: RegisterDeviceDto) {
    const { token, platform } = dto;

    // اگر قبلاً این توکن ثبت شده، فقط آپدیتش کن (مالکیت + lastSeen)
    return this.prisma.deviceToken.upsert({
      where: { token },
      create: {
        token,
        platform: platform as any,
        userId,
        isActive: true,
        lastSeenAt: new Date(),
      },
      update: {
        userId,
        platform: platform as any,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });
  }

  async deactivateToken(userId: number, token: string) {
    // اختیاری (فعلاً استفاده نمی‌کنیم)
    return this.prisma.deviceToken.updateMany({
      where: { userId, token },
      data: { isActive: false },
    });
  }
}
