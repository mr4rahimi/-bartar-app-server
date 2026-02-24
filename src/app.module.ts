import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { AdminServicesModule } from './admin/services/services.module';
import { AdminBrandsModule } from './admin/brands/brands.module';
import { AdminModelsModule } from './admin/models/models.module';
import { CatalogController } from './public/catalog.controller';
import { AdminProblemsModule } from './admin/problems/problems.module';
import { AdminUsersModule } from './admin/users/users.module';
import { AdminOrdersModule } from './admin/orders/orders.module';
import { AdminTechniciansModule } from './admin/technicians/technicians.module';
import { AdminPartsModule } from './admin/parts/parts.module';
import { AdminPartPricesModule } from './admin/part-prices/part-prices.module';
import { AdminBasePricingModule } from './admin/base-pricing/base-pricing.module';
import { AdminPartLaborsModule } from './admin/part-labors/part-labors.module';
import { DevicesModule } from './devices/devices.module';
import { AdminCallLogsModule } from './admin/call-logs/call-logs.module';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    OrdersModule,
    AdminServicesModule,
    AdminBrandsModule,
    AdminModelsModule,
    AdminProblemsModule,
    AdminUsersModule,
    AdminOrdersModule,
    AdminTechniciansModule,
    AdminPartsModule,
    AdminPartsModule,
    AdminPartPricesModule,
    AdminBasePricingModule,
    AdminPartLaborsModule,
    DevicesModule,
    AdminCallLogsModule,
  ],
  controllers: [CatalogController],
})
export class AppModule {}