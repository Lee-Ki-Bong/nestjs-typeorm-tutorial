import { PartialType } from '@nestjs/mapped-types';
import { CreateProductOptionDto } from '.';

export class UpdateProductOptionDto extends PartialType(
  CreateProductOptionDto,
) {
  po_id?: number;
}
