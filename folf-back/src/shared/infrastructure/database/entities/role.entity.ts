import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { BusinessMember } from './business-member.entity';
import { RoleScope } from '../../../domain/enums';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column()
  description!: string;

  @Column({
    type: 'enum',
    enum: RoleScope,
    enumName: 'RoleScope',
    default: RoleScope.BUSINESS,
  })
  scope!: RoleScope;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  permissions!: RolePermission[];

  @OneToMany(() => BusinessMember, (member) => member.role)
  members!: BusinessMember[];
}
