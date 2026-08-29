import { Module } from '@nestjs/common';
import { PrintService } from './application/print.service';
import { PrintController } from './presentation/print.controller';

@Module({
  controllers: [PrintController],
  providers: [PrintService],
  exports: [PrintService],
})
export class PrintModule {}
