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
import { GsproReservation } from './gspro-reservation.entity';
import { User } from './user.entity';
import { SessionStatus } from '../../../domain/enums';
import { nullableDecimalTransformer } from '../decimal.transformer';

@Entity('gspro_sessions')
@Index(['businessId', 'bayId', 'status'])
export class GsproSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @Column({ name: 'bay_id' })
  bayId!: string;

  @Column({ name: 'reservation_id', type: 'uuid', nullable: true, unique: true })
  reservationId!: string | null;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    enumName: 'SessionStatus',
    default: SessionStatus.ACTIVE,
  })
  status!: SessionStatus;

  @Column({ name: 'opened_by_id' })
  openedById!: string;

  @Column({ name: 'closed_by_id', type: 'uuid', nullable: true })
  closedById!: string | null;

  @Column({ name: 'started_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startedAt!: Date;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt!: Date | null;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes!: number | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'companion_count', type: 'int', default: 0 })
  companionCount!: number;

  @Column({
    name: 'unit_price_brl',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: nullableDecimalTransformer,
  })
  unitPriceBrl!: number | null;

  @Column({
    name: 'total_cost_brl',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: nullableDecimalTransformer,
  })
  totalCostBrl!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Business, (business) => business.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @ManyToOne(() => GsproBay, (bay) => bay.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bay_id' })
  bay!: GsproBay;

  @OneToOne(() => GsproReservation, (reservation) => reservation.session, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'reservation_id' })
  reservation!: GsproReservation | null;

  @ManyToOne(() => User, (user) => user.openedSessions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'opened_by_id' })
  openedBy!: User;

  @ManyToOne(() => User, (user) => user.closedSessions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'closed_by_id' })
  closedBy!: User | null;
}
