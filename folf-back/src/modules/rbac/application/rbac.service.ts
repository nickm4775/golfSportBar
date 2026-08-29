import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../shared/infrastructure/database/entities/role.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  findRoles() {
    return this.roleRepo.find({
      relations: { permissions: { permission: true } },
      order: { name: 'ASC' },
    });
  }
}
