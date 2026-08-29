import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { User } from '../../../shared/infrastructure/database/entities/user.entity';
import { BusinessMember } from '../../../shared/infrastructure/database/entities/business-member.entity';
import { JwtPayload } from '../../../shared/domain/auth.types';
import { UserKind } from '../../../shared/domain/enums';
import { parseExpiresInSeconds } from '../../../shared/domain/jwt-expires';
import { RedisCacheService } from '../../../shared/infrastructure/redis/redis-cache.service';

type StaffTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(BusinessMember)
    private readonly businessMemberRepo: Repository<BusinessMember>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly cache: RedisCacheService,
  ) {}

  async register(email: string, password: string, name: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.userRepo.save({
      email,
      name,
      passwordHash: await bcrypt.hash(password, 10),
      kind: UserKind.STAFF,
    });

    return this.issueStaffTokens(user, []);
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user?.isActive || user.kind === UserKind.CUSTOMER) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const memberships = await this.getActiveMemberships(user.id);
    return this.issueStaffTokens(user, memberships);
  }

  async refresh(refreshToken: string) {
    const session = await this.cache.getJson<{
      userId: string;
      kind: string;
      activeBusinessId?: string;
    }>(this.refreshKey(refreshToken));

    if (!session || session.kind !== UserKind.STAFF) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.userRepo.findOne({ where: { id: session.userId } });
    if (!user?.isActive || user.kind === UserKind.CUSTOMER) {
      await this.cache.del(this.refreshKey(refreshToken));
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.cache.del(this.refreshKey(refreshToken));
    const memberships = await this.getActiveMemberships(user.id);
    return this.issueStaffTokens(user, memberships, session.activeBusinessId);
  }

  async getMe(userId: string, activeBusinessId?: string) {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    const memberships = await this.getActiveMemberships(userId);

    const activeMembership = activeBusinessId
      ? memberships.find((m) => m.businessId === activeBusinessId)
      : memberships[0];

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      activeBusinessId: activeMembership?.businessId,
      permissions:
        activeMembership?.role.permissions.map((p) => p.permission.key) ?? [],
      businesses: memberships.map((m) => ({
        id: m.business.id,
        slug: m.business.slug,
        name: m.business.name,
        role: m.role.name,
      })),
    };
  }

  async assertUserIsActive(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.isActive) {
      throw new UnauthorizedException('Invalid or missing token');
    }
    return user;
  }

  private async getActiveMemberships(userId: string) {
    return this.businessMemberRepo.find({
      where: { userId, isActive: true, business: { isActive: true } },
      relations: {
        business: true,
        role: {
          permissions: { permission: true },
        },
      },
    });
  }

  private async issueStaffTokens(
    user: { id: string; email: string; name: string },
    memberships: Awaited<ReturnType<AuthService['getActiveMemberships']>>,
    activeBusinessId?: string,
  ): Promise<StaffTokens> {
    const resolvedBusinessId =
      activeBusinessId &&
      memberships.some((m) => m.businessId === activeBusinessId)
        ? activeBusinessId
        : memberships[0]?.businessId;

    const activeMembership = resolvedBusinessId
      ? memberships.find((m) => m.businessId === resolvedBusinessId)
      : undefined;

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      kind: UserKind.STAFF,
      activeBusinessId: resolvedBusinessId,
      permissions:
        activeMembership?.role.permissions.map((p) => p.permission.key) ?? [],
      businesses: memberships.map((m) => ({
        id: m.business.id,
        slug: m.business.slug,
        name: m.business.name,
        role: m.role.name,
      })),
    };

    const accessExpires = this.config.get('JWT_ACCESS_EXPIRES_IN', '15m') ?? '15m';
    const refreshExpires = this.config.get('JWT_REFRESH_EXPIRES_IN', '7d') ?? '7d';

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpires as `${number}m` | `${number}d` | `${number}s` | `${number}h`,
    });

    const refreshToken = randomBytes(32).toString('hex');
    const refreshTtl = parseExpiresInSeconds(refreshExpires, 604800);

    const previous = await this.cache.getJson<{ token: string }>(this.refreshUserKey(user.id));
    if (previous?.token) {
      await this.cache.del(this.refreshKey(previous.token));
    }

    await this.cache.setJson(
      this.refreshKey(refreshToken),
      { userId: user.id, kind: UserKind.STAFF, activeBusinessId: resolvedBusinessId },
      refreshTtl,
    );
    await this.cache.setJson(this.refreshUserKey(user.id), { token: refreshToken }, refreshTtl);

    return {
      accessToken,
      refreshToken,
      expiresIn: parseExpiresInSeconds(accessExpires),
    };
  }

  private refreshKey(token: string) {
    return `auth:staff-refresh:${token}`;
  }

  private refreshUserKey(userId: string) {
    return `auth:staff-refresh-user:${userId}`;
  }
}
