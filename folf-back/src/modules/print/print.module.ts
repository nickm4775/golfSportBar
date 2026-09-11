import { Module } from '@nestjs/common';
import { PrintService } from './application/print.service';
import { PrintAgentService } from './application/print-agent.service';
import { PrintController } from './presentation/print.controller';
import { PrintAgentController } from './presentation/print-agent.controller';
import { PrintAgentAuthGuard } from './infrastructure/print-agent.guard';

@Module({
  controllers: [PrintController, PrintAgentController],
  providers: [PrintService, PrintAgentService, PrintAgentAuthGuard],
  exports: [PrintService, PrintAgentService],
})
export class PrintModule {}
