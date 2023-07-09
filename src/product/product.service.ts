import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly prdRepo: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    return await this.prdRepo.save(createProductDto);
  }

  async findAll() {
    return await this.prdRepo.find();
  }

  async findOne(id: number) {
    return await this.prdRepo.findOneBy({ p_id: id });
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.prdRepo.findOneBy({ p_id: id });
    if (!product) {
      throw new HttpException(
        '상품이 존재하지 않습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    updateProductDto.p_id = id;
    const updateProductEntity = plainToInstance(Product, updateProductDto);
    return await this.prdRepo.save(updateProductEntity);
  }

  async remove(id: number) {
    return await this.prdRepo.delete(id);
  }
}
