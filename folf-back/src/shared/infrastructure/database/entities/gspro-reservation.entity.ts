import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from './business.entity';
import { GsproBay } from './gspro-bay.entity';
import { GsproSession } from './gspro-session.entity';
import { Customer } from './customer.entity';
import { ReservationStatus } from '../../../domain/enums';
import { decimalTransformer } from '../decimal.transformer';

@Entity('gspro_reservations')
@Index(['businessId', 'bayId', 'startAt', 'endAt'])
export class GsproReservation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @Column({ name: 'bay_id' })
  bayId!: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId!: string | null;

  @Column({ name: 'customer_name' })
  customerName!: string;

  @Column({ name: 'customer_phone', type: 'text', nullable: true })
  customerPhone!: string | null;

  @Column({ name: 'start_at', type: 'timestamp' })
  startAt!: Date;

  @Column({ name: 'end_at', type: 'timestamp' })
  endAt!: Date;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    enumName: 'ReservationStatus',
    default: ReservationStatus.PENDING,
  })
  status!: ReservationStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'companion_count', type: 'int', default: 0 })
  companionCount!: number;

  @Column({
    name: 'unit_price_brl',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  unitPriceBrl!: number;

  @Column({
    name: 'total_cost_brl',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  totalCostBrl!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Business, (business) => business.reservations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @ManyToOne(() => GsproBay, (bay) => bay.reservations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bay_id' })
  bay!: GsproBay;

  @ManyToOne(() => Customer, (customer) => customer.reservations, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer | null;

  @OneToOne(() => GsproSession, (session) => session.reservation)
  session!: GsproSession | null;
}
