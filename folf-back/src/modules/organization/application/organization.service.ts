import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../../shared/infrastructure/database/entities/organization.entity';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
  ) {}

  async findMine(userId: string) {
    const organizations = await this.organizationRepo.find({
      where: { ownerId: userId },
      relations: { businesses: true },
    });

    return organizations.map((org) => ({
      ...org,
      businesses: org.businesses
        .filter((b) => b.isActive)
        .map(({ id, slug, name, city, state }) => ({ id, slug, name, city, state })),
    }));
  }
}
