import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ProductDetail {
  @PrimaryGeneratedColumn()
  pd_id: number;

  @Column()
  pd_description: string;
}
