import { Module } from '@nestjs/common';
import { RbacService } from './application/rbac.service';
import { RbacController } from './presentation/rbac.controller';

@Module({
  controllers: [RbacController],
  providers: [RbacService],
})
export class RbacModule {}
