import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';
import { GsproReservation } from './gspro-reservation.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true, unique: true })
  userId!: string | null;

  @Column({ name: 'full_name' })
  fullName!: string;

  @Column({ unique: true, length: 11 })
  cpf!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ unique: true })
  phone!: string;

  @Column({ name: 'birth_date', type: 'date' })
  birthDate!: string;

  @Column({ name: 'postal_code', type: 'text', nullable: true })
  postalCode!: string | null;

  @Column({ type: 'text', nullable: true })
  street!: string | null;

  @Column({ name: 'street_number', type: 'text', nullable: true })
  streetNumber!: string | null;

  @Column({ type: 'text', nullable: true })
  complement!: string | null;

  @Column({ type: 'text', nullable: true })
  district!: string | null;

  @Column({ type: 'text', nullable: true })
  city!: string | null;

  @Column({ type: 'text', nullable: true })
  state!: string | null;

  @Column({ name: 'lgpd_accepted_at', type: 'timestamp' })
  lgpdAcceptedAt!: Date;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => User, (user) => user.customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @OneToMany(() => Order, (order) => order.customer)
  orders!: Order[];

  @OneToMany(() => GsproReservation, (reservation) => reservation.customer)
  reservations!: GsproReservation[];
}
