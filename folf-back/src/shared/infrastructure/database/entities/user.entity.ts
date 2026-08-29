import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { BusinessMember } from './business-member.entity';
import { Order } from './order.entity';
import { GsproSession } from './gspro-session.entity';
import { Customer } from './customer.entity';
import { UserKind } from '../../../domain/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: UserKind,
    enumName: 'UserKind',
    default: UserKind.STAFF,
  })
  kind!: UserKind;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Organization, (organization) => organization.owner)
  ownedOrganizations!: Organization[];

  @OneToMany(() => BusinessMember, (member) => member.user)
  memberships!: BusinessMember[];

  @OneToMany(() => Order, (order) => order.createdBy)
  createdOrders!: Order[];

  @OneToMany(() => Order, (order) => order.assignedTo)
  assignedOrders!: Order[];

  @OneToMany(() => GsproSession, (session) => session.openedBy)
  openedSessions!: GsproSession[];

  @OneToMany(() => GsproSession, (session) => session.closedBy)
  closedSessions!: GsproSession[];

  @OneToOne(() => Customer, (customer) => customer.user)
  customer!: Customer | null;
}
