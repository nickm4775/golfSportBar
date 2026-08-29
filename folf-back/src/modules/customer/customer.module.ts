import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CustomerService } from './application/customer.service';
import {
  CustomerController,
  CustomerMeController,
} from './presentation/customer.controller';
import { CustomerAuthController } from './presentation/customer-auth.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CustomerAuthController, CustomerMeController, CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
