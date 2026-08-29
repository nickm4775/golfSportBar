import { Module } from '@nestjs/common';
import { GsproService } from './application/gspro.service';
import { GsproController } from './presentation/gspro.controller';

@Module({
  controllers: [GsproController],
  providers: [GsproService],
  exports: [GsproService],
})
export class GsproModule {}
