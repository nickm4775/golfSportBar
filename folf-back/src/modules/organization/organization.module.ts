import { Module } from '@nestjs/common';
import { OrganizationService } from './application/organization.service';
import { OrganizationController } from './presentation/organization.controller';

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService],
})
export class OrganizationModule {}
