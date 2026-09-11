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
import { PrintAgent } from './print-agent.entity';
import { PrinterConnectionType } from '../../../domain/enums';

@Entity('agent_printers')
@Unique(['agentId', 'address'])
export class AgentPrinter {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @Column({ name: 'agent_id' })
  agentId!: string;

  @Column({ default: '' })
  name!: string;

  @Column({ name: 'connection_type', type: 'varchar', default: PrinterConnectionType.NETWORK })
  connectionType!: PrinterConnectionType;

  @Column()
  address!: string;

  @Column({ name: 'paper_width', type: 'int', default: 80 })
  paperWidth!: number;

  @Column({ name: 'is_online', default: true })
  isOnline!: boolean;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @ManyToOne(() => PrintAgent, (agent) => agent.printers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_id' })
  agent!: PrintAgent;
}
