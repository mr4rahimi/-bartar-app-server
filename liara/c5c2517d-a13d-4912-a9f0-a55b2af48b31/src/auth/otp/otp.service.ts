import { BadRequestException, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpPurpose } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

function nowPlusSeconds(sec: number) {
  return new Date(Date.now() + sec * 1000);
}

@Injectable()
export class OtpService {
  constructor(private prisma: PrismaService) {}

  private normalizeIranPhone(phone: string) {
    // شما در اپ 09... می‌فرستی
    // ما همون رو ذخیره می‌کنیم (یکدست)
    const p = phone.trim();
    if (!/^09\d{9}$/.test(p)) throw new BadRequestException('شماره موبایل نامعتبر است');
    return p;
  }

  private genCode(len: number) {
    const min = Math.pow(10, len - 1);
    const max = Math.pow(10, len) - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  }

  async requestOtp(input: { phone: string; purpose: OtpPurpose }) {
    const phone = this.normalizeIranPhone(input.phone);
    const ttl = Number(process.env.OTP_TTL_SECONDS || '180');
    const resend = Number(process.env.OTP_RESEND_SECONDS || '60');
    const length = Number(process.env.OTP_LENGTH || '4');

    // محدودیت ارسال مجدد
    const last = await this.prisma.otpCode.findFirst({
      where: { phone, purpose: input.purpose },
      orderBy: { createdAt: 'desc' },
    });

    if (last && (Date.now() - last.createdAt.getTime()) / 1000 < resend) {
      throw new HttpException('لطفاً کمی بعد دوباره تلاش کنید', HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = this.genCode(length);
    const codeHash = await bcrypt.hash(code, 10);

    const rec = await this.prisma.otpCode.create({
      data: {
        phone,
        purpose: input.purpose,
        codeHash,
        expiresAt: nowPlusSeconds(ttl),
      },
    });

    return { id: rec.id, phone, code }; // code را فقط برای ارسال SMS لازم داریم
  }

  async verifyOtp(input: { phone: string; purpose: OtpPurpose; code: string }) {
    const phone = this.normalizeIranPhone(input.phone);
    const code = input.code.trim();

    const latest = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        purpose: input.purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) throw new BadRequestException('کد نامعتبر یا منقضی شده است');

    if (latest.attempts >= 5) {
      throw new BadRequestException('تعداد تلاش بیش از حد مجاز است');
    }

    const ok = await bcrypt.compare(code, latest.codeHash);

    await this.prisma.otpCode.update({
      where: { id: latest.id },
      data: { attempts: { increment: 1 } },
    });

    if (!ok) throw new BadRequestException('کد نامعتبر است');

    await this.prisma.otpCode.update({
      where: { id: latest.id },
      data: { consumedAt: new Date() },
    });

    return { ok: true };
  }
}
