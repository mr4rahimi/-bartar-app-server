import { Body, Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyRegisterOtpDto } from './dto/verify-register-otp.dto';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.phone, body.password);
  }

  // ---- REGISTER OTP ----
  @Post('register/request-otp')
  async registerRequestOtp(@Body() body: RequestOtpDto) {
    return this.authService.registerRequestOtp(body.phone);
  }

  @Post('register/verify-otp')
  async registerVerifyOtp(@Body() body: VerifyRegisterOtpDto) {
    return this.authService.registerVerifyOtp(body);
  }

  // ---- LOGIN OTP ----
  @Post('login/request-otp')
  async loginRequestOtp(@Body() body: RequestOtpDto) {
    return this.authService.loginRequestOtp(body.phone);
  }

  @Post('login/verify-otp')
  async loginVerifyOtp(@Body() body: VerifyLoginOtpDto) {
    return this.authService.loginVerifyOtp(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: any) {
    const userId = req.user.userId ?? req.user.sub ?? req.user?.sub;
    if (!userId) return { user: req.user };
    const user = await this.usersService.findById(+userId);
    if (!user) return { user: req.user };

    const { password, ...safe } = user as any;
    return safe;
  }
}