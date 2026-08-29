import { Module, forwardRef } from '@nestjs/common';
import { OrderService } from './application/order.service';
import { OrderController } from './presentation/order.controller';
import { PrintModule } from '../print/print.module';

@Module({
  imports: [forwardRef(() => PrintModule)],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
