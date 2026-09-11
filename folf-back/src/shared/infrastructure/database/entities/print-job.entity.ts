import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from './business.entity';
import { Order } from './order.entity';
import { AgentPrinter } from './agent-printer.entity';
import { PrintAgent } from './print-agent.entity';
import {
  PrepStation,
  PrintJobExecutedBy,
  PrintJobStatus,
} from '../../../domain/enums';

@Entity('print_jobs')
export class PrintJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId!: string | null;

  @Column({ type: 'varchar' })
  station!: PrepStation;

  @Column({ type: 'varchar', default: PrintJobStatus.PENDING })
  status!: PrintJobStatus;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'executed_by', type: 'varchar', nullable: true })
  executedBy!: PrintJobExecutedBy | null;

  @Column({ name: 'printed_at', type: 'timestamptz', nullable: true })
  printedAt!: Date | null;

  @Column({ name: 'printer_id', type: 'uuid', nullable: true })
  printerId!: string | null;

  @Column({ name: 'claimed_by_agent_id', type: 'uuid', nullable: true })
  claimedByAgentId!: string | null;

  @Column({ name: 'claimed_at', type: 'timestamptz', nullable: true })
  claimedAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @ManyToOne(() => Order, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'order_id' })
  order!: Order | null;

  @ManyToOne(() => AgentPrinter, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'printer_id' })
  agentPrinter!: AgentPrinter | null;

  @ManyToOne(() => PrintAgent, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'claimed_by_agent_id' })
  claimedByAgent!: PrintAgent | null;
}
