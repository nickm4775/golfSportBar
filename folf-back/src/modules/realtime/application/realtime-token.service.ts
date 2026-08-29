import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedUser, JwtPayload } from '../../../shared/domain/auth.types';

const TOKEN_EXPIRES_IN = '10m';

@Injectable()
export class RealtimeTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  issueConnectionToken(user: AuthenticatedUser) {
    if (!user.activeBusinessId) {
      throw new ForbiddenException('Business context is required');
    }
    return this.signToken(user.id, `business:${user.activeBusinessId}`);
  }

  issueCustomerConnectionToken(user: JwtPayload) {
    if (!user.customerId) {
      throw new ForbiddenException('Customer profile is required');
    }
    return this.signToken(user.sub, `customer:${user.customerId}`);
  }

  private signToken(sub: string, channel: string) {
    const secret = this.config.get<string>('CENTRIFUGO_TOKEN_HMAC_SECRET')?.trim();
    if (!secret) {
      throw new ForbiddenException('Realtime is not configured');
    }

    const token = this.jwt.sign(
      {
        sub,
        channels: [channel],
      },
      { secret, expiresIn: TOKEN_EXPIRES_IN },
    );

    return {
      token,
      expiresIn: 600,
      channel,
    };
  }
}
