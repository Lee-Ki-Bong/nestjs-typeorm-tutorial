import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class ProductOption {
  @PrimaryGeneratedColumn()
  po_id: number;

  @Column({ default: '' })
  po_name: string;

  @Column({ default: '' })
  po_value: string;

  @ManyToOne(() => Product, (po_product) => po_product.p_product_options)
  po_product: Product;
}
