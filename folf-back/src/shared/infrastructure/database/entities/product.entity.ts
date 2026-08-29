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
import { ProductCategory } from './product-category.entity';
import { BusinessProduct } from './business-product.entity';
import { OrderItem } from './order-item.entity';
import { decimalTransformer } from '../decimal.transformer';
import { PrepStation } from '../../../domain/enums';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ name: 'category_id' })
  categoryId!: string;

  @Column({ name: 'name_pt' })
  namePt!: string;

  @Column({ name: 'description_pt' })
  descriptionPt!: string;

  @Column({
    name: 'base_price_brl',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  basePriceBrl!: number;

  @Column({ name: 'image_src' })
  imageSrc!: string;

  @Column({ default: false })
  featured!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'prep_station', type: 'varchar', nullable: true })
  prepStation!: PrepStation | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => ProductCategory, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category!: ProductCategory;

  @OneToMany(() => BusinessProduct, (businessProduct) => businessProduct.product)
  businessProducts!: BusinessProduct[];

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems!: OrderItem[];
}
