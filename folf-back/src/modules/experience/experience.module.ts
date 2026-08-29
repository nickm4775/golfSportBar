import { Module } from '@nestjs/common';
import { BusinessModule } from '../business/business.module';
import { CatalogModule } from '../catalog/catalog.module';
import { GsproModule } from '../gspro/gspro.module';
import { OrderModule } from '../order/order.module';
import { PublicVenueService, QrResolveService } from './application/experience.service';
import { PublicVenueController } from './presentation/public-venue.controller';
import { PublicQrController } from './presentation/public-qr.controller';
import { CustomerExperienceController } from './presentation/customer-experience.controller';

@Module({
  imports: [BusinessModule, CatalogModule, GsproModule, OrderModule],
  controllers: [PublicVenueController, PublicQrController, CustomerExperienceController],
  providers: [PublicVenueService, QrResolveService],
})
export class ExperienceModule {}
