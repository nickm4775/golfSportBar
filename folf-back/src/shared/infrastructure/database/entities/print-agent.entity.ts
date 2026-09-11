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
import { Business } from './business.entity';
import { AgentPrinter } from './agent-printer.entity';

@Entity('print_agents')
export class PrintAgent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @Column({ name: 'device_id', unique: true })
  deviceId!: string;

  @Column({ name: 'device_name', default: '' })
  deviceName!: string;

  @Column({ default: '' })
  platform!: string;

  @Column({ name: 'token_hash' })
  tokenHash!: string;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt!: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @OneToMany(() => AgentPrinter, (printer) => printer.agent)
  printers!: AgentPrinter[];
}
