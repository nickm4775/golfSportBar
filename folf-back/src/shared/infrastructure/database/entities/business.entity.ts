import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { BusinessMember } from './business-member.entity';
import { BusinessProduct } from './business-product.entity';
import { Order } from './order.entity';
import { GsproBay } from './gspro-bay.entity';
import { GsproReservation } from './gspro-reservation.entity';
import { GsproSession } from './gspro-session.entity';

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ unique: true })
  slug!: string;

  @Column()
  name!: string;

  @Column()
  address!: string;

  @Column({ type: 'text', nullable: true })
  district!: string | null;

  @Column({ name: 'postal_code', type: 'text', nullable: true })
  postalCode!: string | null;

  @Column()
  city!: string;

  @Column()
  state!: string;

  @Column({ default: 'Brasil' })
  country!: string;

  @Column({ type: 'double precision', nullable: true })
  lat!: number | null;

  @Column({ type: 'double precision', nullable: true })
  lng!: number | null;

  @Column({ default: 'America/Sao_Paulo' })
  timezone!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Organization, (organization) => organization.businesses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @OneToMany(() => BusinessMember, (member) => member.business)
  members!: BusinessMember[];

  @OneToMany(() => BusinessProduct, (product) => product.business)
  products!: BusinessProduct[];

  @OneToMany(() => Order, (order) => order.business)
  orders!: Order[];

  @OneToMany(() => GsproBay, (bay) => bay.business)
  bays!: GsproBay[];

  @OneToMany(() => GsproReservation, (reservation) => reservation.business)
  reservations!: GsproReservation[];

  @OneToMany(() => GsproSession, (session) => session.business)
  sessions!: GsproSession[];
}
