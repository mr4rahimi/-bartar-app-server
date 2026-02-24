import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderStage, OrderStatus } from "@prisma/client";
import { PreviewBasePriceDto } from './dto/preview-base-price.dto';
import { NotificationsService } from '../notifications/notifications.service';




@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}
  


  /**
   * محاسبه قیمت پایه بر اساس:
   * - مشکل (problemId)
   * - سرویس / برند / مدل
   * - قیمت قطعه + درصد اضافه + اجرت
   */

  private async computeBasePrice(params: {
    serviceId: number;
    brandId: number;
    modelId?: number;
    problemId?: number;
  }): Promise<number | null> {
    const { serviceId, brandId, modelId, problemId } = params;

    if (!problemId) return null;

    // پیدا کردن قطعه‌ای که به این مشکل وصل شده
    const mapping = await this.prisma.problemPart.findUnique({
      where: { problemId },
      include: { part: true },
    });

    // اگر برای این مشکل هیچ قطعه‌ای تعریف نشده → قیمت پایه پیش‌فرض 0
    if (!mapping) {
      return 0;
    }

    const partId = mapping.partId;

    // 1) پیدا کردن قیمت قطعه
    let priceRecord = null;

    // اولویت 1: سرویس + برند + مدل + قطعه
    if (modelId) {
      priceRecord = await this.prisma.partPrice.findFirst({
        where: { serviceId, brandId, modelId, partId },
      });
    }

    // اولویت 2: سرویس + برند + قطعه (بدون مدل)
    if (!priceRecord) {
      priceRecord = await this.prisma.partPrice.findFirst({
        where: { serviceId, brandId, modelId: null, partId },
      });
    }

    // اولویت 3: سرویس + قطعه (کلی برای همه‌ی برندها/مدل‌ها)
    if (!priceRecord) {
      priceRecord = await this.prisma.partPrice.findFirst({
        where: { serviceId, brandId: null, modelId: null, partId },
      });
    }

    // اگر هنوز قیمتی برای قطعه پیدا نشده → 0
    if (!priceRecord) {
      return 0;
    }

    const partPrice = priceRecord.price;

    // اگر قیمت قطعه 0 یا منفی بود → کل قیمت پایه 0
    if (!partPrice || partPrice <= 0) {
      return 0;
    }

    // 2) درصد اضافه روی قیمت قطعه (Markup)
    const cfg = await this.prisma.pricingConfig.findUnique({ where: { id: 1 } });
    const markupPercent = cfg?.partMarkupPercent ?? 0;
    const markupAmount = Math.round(partPrice * (markupPercent / 100));

    // 3) اجرت
    let laborFee = 0;

    // اولویت 1: مدل خاص
    if (modelId) {
      const modelLabor = await this.prisma.partLabor.findFirst({
        where: { serviceId, partId, modelId },
      });
      if (modelLabor) laborFee = modelLabor.laborFee;
    }

    // اولویت 2: برند خاص (بدون مدل)
    if (laborFee === 0) {
      const brandLabor = await this.prisma.partLabor.findFirst({
        where: { serviceId, partId, brandId, modelId: null },
      });
      if (brandLabor) laborFee = brandLabor.laborFee;
    }

    // اولویت 3: کلی برای همه (بدون برند/مدل)
    if (laborFee === 0) {
      const genericLabor = await this.prisma.partLabor.findFirst({
        where: { serviceId, partId, brandId: null, modelId: null },
      });
      if (genericLabor) laborFee = genericLabor.laborFee;
    }

    const basePrice = partPrice + markupAmount + laborFee;
    return basePrice;
  }


  async create(userId: number, dto: CreateOrderDto) {
    const serviceId = Number(dto.serviceId);
    const brandId = Number(dto.brandId);
    const modelId = dto.modelId !== undefined ? Number(dto.modelId) : undefined;
    const problemId = dto.problemId !== undefined ? Number(dto.problemId) : undefined;

    const svc = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!svc) throw new BadRequestException("Invalid serviceId");

    const brandLink = await this.prisma.brandService.findFirst({
      where: { brandId, serviceId },
    });
    if (!brandLink) throw new BadRequestException("Selected brand is not available for this service");

    if (modelId) {
      const model = await this.prisma.deviceModel.findUnique({ where: { id: modelId } });
      if (!model) throw new BadRequestException("Invalid modelId");
      if (model.brandId !== brandId) throw new BadRequestException("Model does not belong to selected brand");
      if (model.serviceId && model.serviceId !== serviceId) throw new BadRequestException("Model is not for selected service");
    }

    if (problemId) {
      const problem = await this.prisma.problem.findUnique({ where: { id: problemId } });
      if (!problem) {
        throw new BadRequestException("Invalid problemId");
      }
      if (problem.serviceId !== serviceId) {
        throw new BadRequestException("Problem does not belong to selected service");
      }
    }

    // اگر basePrice توسط فرانت نیامده، خودمان سعی می‌کنیم حساب کنیم
    let basePrice = dto.basePrice ?? undefined;
    if (basePrice === undefined && serviceId && brandId && problemId) {
      const computed = await this.computeBasePrice({
        serviceId,
        brandId,
        modelId,
        problemId,
      });
      if (computed != null) {
        basePrice = computed;
      }
    }

    const now = new Date();
    const sn = `BT-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 90000) + 10000}`;

    const created = await this.prisma.order.create({
  data: {
    orderNumber: sn,
    userId,
    serviceId,
    brandId,
    modelId: modelId ?? null,
    deviceType: dto.deviceType,
    brand: dto.brand ?? undefined,
    model: dto.model ?? undefined,
    issue: dto.issue,
    problemId: problemId ?? null,
    imageUrl: dto.imageUrl ?? undefined,
    pickupMethod: dto.pickupMethod as any,
    status: OrderStatus.PENDING,
    orderStage: OrderStage.REGISTERED,
    basePrice: basePrice ?? undefined,
    finalPrice: dto.finalPrice ?? undefined,
    notes: dto.notes ?? undefined,
  },
  include: {
    service: true,
    brandRel: true,
    modelRel: true,
    problem: true,
    reports: true,
    user: true,
  },
});

// نوتیف برای کاربر
await this.notifications.onOrderCreatedForUser(created, {
  id: created.userId,
  name: created.user?.name ?? null,
  phone: created.user?.phone ?? '',
} as any);

// نوتیف برای ادمین‌ها
await this.notifications.onOrderCreatedForAdmins(created, {
  id: created.userId,
  name: created.user?.name ?? null,
  phone: created.user?.phone ?? '',
} as any);

await this.notifications.smsOrderCreatedToUser(created, {
  id: created.userId,
  name: created.user?.name ?? null,
  phone: created.user?.phone ?? '',
} as any);

await this.notifications.smsOrderCreatedToAdmins(created, {
  id: created.userId,
  name: created.user?.name ?? null,
  phone: created.user?.phone ?? '',
} as any);


return created;

    

    
  }


  



  async findById(id: number) {
    const ord = await this.prisma.order.findUnique({
      where: { id },
      include: {
        reports: true,
        user: true,
        service: true,
        brandRel: true,
        modelRel: true,
        technician: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!ord) throw new NotFoundException("Order not found");
    return ord;
  }

  async listForUser(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        reports: true,
        service: true,
        brandRel: true,
        modelRel: true,
        technician: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async listAll() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reports: true,
        service: true,
        brandRel: true,
        modelRel: true,
        technician: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateStage(orderId: number, stage: OrderStage) {
    return this.prisma.order.update({ where: { id: orderId }, data: { orderStage: stage } });
  }

  async updateStatus(orderId: number, status: OrderStatus) {
    return this.prisma.order.update({ where: { id: orderId }, data: { status } });
  }

  async addReport(orderId: number, actorId: number, action: string, details?: string) {
    return this.prisma.orderReport.create({ data: { orderId, actorId, action, details } });
  }


    async previewBasePrice(dto: PreviewBasePriceDto) {
    const serviceId = Number(dto.serviceId);
    const brandId = Number(dto.brandId);
    const modelId =
      dto.modelId !== undefined ? Number(dto.modelId) : undefined;
    const problemId =
      dto.problemId !== undefined ? Number(dto.problemId) : undefined;

    if (!problemId) {
      // اگر مشکل انتخاب نشده، قیمت پایه‌ای نداریم
      return { basePrice: null };
    }

    const computed = await this.computeBasePrice({
      serviceId,
      brandId,
      modelId,
      problemId,
    });

    return { basePrice: computed ?? null };
  }


  async confirmFinalPrice(orderId: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (order.userId !== userId) {
      throw new ForbiddenException("این سفارش متعلق به شما نیست");
    }

    if (!order.finalPrice) {
      throw new BadRequestException("قیمت نهایی هنوز تعیین نشده است");
    }

    if (order.finalPriceConfirmed) {
      return order;
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        finalPriceConfirmed: true,
        finalPriceConfirmedAt: new Date(),
        reports: {
          create: {
            actorId: userId,
            action: "تایید قیمت نهایی توسط کاربر",
            details: "کاربر قیمت نهایی را تایید کرد.",
          },
        },
      },
      include: {
        reports: true,
        service: true,
        brandRel: true,
        modelRel: true,
      },
    });

    return updated;
  }

  
}
