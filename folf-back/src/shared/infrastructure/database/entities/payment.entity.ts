import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from './business.entity';
import { Order } from './order.entity';
import { PaymentMethod, PaymentProvider, PaymentStatus } from '../../../domain/enums';
import { decimalTransformer, nullableDecimalTransformer } from '../decimal.transformer';

@Entity('payments')
@Index(['businessId'])
@Index(['orderId'])
@Index(['providerPaymentId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @Column({ name: 'order_id' })
  orderId!: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    enumName: 'PaymentMethod',
  })
  method!: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    enumName: 'PaymentStatus',
  })
  status!: PaymentStatus;

  @Column({
    name: 'amount_brl',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  amountBrl!: number;

  @Column({
    name: 'cash_received_brl',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: nullableDecimalTransformer,
  })
  cashReceivedBrl!: number | null;

  @Column({
    name: 'change_brl',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: nullableDecimalTransformer,
  })
  changeBrl!: number | null;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    enumName: 'PaymentProvider',
    nullable: true,
  })
  provider!: PaymentProvider | null;

  @Column({ name: 'provider_payment_id', type: 'text', nullable: true })
  providerPaymentId!: string | null;

  @Column({ name: 'qr_code', type: 'text', nullable: true })
  qrCode!: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;
}
