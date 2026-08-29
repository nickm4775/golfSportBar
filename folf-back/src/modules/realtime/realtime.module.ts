import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CentrifugoPublisher } from './application/centrifugo.publisher';
import { BusinessRealtimeService } from './application/business-realtime.service';
import { RealtimeTokenService } from './application/realtime-token.service';
import { RealtimeController } from './presentation/realtime.controller';

@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [RealtimeController],
  providers: [CentrifugoPublisher, BusinessRealtimeService, RealtimeTokenService],
  exports: [BusinessRealtimeService, CentrifugoPublisher, RealtimeTokenService],
})
export class RealtimeModule {}
