import {
  CreateProductDetailDto,
  CreateProductOptionDto,
  CreateProductTagDto,
} from '.';

export class CreateProductDto {
  p_name: string;
  p_price: number;
  p_product_detail: CreateProductDetailDto;
  p_product_options: CreateProductOptionDto[];
  p_product_tags: CreateProductTagDto[];
}
