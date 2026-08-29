import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Customer } from '../../../shared/infrastructure/database/entities/customer.entity';
import { User } from '../../../shared/infrastructure/database/entities/user.entity';
import { UserKind } from '../../../shared/domain/enums';
import { DomainException } from '../../../shared/domain/domain.exception';
import { JwtPayload } from '../../../shared/domain/auth.types';
import { parseExpiresInSeconds } from '../../../shared/domain/jwt-expires';
import { RedisCacheService } from '../../../shared/infrastructure/redis/redis-cache.service';
import {
  assertAdult,
  isValidCpf,
  isValidMobileBr,
  normalizePhoneBr,
  onlyDigits,
  parseIsoDate,
} from '../../../shared/domain/brazil';
import {
  CreateCustomerDto,
  RegisterCustomerDto,
  UpdateCustomerDto,
} from '../presentation/dto/customer.dto';
import { toCustomerView } from './customer.mapper';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly cache: RedisCacheService,
  ) {}

  async search(query?: string) {
    const q = query?.trim();
    const qb = this.customerRepo
      .createQueryBuilder('customer')
      .orderBy('customer.createdAt', 'DESC')
      .take(50);

    if (q) {
      const digits = onlyDigits(q);
      qb.andWhere(
        '(customer.fullName ILIKE :q OR customer.email ILIKE :q OR customer.cpf LIKE :digits OR customer.phone LIKE :digits)',
        { q: `%${q}%`, digits: `%${digits || q}%` },
      );
    }

    const rows = await qb.getMany();
    return rows.map((customer) => toCustomerView(customer, { maskCpf: true }));
  }

  async findOne(customerId: string, options?: { maskCpf?: boolean }) {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');
    return toCustomerView(customer, { maskCpf: options?.maskCpf ?? false });
  }

  async findEntity(customerId: string) {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async createFromStaff(dto: CreateCustomerDto) {
    const payload = this.normalizeCadastro(dto);
    await this.assertUnique(payload);
    const customer = await this.customerRepo.save({
      ...payload,
      lgpdAcceptedAt: new Date(),
    });
    return toCustomerView(customer, { maskCpf: false });
  }

  async update(customerId: string, dto: UpdateCustomerDto) {
    const customer = await this.findEntity(customerId);
    const next = {
      fullName: dto.fullName?.trim() ?? customer.fullName,
      cpf: dto.cpf ? onlyDigits(dto.cpf) : customer.cpf,
      email: dto.email?.trim().toLowerCase() ?? customer.email,
      phone: dto.phone ? normalizePhoneBr(dto.phone) : customer.phone,
      birthDate: dto.birthDate ?? customer.birthDate,
      postalCode: dto.postalCode === undefined ? customer.postalCode : dto.postalCode,
      street: dto.street === undefined ? customer.street : dto.street,
      streetNumber: dto.streetNumber === undefined ? customer.streetNumber : dto.streetNumber,
      complement: dto.complement === undefined ? customer.complement : dto.complement,
      district: dto.district === undefined ? customer.district : dto.district,
      city: dto.city === undefined ? customer.city : dto.city,
      state: dto.state === undefined ? customer.state : dto.state?.toUpperCase(),
      isActive: dto.isActive ?? customer.isActive,
    };

    this.assertCadastro(next.cpf, next.phone, next.birthDate);
    await this.assertUnique(next, customerId);
    await this.customerRepo.update(customerId, next);
    return this.findOne(customerId, { maskCpf: false });
  }

  async getMe(userId: string) {
    const customer = await this.customerRepo.findOne({ where: { userId } });
    if (!customer) throw new NotFoundException('Customer not found');
    return toCustomerView(customer, { maskCpf: false });
  }

  async register(dto: RegisterCustomerDto) {
    const payload = this.normalizeCadastro(dto);
    const existing = await this.customerRepo.findOne({ where: { cpf: payload.cpf } });

    if (existing?.userId) {
      throw new ConflictException('CPF already registered');
    }

    const emailUser = await this.userRepo.findOne({ where: { email: payload.email } });
    if (emailUser && emailUser.id !== existing?.userId) {
      throw new ConflictException('Email already registered');
    }

    if (existing && !existing.userId) {
      await this.assertUnique({ ...payload, cpf: existing.cpf }, existing.id);
      const user = await this.userRepo.save({
        email: payload.email,
        name: payload.fullName,
        passwordHash: await bcrypt.hash(dto.password, 10),
        kind: UserKind.CUSTOMER,
      });
      await this.customerRepo.update(existing.id, {
        ...payload,
        userId: user.id,
      });
      const linked = await this.findEntity(existing.id);
      return this.issueCustomerToken(user, linked.id);
    }

    await this.assertUnique(payload);
    const user = await this.userRepo.save({
      email: payload.email,
      name: payload.fullName,
      passwordHash: await bcrypt.hash(dto.password, 10),
      kind: UserKind.CUSTOMER,
    });
    const customer = await this.customerRepo.save({
      ...payload,
      userId: user.id,
      lgpdAcceptedAt: new Date(),
    });
    return this.issueCustomerToken(user, customer.id);
  }

  async login(identifier: string, password: string) {
    const trimmed = identifier.trim();
    const digits = onlyDigits(trimmed);
    let user: User | null = null;
    let customer: Customer | null = null;

    if (trimmed.includes('@')) {
      user = await this.userRepo.findOne({
        where: { email: trimmed.toLowerCase(), kind: UserKind.CUSTOMER },
      });
      if (user) {
        customer = await this.customerRepo.findOne({ where: { userId: user.id } });
      }
    } else if (digits.length === 11) {
      customer = await this.customerRepo.findOne({ where: { cpf: digits } });
      if (customer?.userId) {
        user = await this.userRepo.findOne({ where: { id: customer.userId } });
      }
    }

    if (!user?.isActive || user.kind !== UserKind.CUSTOMER || !customer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueCustomerToken(user, customer.id);
  }

  async refresh(refreshToken: string) {
    const session = await this.cache.getJson<{
      userId: string;
      customerId: string;
      kind: string;
    }>(this.refreshKey(refreshToken));

    if (!session || session.kind !== UserKind.CUSTOMER) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.userRepo.findOne({ where: { id: session.userId } });
    const customer = await this.customerRepo.findOne({
      where: { id: session.customerId },
    });

    if (!user?.isActive || user.kind !== UserKind.CUSTOMER || !customer?.isActive) {
      await this.cache.del(this.refreshKey(refreshToken));
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.cache.del(this.refreshKey(refreshToken));
    return this.issueCustomerToken(user, customer.id);
  }

  private normalizeCadastro(dto: CreateCustomerDto) {
    const cpf = onlyDigits(dto.cpf);
    const phone = normalizePhoneBr(dto.phone);
    const birthDate = dto.birthDate.slice(0, 10);
    this.assertCadastro(cpf, phone, birthDate);

    return {
      fullName: dto.fullName.trim(),
      cpf,
      email: dto.email.trim().toLowerCase(),
      phone,
      birthDate,
      postalCode: dto.postalCode?.trim() || null,
      street: dto.street?.trim() || null,
      streetNumber: dto.streetNumber?.trim() || null,
      complement: dto.complement?.trim() || null,
      district: dto.district?.trim() || null,
      city: dto.city?.trim() || null,
      state: dto.state?.trim().toUpperCase() || null,
    };
  }

  private assertCadastro(cpf: string, phone: string, birthDate: string) {
    if (!isValidCpf(cpf)) {
      throw new DomainException('Invalid CPF', 'INVALID_CPF');
    }
    if (!isValidMobileBr(phone)) {
      throw new DomainException('Invalid Brazilian mobile phone', 'INVALID_PHONE');
    }
    const parsed = parseIsoDate(birthDate);
    if (!assertAdult(parsed)) {
      throw new DomainException('Customer must be at least 18 years old', 'UNDERAGE');
    }
  }

  private async assertUnique(
    payload: { cpf: string; email: string; phone: string },
    excludeId?: string,
  ) {
    const exclude = excludeId ? { id: Not(excludeId) } : {};
    const [cpfHit, emailHit, phoneHit] = await Promise.all([
      this.customerRepo.findOne({ where: { cpf: payload.cpf, ...exclude } }),
      this.customerRepo.findOne({ where: { email: payload.email, ...exclude } }),
      this.customerRepo.findOne({ where: { phone: payload.phone, ...exclude } }),
    ]);
    if (cpfHit) throw new ConflictException('CPF already registered');
    if (emailHit) throw new ConflictException('Email already registered');
    if (phoneHit) throw new ConflictException('Phone already registered');
  }

  private async issueCustomerToken(user: User, customerId: string) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      kind: UserKind.CUSTOMER,
      customerId,
      permissions: [],
      businesses: [],
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
      { userId: user.id, customerId, kind: UserKind.CUSTOMER },
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
    return `auth:refresh:${token}`;
  }

  private refreshUserKey(userId: string) {
    return `auth:refresh-user:${userId}`;
  }
}
