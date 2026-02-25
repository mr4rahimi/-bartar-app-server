import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { $Enums, Prisma, Order, OrderStage, User } from '@prisma/client';
import { createPushProvider } from './push/push.factory';
import { createSmsProvider } from './sms/sms.factory';
import { toE164Iran } from './sms/phone.util';

type PushPayload = {
  title?: string;
  body: string;
  data?: Record<string, any>;
};

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    user: true;
    brandRel: true;
    modelRel: true;
    problem: true;
  };
}>;

function safeJson(input: any) {
  try {
    return JSON.stringify(input);
  } catch {
    return JSON.stringify({ error: 'JSON_STRINGIFY_FAILED' });
  }
}

@Injectable()
export class NotificationsService {
  private pushProvider = createPushProvider();
  private smsProvider = createSmsProvider();

  constructor(private prisma: PrismaService) {}

  private adminPhones(): string[] {
    const raw = process.env.ADMIN_PHONES || '';
    return raw
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }

  private stageFa(stage: OrderStage): string {
    switch (stage) {
      case OrderStage.REGISTERED:
        return 'ثبت شد';
      case OrderStage.PRICE_SET:
        return 'قیمت تعیین شد';
      case OrderStage.TECHNICIAN_ASSIGNED:
        return 'تکنسین تخصیص یافت';
      case OrderStage.IN_REPAIR:
        return 'در حال تعمیر';
      case OrderStage.READY_FOR_PICKUP:
        return 'آماده تحویل';
      case OrderStage.COMPLETED:
        return 'تکمیل شد';
      default:
        return String(stage);
    }
  }

  private async createNotification(params: {
    userId: number;
    channel: $Enums.NotificationChannel;
    title?: string;
    body: string;
    data?: Record<string, any>;
    status?: $Enums.NotificationStatus;
    provider?: string;
    error?: string;
    sentAt?: Date | null;
  }) {
    const {
      userId,
      channel,
      title,
      body,
      data,
      status = $Enums.NotificationStatus.PENDING,
      provider = null,
      error,
      sentAt = null,
    } = params;

    return this.prisma.notification.create({
      data: {
        userId,
        channel,
        status,
        title: title ?? null,
        body,
        dataJson: data ? safeJson(data) : null,
        provider: provider ?? null,
        error: error ?? null,
        sentAt: sentAt ?? null,
      },
    });
  }

  // -------------------- PUSH --------------------

  async sendPushToUser(userId: number, payload: PushPayload) {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId, isActive: true },
      select: { token: true, platform: true },
    });

    if (!tokens.length) {
      return this.createNotification({
        userId,
        channel: $Enums.NotificationChannel.PUSH,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        status: $Enums.NotificationStatus.FAILED,
        provider: this.pushProvider.name,
        error: 'NO_DEVICE_TOKEN',
      });
    }

    const notif = await this.createNotification({
      userId,
      channel: $Enums.NotificationChannel.PUSH,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      status: $Enums.NotificationStatus.PENDING,
      provider: this.pushProvider.name,
    });

    try {
      const res = await this.pushProvider.send({
        tokens: tokens.map((t) => t.token),
        title: payload.title,
        body: payload.body,
        data: payload.data,
      });

      // فقط توکن‌های واقعاً invalid را deactivate کن
      if (res.errors?.length) {
        const badTokens = res.errors
          .filter((e) => {
            const msg = (e.error || '').toLowerCase();
            return (
              msg.includes('registration-token-not-registered') ||
              msg.includes('not registered') ||
              msg.includes('invalid registration token')
            );
          })
          .map((e) => e.token);

        if (badTokens.length) {
          await this.prisma.deviceToken.updateMany({
            where: { token: { in: badTokens } },
            data: { isActive: false },
          });
        }
      }

      const finalStatus =
        res.failureCount === 0
          ? $Enums.NotificationStatus.SENT
          : $Enums.NotificationStatus.FAILED;

      await this.prisma.notification.update({
        where: { id: notif.id },
        data: {
          status: finalStatus,
          sentAt: finalStatus === $Enums.NotificationStatus.SENT ? new Date() : null,
          error: res.errors?.length ? safeJson(res.errors) : null,
          provider: res.provider ?? this.pushProvider.name,
        },
      });

      return this.prisma.notification.findUnique({ where: { id: notif.id } });
    } catch (e: any) {
      await this.prisma.notification.update({
        where: { id: notif.id },
        data: {
          status: $Enums.NotificationStatus.FAILED,
          error: e?.message || String(e),
          provider: this.pushProvider.name,
        },
      });

      return this.prisma.notification.findUnique({ where: { id: notif.id } });
    }
  }

  async sendPushToAdmins(payload: PushPayload) {
    const admins = await this.prisma.user.findMany({
      where: { role: $Enums.Role.admin },
      select: { id: true },
    });

    if (!admins.length) return [];

    return Promise.all(admins.map((a) => this.sendPushToUser(a.id, payload)));
  }

  async onOrderCreatedForUser(order: Order, user: Pick<User, 'id' | 'name' | 'phone'>) {
    return this.sendPushToUser(user.id, {
      title: 'سفارش ثبت شد',
      body: `سفارش شما با شماره ${order.orderNumber} ثبت شد. به زودی با شما تماس می‌گیریم.`,
      data: { type: 'ORDER_CREATED', orderId: order.id, orderNumber: order.orderNumber },
    });
  }

  async onOrderCreatedForAdmins(order: Order, user: Pick<User, 'id' | 'name' | 'phone'>) {
    return this.sendPushToAdmins({
      title: 'سفارش جدید',
      body: `یک سفارش جدید ثبت شد: ${order.orderNumber} (${user.phone}${user.name ? ` - ${user.name}` : ''})`,
      data: {
        type: 'ADMIN_ORDER_CREATED',
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: user.id,
      },
    });
  }

  // -------------------- SMS (Pattern) --------------------

  private async sendSmsPatternToPhone(params: {
    userId: number;
    to: string;
    patternCode: string;
    templateParams: Record<string, any>;
    title?: string;
    bodyForLog: string;
    data?: Record<string, any>;
  }) {
    const notif = await this.createNotification({
      userId: params.userId,
      channel: $Enums.NotificationChannel.SMS,
      title: params.title,
      body: params.bodyForLog,
      data: params.data,
      status: $Enums.NotificationStatus.PENDING,
      provider: this.smsProvider.name,
    });

    try {
  const res = await this.smsProvider.sendPattern({
  to: params.to,
  patternCode: params.patternCode,
  params: params.templateParams,
});

await this.prisma.notification.update({
  where: { id: notif.id },
  data: {
    status: res.success ? $Enums.NotificationStatus.SENT : $Enums.NotificationStatus.FAILED,
    sentAt: res.success ? new Date() : null,
    provider: this.smsProvider.name,
    error: res.success ? null : (res.error ?? safeJson(res)),
  },
});

return { notifId: notif.id, provider: this.smsProvider.name, res };

} catch (e: any) {
  await this.prisma.notification.update({
    where: { id: notif.id },
    data: {
      status: $Enums.NotificationStatus.FAILED,
      provider: this.smsProvider.name,
      error: e?.message || String(e),
    },
  });
  return { notifId: notif.id, provider: this.smsProvider.name, error: e?.message || String(e) };
}

  }

  async smsOrderCreatedToUser(order: OrderWithRelations, user: Pick<User, 'id' | 'name' | 'phone'>) {
    const enabled = (process.env.SMS_ENABLED || 'false').toLowerCase() === 'true';
    const pattern = process.env.SMS_PATTERN_ORDER_CREATED || '';
    if (!enabled || !pattern) return;

    const deviceName = [order.deviceType, order.brandRel?.name || order.brand, order.modelRel?.name || order.model]
      .filter(Boolean)
      .join(' ');

    const deviceProblem = order.problem?.name || order.issue || 'درخواست سرویس';

    return this.sendSmsPatternToPhone({
      userId: user.id,
      to: toE164Iran(user.phone),
      patternCode: pattern,
      templateParams: {
        name: user.name || 'کاربر',
        devicename: deviceName || 'دستگاه',
        deviceproblem: deviceProblem,
        ordernamber: order.orderNumber,
      },
      title: 'ثبت سفارش',
      bodyForLog: `ORDER_CREATED ${order.orderNumber}`,
      data: { type: 'SMS_ORDER_CREATED', orderId: order.id, orderNumber: order.orderNumber },
    });
  }

  async smsOrderStageChangedToUser(order: OrderWithRelations, user: Pick<User, 'id' | 'name' | 'phone'>) {
    const enabled = (process.env.SMS_ENABLED || 'false').toLowerCase() === 'true';
    const pattern = process.env.SMS_PATTERN_ORDER_STAGE || '';
    if (!enabled || !pattern) return;

    return this.sendSmsPatternToPhone({
      userId: user.id,
      to: toE164Iran(user.phone),
      patternCode: pattern,
      templateParams: {
        name: user.name || 'کاربر',
        ordernamber: order.orderNumber,
        orderrole: this.stageFa(order.orderStage),
      },
      title: 'تغییر مرحله سفارش',
      bodyForLog: `ORDER_STAGE ${order.orderNumber} -> ${order.orderStage}`,
      data: { type: 'SMS_ORDER_STAGE', orderId: order.id, orderNumber: order.orderNumber, stage: order.orderStage },
    });
  }

  async smsOrderCreatedToAdmins(order: OrderWithRelations, user: Pick<User, 'id' | 'name' | 'phone'>) {
    const enabled = (process.env.SMS_ENABLED || 'false').toLowerCase() === 'true';
    const pattern = process.env.SMS_PATTERN_ORDER_CREATED || '';
    if (!enabled || !pattern) return;

    const phones = this.adminPhones();
    if (!phones.length) return;

    const systemUserId = Number(process.env.ADMIN_SYSTEM_USER_ID || '1');

    const deviceName = [order.deviceType, order.brandRel?.name || order.brand, order.modelRel?.name || order.model]
      .filter(Boolean)
      .join(' ');

    const deviceProblem = order.problem?.name || order.issue || 'درخواست سرویس';

    return Promise.all(
      phones.map((ph) =>
        this.sendSmsPatternToPhone({
          userId: systemUserId,
          to: toE164Iran(ph),
          patternCode: pattern,
          templateParams: {
            name: user.name || user.phone || 'کاربر',
            devicename: deviceName || 'دستگاه',
            deviceproblem: deviceProblem,
            ordernamber: order.orderNumber,
          },
          title: 'ثبت سفارش (ادمین)',
          bodyForLog: `ADMIN_ORDER_CREATED ${order.orderNumber} user=${user.phone}`,
          data: { type: 'SMS_ADMIN_ORDER_CREATED', orderId: order.id, orderNumber: order.orderNumber },
        }),
      ),
    );
  }

  async health() {
    return {
      pushProvider: this.pushProvider.name,
      smsProvider: this.smsProvider.name,
      pushProviderEnv: process.env.PUSH_PROVIDER || null,
      smsProviderEnv: process.env.SMS_PROVIDER || null,
      smsEnabled: (process.env.SMS_ENABLED || 'false').toLowerCase() === 'true',
      adminPhonesCount: this.adminPhones().length,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || null,
      hasServiceJson: !!(process.env.FIREBASE_SERVICE_ACCOUNT_JSON && process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim()),
      hasServicePath: !!(process.env.FIREBASE_SERVICE_ACCOUNT_PATH && process.env.FIREBASE_SERVICE_ACCOUNT_PATH.trim()),
    };
  }

  async smsLoginOtpToPhone(phone09: string, code: string) {
  const enabled = (process.env.SMS_ENABLED || 'false').toLowerCase() === 'true';
  const pattern = process.env.SMS_PATTERN_LOGIN_OTP || '';
  if (!enabled || !pattern) return;

  // اینجا userId نداریم، پس با systemUserId لاگ می‌کنیم
  const systemUserId = Number(process.env.ADMIN_SYSTEM_USER_ID || '1');

  return this['sendSmsPatternToPhone']({
    userId: systemUserId,
    to: toE164Iran(phone09),
    patternCode: pattern,
    templateParams: { code },
    title: 'کد تایید',
    bodyForLog: `LOGIN_OTP to=${phone09}`,
    data: { type: 'SMS_LOGIN_OTP' },
  });
}

async smsHealth() {
  return {
    smsEnabled: (process.env.SMS_ENABLED || 'false').toLowerCase() === 'true',
    smsProviderEnv: process.env.SMS_PROVIDER || null,
    from: process.env.SMS_FROM_NUMBER || null,
    hasToken: !!(process.env.SMS_API_TOKEN && process.env.SMS_API_TOKEN.trim()),
    patternLogin: process.env.SMS_PATTERN_LOGIN || null,
    patternOrderCreated: process.env.SMS_PATTERN_ORDER_CREATED || null,
    patternOrderStage: process.env.SMS_PATTERN_ORDER_STAGE || null,
    adminPhones: (process.env.ADMIN_PHONES || '').split(',').map(x => x.trim()).filter(Boolean).length,
  };
}

async sendOtpSmsToPhone(phone09: string, code: string) {
  const enabled = (process.env.SMS_ENABLED || 'false').toLowerCase() === 'true';
  const pattern = process.env.SMS_PATTERN_LOGIN || '';

  // اینجا همیشه یک notification می‌سازیم تا در DB ببینیم چه شد
  const systemUserId = Number(process.env.ADMIN_SYSTEM_USER_ID || '1');
  const to = toE164Iran(phone09);

  if (!enabled || !pattern) {
    return this.sendSmsPatternToPhone({
      userId: systemUserId,
      to,
      patternCode: pattern || 'MISSING_PATTERN',
      templateParams: { code },
      title: 'OTP',
      bodyForLog: `OTP(SKIPPED) enabled=${enabled} pattern=${pattern ? 'set' : 'missing'} to=${to}`,
      data: { type: 'OTP', phone: to, skipped: true, enabled, hasPattern: !!pattern },
    });
  }

  return this.sendSmsPatternToPhone({
    userId: systemUserId,
    to,
    patternCode: pattern,
    templateParams: { code },
    title: 'OTP',
    bodyForLog: `OTP to=${to}`,
    data: { type: 'OTP', phone: to },
  });
}


}
