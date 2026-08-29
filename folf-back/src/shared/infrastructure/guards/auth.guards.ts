import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthGuard } from '@nestjs/passport';
import { BusinessMember } from '../database/entities/business-member.entity';
import { PERMISSIONS_KEY } from '../decorators/auth.decorators';
import { AuthenticatedUser, JwtPayload } from '../../domain/auth.types';
import { UserKind } from '../../domain/enums';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = JwtPayload>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Invalid or missing token');
    }
    return user;
  }
}

@Injectable()
export class BusinessContextGuard implements CanActivate {
  constructor(
    @InjectRepository(BusinessMember)
    private readonly businessMemberRepo: Repository<BusinessMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: JwtPayload;
      params: { businessId?: string };
      headers: Record<string, string>;
    }>();

    const businessId =
      request.params.businessId ??
      request.headers['x-business-id'] ??
      request.user.activeBusinessId;

    if (request.user.kind === UserKind.CUSTOMER) {
      throw new ForbiddenException('Staff access required');
    }

    if (!businessId) {
      throw new ForbiddenException('Business context is required');
    }

    const membership = await this.businessMemberRepo.findOne({
      where: {
        businessId,
        userId: request.user.sub,
        isActive: true,
        business: { isActive: true },
      },
      relations: {
        role: {
          permissions: { permission: true },
        },
        user: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this business');
    }

    const authUser: AuthenticatedUser = {
      id: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      activeBusinessId: businessId,
      permissions: membership.role.permissions.map((rp) => rp.permission.key),
    };

    request.user = authUser as unknown as JwtPayload;
    return true;
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    const user = request.user;
    const hasAll = required.every((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    if (request.user.kind !== UserKind.CUSTOMER) {
      throw new ForbiddenException('Customer access required');
    }
    return true;
  }
}
