import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { RedisModule } from './shared/infrastructure/redis/redis.module';
import { GlobalExceptionFilter } from './shared/infrastructure/filters/global-exception.filter';
import { AuthModule } from './modules/auth/auth.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { CustomerModule } from './modules/customer/customer.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { BusinessModule } from './modules/business/business.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrderModule } from './modules/order/order.module';
import { GsproModule } from './modules/gspro/gspro.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ExperienceModule } from './modules/experience/experience.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PrintModule } from './modules/print/print.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RedisModule,
    RealtimeModule,
    AuthModule,
    CustomerModule,
    OrganizationModule,
    BusinessModule,
    RbacModule,
    CatalogModule,
    OrderModule,
    PrintModule,
    GsproModule,
    AnalyticsModule,
    ExperienceModule,
    PaymentModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
