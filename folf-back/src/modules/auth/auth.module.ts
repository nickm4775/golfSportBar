import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './application/auth.service';
import { AuthController } from './presentation/auth.controller';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import {
  BusinessContextGuard,
  CustomerAuthGuard,
  JwtAuthGuard,
  PermissionsGuard,
} from '../../shared/infrastructure/guards/auth.guards';

@Global()
@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    BusinessContextGuard,
    CustomerAuthGuard,
    PermissionsGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    BusinessContextGuard,
    CustomerAuthGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}
