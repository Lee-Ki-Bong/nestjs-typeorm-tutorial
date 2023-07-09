import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductDetail, ProductOption, ProductTag } from '.';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  p_id: number;

  @Column({ default: '' })
  p_name: string;

  @Column({ default: 0 })
  p_price: number;

  @OneToOne(() => ProductDetail, { cascade: true }) // "cascade" 옵션 관계를 통해 연결된 객체에 대한 데이터베이스 조작(cascade operation)을 지정
  @JoinColumn({ name: 'product_detail_id' })
  p_product_detail: ProductDetail;

  @OneToMany(() => ProductOption, (productOption) => productOption.po_product, {
    cascade: true,
  })
  p_product_options: ProductOption[];

  @ManyToMany(() => ProductTag, { cascade: true })
  @JoinTable()
  p_product_tags: ProductTag[];
}
