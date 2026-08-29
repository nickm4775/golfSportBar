import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from '../../../shared/infrastructure/database/entities/user.entity';
import { BusinessMember } from '../../../shared/infrastructure/database/entities/business-member.entity';
import { RedisCacheService } from '../../../shared/infrastructure/redis/redis-cache.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Pick<Repository<User>, 'findOne' | 'save' | 'findOneOrFail'>>;
  let businessMemberRepo: jest.Mocked<Pick<Repository<BusinessMember>, 'find'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync' | 'verifyAsync'>>;
  let config: { get: jest.Mock; getOrThrow: jest.Mock };
  let cache: jest.Mocked<Pick<RedisCacheService, 'getJson' | 'setJson' | 'del'>>;

  const mockUser = {
    id: 'user-1',
    email: 'test@mail.com',
    name: 'Test User',
    passwordHash: 'hashed',
    isActive: true,
    kind: 'STAFF',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      findOneOrFail: jest.fn(),
    };

    businessMemberRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('token'),
      verifyAsync: jest.fn(),
    };

    config = {
      get: jest.fn((key: string, defaultValue?: string) => defaultValue),
      getOrThrow: jest.fn((key: string) => {
        if (key.includes('SECRET')) return 'test-secret-min-32-characters-long';
        return '15m';
      }),
    };

    cache = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    service = new AuthService(
      userRepo as unknown as Repository<User>,
      businessMemberRepo as unknown as Repository<BusinessMember>,
      jwtService as unknown as JwtService,
      config as unknown as ConfigService,
      cache as unknown as RedisCacheService,
    );
  });

  describe('register', () => {
    it('creates user and returns access and refresh tokens', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await service.register('test@mail.com', 'Secret123!', 'Test User');

      expect(userRepo.save).toHaveBeenCalled();
      expect(result.accessToken).toBe('token');
      expect(result.refreshToken).toHaveLength(64);
      expect(result.expiresIn).toBe(900);
      expect(cache.setJson).toHaveBeenCalled();
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-1',
          email: 'test@mail.com',
          name: 'Test User',
          kind: 'STAFF',
          businesses: [],
          permissions: [],
        }),
        expect.any(Object),
      );
    });

    it('throws ConflictException when email exists', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register('test@mail.com', 'Secret123!', 'Test User'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns access and refresh tokens for valid credentials', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('test@mail.com', 'Secret123!');

      expect(result.accessToken).toBe('token');
      expect(result.refreshToken).toHaveLength(64);
    });

    it('throws for invalid password', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('test@mail.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('rotates refresh token for a valid staff session', async () => {
      cache.getJson.mockResolvedValueOnce({
        userId: 'user-1',
        kind: 'STAFF',
        activeBusinessId: undefined,
      });
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.refresh('a'.repeat(32));

      expect(cache.del).toHaveBeenCalled();
      expect(result.accessToken).toBe('token');
      expect(result.refreshToken).toHaveLength(64);
    });

    it('throws when refresh session is missing', async () => {
      cache.getJson.mockResolvedValueOnce(null);

      await expect(service.refresh('a'.repeat(32))).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('assertUserIsActive', () => {
    it('returns user when active', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      const user = await service.assertUserIsActive('user-1');

      expect(user.id).toBe('user-1');
    });

    it('throws when user is inactive', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.assertUserIsActive('user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.assertUserIsActive('user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
