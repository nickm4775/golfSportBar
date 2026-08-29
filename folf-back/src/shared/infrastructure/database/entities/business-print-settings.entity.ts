import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from './business.entity';
import { PrintExecutionMode } from '../../../domain/enums';

@Entity('business_print_settings')
export class BusinessPrintSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id', unique: true })
  businessId!: string;

  @Column({
    name: 'print_execution_mode',
    type: 'varchar',
    default: PrintExecutionMode.AGENT,
  })
  printExecutionMode!: PrintExecutionMode;

  @Column({ name: 'agent_last_seen_at', type: 'timestamptz', nullable: true })
  agentLastSeenAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;
}
