import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ProductTag {
  @PrimaryGeneratedColumn()
  pt_id: number;

  @Column()
  pt_name: string;
}
