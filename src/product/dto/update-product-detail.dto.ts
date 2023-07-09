import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDetailDto } from './create-product-detail.dto';

export class UpdateProductDetailDto extends PartialType(
  CreateProductDetailDto,
) {
  pd_id?: number;
}
