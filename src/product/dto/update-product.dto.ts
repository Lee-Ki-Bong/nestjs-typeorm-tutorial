import {
  UpdateProductDetailDto,
  UpdateProductOptionDto,
  UpdateProductTagDto,
} from '.';

export class UpdateProductDto {
  p_id: number;
  p_name?: string;
  p_price?: number;
  p_product_detail?: UpdateProductDetailDto;
  p_product_options?: UpdateProductOptionDto[];
  p_product_tags?: UpdateProductTagDto[];
}
