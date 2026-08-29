import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../application/auth.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: jest.Mocked<Pick<AuthService, 'assertUserIsActive'>>;

  beforeEach(() => {
    authService = {
      assertUserIsActive: jest.fn(),
    };

    const config = {
      getOrThrow: jest.fn().mockReturnValue('test-secret-min-32-characters-long'),
    };

    strategy = new JwtStrategy(
      config as unknown as ConfigService,
      authService as unknown as AuthService,
    );
  });

  it('returns jwt payload for active user', async () => {
    authService.assertUserIsActive.mockResolvedValue({
      id: 'user-1',
      email: 'test@mail.com',
      name: 'Test',
      passwordHash: 'hash',
      isActive: true,
      kind: 'STAFF',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const payload = {
      sub: 'user-1',
      email: 'test@mail.com',
      name: 'Test',
      activeBusinessId: 'biz-1',
      permissions: ['business:read'],
      businesses: [],
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual(payload);
  });

  it('rejects inactive user', async () => {
    authService.assertUserIsActive.mockRejectedValue(
      new UnauthorizedException('Invalid or missing token'),
    );

    await expect(
      strategy.validate({ sub: 'user-1', email: 'test@mail.com', name: 'Test' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
