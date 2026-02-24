import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, $Enums, OrderStage } from '@prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';


@Injectable()
export class AdminOrdersService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}


  async list() {
    return this.prisma.order.findMany({
      include: {
        user: true,
        service: true,
        brandRel: true,
        modelRel: true,
        technician: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        service: true,
        brandRel: true,
        modelRel: true,
        technician: true,
        reports: true,
      },
    });
  }

  async update(id: number, data: Prisma.OrderUpdateInput) {
  const before = await this.prisma.order.findUnique({
    where: { id },
    select: { orderStage: true },
  });
  if (!before) return this.prisma.order.update({ where: { id }, data });

  const prevStage = before.orderStage;

  const updated = await this.prisma.order.update({
    where: { id },
    data,
    include: { user: true, brandRel: true, modelRel: true, problem: true },
  });

  const nextStage = updated.orderStage;

  if (prevStage !== nextStage) {
    const msg = stageMessage(nextStage, updated.orderNumber);

    await this.notifications.sendPushToUser(updated.userId, {
      title: msg.title,
      body: msg.body,
      data: {
        type: 'ORDER_STAGE_CHANGED',
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        stage: nextStage,
      },
    });

    await this.notifications.sendPushToAdmins({
      title: 'تغییر مرحله سفارش',
      body: `سفارش ${updated.orderNumber} از ${prevStage} به ${nextStage} تغییر کرد.`,
      data: {
        type: 'ADMIN_ORDER_STAGE_CHANGED',
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        prevStage,
        nextStage,
      },
    });

    await this.prisma.orderReport.create({
      data: {
        orderId: updated.id,
        actorId: null,
        action: 'تغییر مرحله سفارش',
        details: `Stage: ${prevStage} -> ${nextStage}`,
      },
    });

    await this.notifications.smsOrderStageChangedToUser(updated, {
      id: updated.userId,
      name: updated.user?.name ?? null,
      phone: updated.user?.phone ?? '',
    } as any);
  }

  return updated;
}



  async assignTechnician(orderId: number, technicianId: number) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        orderStage: { set: $Enums.OrderStage.TECHNICIAN_ASSIGNED },
        technicianId,
        reports: {
          create: {
            actorId: technicianId,
            action: 'تخصیص تکنسین',
            details: 'تکنسین به سفارش اختصاص یافت.',
          },
        },
      },
    });
  }

  async createReport(orderId: number, actorId: number, action: string, details?: string) {
    return this.prisma.orderReport.create({
      data: {
        orderId,
        actorId,
        action,
        details,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.order.delete({ where: { id } });
  }
}


function stageMessage(stage: OrderStage, orderNumber: string) {
  switch (stage) {
    case OrderStage.REGISTERED:
      return { title: 'سفارش ثبت شد', body: `سفارش ${orderNumber} ثبت شد.` };
    case OrderStage.PRICE_SET:
      return { title: 'قیمت تعیین شد', body: `قیمت سفارش ${orderNumber} تعیین شد. لطفاً بررسی کنید.` };
    case OrderStage.TECHNICIAN_ASSIGNED:
      return { title: 'تکنسین تخصیص یافت', body: `تکنسین برای سفارش ${orderNumber} تعیین شد.` };
    case OrderStage.IN_REPAIR:
      return { title: 'در حال تعمیر', body: `سفارش ${orderNumber} در حال تعمیر است.` };
    case OrderStage.READY_FOR_PICKUP:
      return { title: 'آماده تحویل', body: `سفارش ${orderNumber} آماده تحویل است.` };
    case OrderStage.COMPLETED:
      return { title: 'تکمیل شد', body: `سفارش ${orderNumber} تکمیل شد. با گارانتی تحویل می‌شود.` };
    default:
      return { title: 'به‌روزرسانی سفارش', body: `وضعیت سفارش ${orderNumber} به‌روزرسانی شد.` };
  }
}
