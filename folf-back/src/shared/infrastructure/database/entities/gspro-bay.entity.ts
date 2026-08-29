import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from './business.entity';
import { GsproReservation } from './gspro-reservation.entity';
import { GsproSession } from './gspro-session.entity';

@Entity('gspro_bays')
@Unique(['businessId', 'code'])
export class GsproBay {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @Column()
  code!: string;

  @Column()
  name!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Business, (business) => business.bays, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @OneToMany(() => GsproReservation, (reservation) => reservation.bay)
  reservations!: GsproReservation[];

  @OneToMany(() => GsproSession, (session) => session.bay)
  sessions!: GsproSession[];
}
