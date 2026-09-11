import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from './business.entity';
import { AgentPrinter } from './agent-printer.entity';
import {
  PrepStation,
  PrinterConnectionStatus,
} from '../../../domain/enums';

@Entity('business_printers')
@Unique(['businessId', 'station'])
export class BusinessPrinter {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @Column({ type: 'varchar' })
  station!: PrepStation;

  @Column({ default: '' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  host!: string | null;

  @Column({ type: 'int', default: 9100 })
  port!: number;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ name: 'paper_width', type: 'int', default: 80 })
  paperWidth!: number;

  @Column({
    name: 'connection_status',
    type: 'varchar',
    default: PrinterConnectionStatus.UNKNOWN,
  })
  connectionStatus!: PrinterConnectionStatus;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt!: Date | null;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  @Column({ name: 'agent_printer_id', type: 'uuid', nullable: true })
  agentPrinterId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @ManyToOne(() => AgentPrinter, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'agent_printer_id' })
  agentPrinter!: AgentPrinter | null;
}
