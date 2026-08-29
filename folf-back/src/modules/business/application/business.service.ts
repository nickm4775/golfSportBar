import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Business } from '../../../shared/infrastructure/database/entities/business.entity';
import { Organization } from '../../../shared/infrastructure/database/entities/organization.entity';
import { Role } from '../../../shared/infrastructure/database/entities/role.entity';
import { Product } from '../../../shared/infrastructure/database/entities/product.entity';
import { BusinessProduct } from '../../../shared/infrastructure/database/entities/business-product.entity';
import { BusinessMember } from '../../../shared/infrastructure/database/entities/business-member.entity';
import { User } from '../../../shared/infrastructure/database/entities/user.entity';
import { BusinessPrintSettings } from '../../../shared/infrastructure/database/entities/business-print-settings.entity';
import { BusinessPrinter } from '../../../shared/infrastructure/database/entities/business-printer.entity';
import { DomainException } from '../../../shared/domain/domain.exception';
import { PrepStation, PrintExecutionMode } from '../../../shared/domain/enums';
import {
  CreateBusinessDto,
  CreateMemberDto,
  UpdateBusinessDto,
  UpdateMemberDto,
} from '../presentation/dto/business.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(BusinessProduct)
    private readonly businessProductRepo: Repository<BusinessProduct>,
    @InjectRepository(BusinessMember)
    private readonly businessMemberRepo: Repository<BusinessMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(BusinessPrintSettings)
    private readonly printSettingsRepo: Repository<BusinessPrintSettings>,
    @InjectRepository(BusinessPrinter)
    private readonly printerRepo: Repository<BusinessPrinter>,
  ) {}

  async findAccessible(userId: string) {
    const memberships = await this.businessMemberRepo.find({
      where: { userId, isActive: true, business: { isActive: true } },
      relations: { business: true, role: true },
    });

    return memberships.map((m) => ({
      ...m.business,
      role: m.role.name,
    }));
  }

  async listPublicVenues() {
    const venues = await this.businessRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    return venues.map((venue) => this.toVenueView(venue));
  }

  async findPublicVenue(businessId: string) {
    const business = await this.businessRepo.findOne({
      where: { id: businessId, isActive: true },
    });
    if (!business) throw new NotFoundException('Business not found');
    return this.toVenueView(business);
  }

  toVenueView(business: Business) {
    return {
      id: business.id,
      slug: business.slug,
      name: business.name,
      address: business.address,
      district: business.district,
      postalCode: business.postalCode,
      city: business.city,
      state: business.state,
      country: business.country,
      lat: business.lat,
      lng: business.lng,
      timezone: business.timezone,
    };
  }

  async findOne(businessId: string) {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async create(userId: string, dto: CreateBusinessDto) {
    const organization = await this.organizationRepo.findOne({
      where: { ownerId: userId },
    });

    if (!organization) {
      throw new DomainException(
        'Organization not found for user',
        'ORGANIZATION_NOT_FOUND',
        404,
      );
    }

    const ownerRole = await this.roleRepo.findOneByOrFail({ name: 'OWNER' });

    const business = await this.businessRepo.save({
      organizationId: organization.id,
      slug: dto.slug,
      name: dto.name,
      address: dto.address,
      district: dto.district,
      postalCode: dto.postalCode,
      city: dto.city,
      state: dto.state,
      country: dto.country ?? 'Brasil',
      lat: dto.lat,
      lng: dto.lng,
      timezone: dto.timezone ?? 'America/Sao_Paulo',
    });

    await this.businessMemberRepo.save({
      businessId: business.id,
      userId,
      roleId: ownerRole.id,
    });

    const products = await this.productRepo.find({ where: { isActive: true } });
    if (products.length) {
      await this.businessProductRepo
        .createQueryBuilder()
        .insert()
        .into(BusinessProduct)
        .values(
          products.map((product) => ({
            businessId: business.id,
            productId: product.id,
            priceBrl: product.basePriceBrl,
            isAvailable: true,
          })),
        )
        .orIgnore()
        .execute();
    }

    await this.printSettingsRepo.save({
      businessId: business.id,
      printExecutionMode: PrintExecutionMode.AGENT,
    });
    await this.printerRepo.save([
      {
        businessId: business.id,
        station: PrepStation.KITCHEN,
        name: 'Cocina',
      },
      {
        businessId: business.id,
        station: PrepStation.BAR,
        name: 'Bar',
      },
    ]);

    return business;
  }

  async update(businessId: string, dto: UpdateBusinessDto) {
    await this.findOne(businessId);
    await this.businessRepo.update(businessId, dto);
    return this.findOne(businessId);
  }

  async listMembers(businessId: string) {
    return this.businessMemberRepo.find({
      where: { businessId },
      relations: { user: true, role: true },
      select: {
        id: true,
        businessId: true,
        userId: true,
        roleId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          email: true,
          name: true,
          isActive: true,
        },
        role: true,
      },
    });
  }

  async addMember(businessId: string, dto: CreateMemberDto) {
    const role = await this.roleRepo.findOne({ where: { id: dto.roleId } });
    if (!role) throw new NotFoundException('Role not found');

    let user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      if (!dto.password || !dto.name) {
        throw new DomainException(
          'Name and password required for new users',
          'USER_DATA_REQUIRED',
        );
      }
      user = await this.userRepo.save({
        email: dto.email,
        name: dto.name,
        passwordHash: await bcrypt.hash(dto.password, 10),
      });
    }

    await this.businessMemberRepo.upsert(
      { businessId, userId: user.id, roleId: dto.roleId, isActive: true },
      ['businessId', 'userId'],
    );

    return this.businessMemberRepo.findOneOrFail({
      where: { businessId, userId: user.id },
      relations: { user: true, role: true },
      select: {
        id: true,
        businessId: true,
        userId: true,
        roleId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user: { id: true, email: true, name: true },
        role: true,
      },
    });
  }

  async updateMember(businessId: string, userId: string, dto: UpdateMemberDto) {
    const member = await this.businessMemberRepo.findOne({
      where: { businessId, userId },
    });
    if (!member) throw new NotFoundException('Member not found');

    const { name, ...memberFields } = dto;
    if (name) {
      await this.userRepo.update(userId, { name });
    }
    if (Object.keys(memberFields).length > 0) {
      await this.businessMemberRepo.update({ businessId, userId }, memberFields);
    }

    return this.businessMemberRepo.findOneOrFail({
      where: { businessId, userId },
      relations: { user: true, role: true },
      select: {
        id: true,
        businessId: true,
        userId: true,
        roleId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user: { id: true, email: true, name: true },
        role: true,
      },
    });
  }
}
