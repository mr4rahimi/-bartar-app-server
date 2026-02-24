import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp/otp.service';
import { OtpPurpose } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
   constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private otpService: OtpService,
    private notifications: NotificationsService,
  ) {}

  async register(payload: { name?: string; phone: string; email?: string; password: string }) {
    const existing = await this.usersService.findByPhone(payload.phone);
    if (existing) throw new Error('User already exists with this phone');

    const hashed = await bcrypt.hash(payload.password, 10);
    const user = await this.usersService.create({ ...payload, password: hashed, role: 'user' });
    const token = this.signToken(user.id, user.role);
    return { user, token };
  }

  async validateUser(phone: string, pass: string) {
    const user = await this.usersService.findByPhone(phone);
    if (!user) return null;
    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) return null;
    return user;
  }

  signToken(userId: number, role: string) {
    const payload = { sub: userId, role };
    return this.jwtService.sign(payload);
  }

  async login(phone: string, password: string) {
    const user = await this.validateUser(phone, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const token = this.signToken(user.id, user.role);
    return { user, token };
  }

  // --- جدید: ثبت‌نام OTP مرحله 1 ---
   async registerRequestOtp(phone: string) {
    // اگر کاربر از قبل وجود دارد، ثبت‌نام OTP نده
    const existing = await this.usersService.findByPhone(phone);
    if (existing) throw new BadRequestException('این شماره قبلاً ثبت‌نام کرده است');

    const rec = await this.otpService.requestOtp({ phone, purpose: OtpPurpose.REGISTER });

    // ارسال پیامک پترن ورود/ثبت‌نام (همان patternLogin شما)
    await this.notifications.sendOtpSmsToPhone(rec.phone, rec.code);

    // برای امنیت: کد را برنگردون
    return { ok: true };
  }

  // --- جدید: ثبت‌نام OTP مرحله 2 ---
   async registerVerifyOtp(input: { phone: string; code: string; name?: string; password?: string }) {
    await this.otpService.verifyOtp({ phone: input.phone, code: input.code, purpose: OtpPurpose.REGISTER });

    // اینجا ثبت نهایی کاربر انجام می‌شود (طبق نیازت)
    if (!input.password || input.password.length < 4) {
      throw new BadRequestException('رمز عبور نامعتبر است');
    }

    const existing = await this.usersService.findByPhone(input.phone);
    if (existing) throw new BadRequestException('این شماره قبلاً ثبت‌نام کرده است');

    const hashed = await bcrypt.hash(input.password, 10);
    const user = await this.usersService.create({
      phone: input.phone,
      name: input.name,
      password: hashed,
      role: 'user',
    });

    const token = this.signToken(user.id, user.role);
    return { user, token };
  }

  // --- جدید: ورود با OTP مرحله 1 ---
    async loginRequestOtp(phone: string) {
    // برای OTP login: فقط اگر کاربر وجود دارد
    const user = await this.usersService.findByPhone(phone);
    if (!user) throw new BadRequestException('کاربری با این شماره یافت نشد');

    const rec = await this.otpService.requestOtp({ phone, purpose: OtpPurpose.LOGIN });

    const smsRes = await this.notifications.sendOtpSmsToPhone(rec.phone, rec.code);
     return { ok: true, smsRes };

   // await this.notifications.sendOtpSmsToPhone(rec.phone, rec.code);

   // return { ok: true };
  }

  async loginVerifyOtp(input: { phone: string; code: string }) {
    await this.otpService.verifyOtp({ phone: input.phone, code: input.code, purpose: OtpPurpose.LOGIN });

    const user = await this.usersService.findByPhone(input.phone);
    if (!user) throw new BadRequestException('کاربری با این شماره یافت نشد');

    const token = this.signToken(user.id, user.role);
    return { user, token };
  }

}