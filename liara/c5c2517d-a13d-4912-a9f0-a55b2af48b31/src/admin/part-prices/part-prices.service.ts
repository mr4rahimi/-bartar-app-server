import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { PartPriceBulkOperation, PartPriceBulkUpdateDto } from './dto/bulk-update-part-price.dto';

type CreatePartPriceInput = {
  serviceId: number;
  brandId?: number;
  modelId?: number;
  partId: number;
  price: number;
  highCopyPrice?: number | null;
  copyPrice?: number | null;
};

type UpdatePartPriceInput = {
  price?: number;
  highCopyPrice?: number | null;
  copyPrice?: number | null;
};

@Injectable()
export class AdminPartPricesService {
  constructor(private prisma: PrismaService) {}

  /**
   * ایجاد یا به‌روزرسانی قیمت قطعه
   * اگر برای ترکیب (serviceId, brandId, modelId, partId) قبلاً ردیفی وجود داشته باشد،
   * همان ردیف را آپدیت می‌کنیم (قیمت جدید)، در غیر این صورت ردیف جدید می‌سازیم.
   */
  async create(data: CreatePartPriceInput) {
    const { serviceId, brandId, modelId, partId, price, highCopyPrice, copyPrice } = data;

    // --- ولیدیشن سرویس ---
    const svc = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!svc) throw new BadRequestException('Invalid serviceId');

    // --- ولیدیشن قطعه ---
    const part = await this.prisma.part.findUnique({ where: { id: partId } });
    if (!part) throw new BadRequestException('Invalid partId');
    if (part.serviceId !== serviceId) {
      throw new BadRequestException('Part does not belong to selected service');
    }

    // --- ولیدیشن برند (اختیاری) ---
    if (brandId) {
      const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
      if (!brand) throw new BadRequestException('Invalid brandId');
    }

    // --- ولیدیشن مدل (اختیاری) ---
    if (modelId) {
      const model = await this.prisma.deviceModel.findUnique({ where: { id: modelId } });
      if (!model) throw new BadRequestException('Invalid modelId');

      if (brandId && model.brandId !== brandId) {
        throw new BadRequestException('Model does not belong to selected brand');
      }
      if (model.serviceId && model.serviceId !== serviceId) {
        throw new BadRequestException('Model is not for selected service');
      }
    }

    // --- چک وجود قبلی برای جلوگیری از P2002 (unique constraint) ---
    const existing = await this.prisma.partPrice.findFirst({
      where: {
        serviceId,
        brandId: brandId ?? null,
        modelId: modelId ?? null,
        partId,
      },
    });

    if (existing) {
      // اگر قبلاً ردیفی برای این ترکیب بوده، همونو از نظر قیمت‌ها آپدیت کن
      const updateData: Prisma.PartPriceUpdateInput = {
        price,
      };

      if (highCopyPrice !== undefined) {
        (updateData as any).highCopyPrice = highCopyPrice;
      }
      if (copyPrice !== undefined) {
        (updateData as any).copyPrice = copyPrice;
      }

      return this.prisma.partPrice.update({
        where: { id: existing.id },
        data: updateData,
        include: { service: true, brand: true, model: true, part: true },
      });
    }

    // اگر نبود، create کن
    return this.prisma.partPrice.create({
      data: {
        service: { connect: { id: serviceId } },
        brand: brandId ? { connect: { id: brandId } } : undefined,
        model: modelId ? { connect: { id: modelId } } : undefined,
        part: { connect: { id: partId } },
        price,
        highCopyPrice: highCopyPrice ?? null,
        copyPrice: copyPrice ?? null,
      },
      include: { service: true, brand: true, model: true, part: true },
    });
  }

  async list(filter?: {
    serviceId?: number;
    brandId?: number;
    modelId?: number;
    partId?: number;
    q?: string;
    skip?: number;
    take?: number;
  }) {
    const where: any = {};
    if (filter?.serviceId) where.serviceId = filter.serviceId;
    if (filter?.brandId) where.brandId = filter.brandId;
    if (filter?.modelId) where.modelId = filter.modelId;
    if (filter?.partId) where.partId = filter.partId;
    if (filter?.q) {
      where.OR = [
        { part: { name: { contains: filter.q, mode: 'insensitive' } } },
        { brand: { name: { contains: filter.q, mode: 'insensitive' } } },
        { model: { name: { contains: filter.q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.partPrice.findMany({
        where,
        include: { service: true, brand: true, model: true, part: true },
        orderBy: [
          { serviceId: 'asc' },
          { brandId: 'asc' },
          { modelId: 'asc' },
          { partId: 'asc' },
        ],
        skip: filter?.skip ?? 0,
        take: filter?.take ?? 1000,
      }),
      this.prisma.partPrice.count({ where }),
    ]);

    return { items, total };
  }

  get(id: number) {
    return this.prisma.partPrice.findUnique({
      where: { id },
      include: { service: true, brand: true, model: true, part: true },
    });
  }

  async update(id: number, data: UpdatePartPriceInput) {
    const updateData: Prisma.PartPriceUpdateInput = {};

    if (data.price !== undefined) {
      (updateData as any).price = data.price;
    }
    if (data.highCopyPrice !== undefined) {
      (updateData as any).highCopyPrice = data.highCopyPrice;
    }
    if (data.copyPrice !== undefined) {
      (updateData as any).copyPrice = data.copyPrice;
    }

    return this.prisma.partPrice.update({
      where: { id },
      data: updateData,
      include: { service: true, brand: true, model: true, part: true },
    });
  }

  delete(id: number) {
    return this.prisma.partPrice.delete({ where: { id } });
  }

  async bulkUpdate(dto: PartPriceBulkUpdateDto) {
    const where: any = {};
    if (dto.ids?.length) where.id = { in: dto.ids };
    if (dto.filter?.serviceId) where.serviceId = dto.filter.serviceId;
    if (dto.filter?.brandId) where.brandId = dto.filter.brandId;
    if (dto.filter?.modelId) where.modelId = dto.filter.modelId;
    if (dto.filter?.partId) where.partId = dto.filter.partId;

    const items = await this.prisma.partPrice.findMany({ where });
    if (!items.length) return { affected: 0 };

    const tasks = items.map((item) => {
      let newPrice = item.price;
      switch (dto.operation) {
        case PartPriceBulkOperation.SET:
          newPrice = dto.value;
          break;
        case PartPriceBulkOperation.INCREASE_PERCENT:
          newPrice = Math.round(item.price * (1 + dto.value / 100));
          break;
        case PartPriceBulkOperation.INCREASE_AMOUNT:
          newPrice = item.price + dto.value;
          break;
      }
      return this.prisma.partPrice.update({
        where: { id: item.id },
        data: { price: newPrice },
      });
    });

    await this.prisma.$transaction(tasks);
    return { affected: items.length };
  }

  // برای استفاده بیرونی (فقط GET)
  async publicList(filter: {
    serviceId?: number;
    brandId?: number;
    modelId?: number;
    partId?: number;
  }) {
    return this.prisma.partPrice.findMany({
      where: {
        serviceId: filter.serviceId,
        brandId: filter.brandId,
        modelId: filter.modelId,
        partId: filter.partId,
      },
      include: { service: true, brand: true, model: true, part: true },
    });
  }
}
