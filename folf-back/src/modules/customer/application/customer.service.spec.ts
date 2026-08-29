import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { CustomerService } from './customer.service';
import { Customer } from '../../../shared/infrastructure/database/entities/customer.entity';
import { User } from '../../../shared/infrastructure/database/entities/user.entity';
import { DomainException } from '../../../shared/domain/domain.exception';

describe('CustomerService', () => {
  let service: CustomerService;
  let customerRepo: jest.Mocked<Pick<Repository<Customer>, 'findOne' | 'save' | 'createQueryBuilder'>>;
  let userRepo: jest.Mocked<Pick<Repository<User>, 'findOne' | 'save'>>;

  beforeEach(() => {
    customerRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    userRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };
    const jwtService = { signAsync: jest.fn().mockResolvedValue('token') };
    const config = {
      get: jest.fn((_key: string, fallback?: string) => fallback),
      getOrThrow: jest.fn().mockReturnValue('test-secret-min-32-characters-long'),
    };
    const cache = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn(),
      del: jest.fn(),
    };

    service = new CustomerService(
      customerRepo as unknown as Repository<Customer>,
      userRepo as unknown as Repository<User>,
      jwtService as unknown as JwtService,
      config as unknown as ConfigService,
      cache as unknown as import('../../../shared/infrastructure/redis/redis-cache.service').RedisCacheService,
    );
  });

  it('rejects customers under 18', async () => {
    await expect(
      service.createFromStaff({
        fullName: 'Menor',
        cpf: '52998224725',
        email: 'menor@mail.com',
        phone: '47999110011',
        birthDate: '2012-01-01',
        lgpdAccepted: true,
      }),
    ).rejects.toMatchObject({ code: 'UNDERAGE' } as Partial<DomainException>);
  });

  it('rejects invalid CPF', async () => {
    await expect(
      service.createFromStaff({
        fullName: 'Ana Souza',
        cpf: '11111111111',
        email: 'ana@mail.com',
        phone: '47999110011',
        birthDate: '1994-03-12',
        lgpdAccepted: true,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CPF' } as Partial<DomainException>);
  });

  it('creates an adult customer with valid CPF', async () => {
    customerRepo.save.mockResolvedValue({
      id: 'cust-1',
      fullName: 'Ana Souza',
      cpf: '52998224725',
      email: 'ana@mail.com',
      phone: '5547999110011',
      birthDate: '1994-03-12',
      postalCode: null,
      street: null,
      streetNumber: null,
      complement: null,
      district: null,
      city: null,
      state: null,
      lgpdAcceptedAt: new Date(),
      userId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Customer);

    const created = await service.createFromStaff({
      fullName: 'Ana Souza',
      cpf: '529.982.247-25',
      email: 'ana@mail.com',
      phone: '(47) 99911-0011',
      birthDate: '1994-03-12',
      lgpdAccepted: true,
    });

    expect(created.fullName).toBe('Ana Souza');
    expect(customerRepo.save).toHaveBeenCalled();
  });

  it('conflicts when CPF already exists', async () => {
    customerRepo.findOne.mockResolvedValue({ id: 'other' } as Customer);

    await expect(
      service.createFromStaff({
        fullName: 'Ana Souza',
        cpf: '52998224725',
        email: 'ana@mail.com',
        phone: '47999110011',
        birthDate: '1994-03-12',
        lgpdAccepted: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
