import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { PrepStation } from '../../../domain/enums';

@Entity('product_categories')
export class ProductCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ name: 'name_pt' })
  namePt!: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder!: number;

  @Column({
    name: 'prep_station',
    type: 'varchar',
    default: PrepStation.BAR,
  })
  prepStation!: PrepStation;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}
