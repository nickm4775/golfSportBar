import { Module } from '@nestjs/common';
import { OrderModule } from '../order/order.module';
import { PaymentService } from './application/payment.service';
import { PaymentController } from './presentation/payment.controller';

@Module({
  imports: [OrderModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
