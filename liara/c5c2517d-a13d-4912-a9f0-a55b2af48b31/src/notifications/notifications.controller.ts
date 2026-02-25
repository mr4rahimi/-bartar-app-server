import { Controller, Get, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get('health')
  async health() {
    return this.notifications.health();
  }

  // تست ارسال مستقیم به یک userId (مثلاً خودت)
  @Get('test')
  async test(@Query('userId') userId: string) {
    const uid = Number(userId);
    return this.notifications.sendPushToUser(uid, {
      title: 'تست نوتیف',
      body: 'اگر اینو دیدی یعنی FCM واقعی اوکیه',
      data: { type: 'TEST_PUSH', ts: Date.now() },
    });
  }

  @Get('sms-health')
smsHealth() {
  return this.notifications.smsHealth();
}
}
