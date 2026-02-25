import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module';
import { OtpService } from './otp/otp.service';

@Module({
  imports: [
    UsersModule,
    NotificationsModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => {
        const secret = configService.get<string>('JWT_SECRET') || 'secret';
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '3600s';
        return {
          secret,
          signOptions: { expiresIn },
        } as JwtModuleOptions;
      },
    }),
  ],
  providers: [AuthService, JwtStrategy, OtpService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
