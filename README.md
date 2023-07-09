## 시작하기 전에

이 tutorial 은 database 상호작용과 관련된 내용을 담고 있으며, Typeorm 을 소개하는 데에 초점을 두었다.

더 자세한 정보를 얻고자 한다면 공식 docs를 찾아보길 바란다.

- [Nestjs Docs](https://docs.nestjs.com/techniques/database)
- [Typeorm Docs](https://typeorm.io/)

#

## 프로젝트 생성 & 불필요 파일 제거

```
root@8aece4bfc5fa:/home# nest new
⚡  We will scaffold your app in a few seconds..
? What name would you like to use for the new project? nestjs-typeorm-tutorial
? Which package manager would you ❤️  to use? npm
```

- 완전 빈껍데기 상태에서 시작하기위해 아래의 절차를 진행
- app.controller.ts 삭제
- app.controller.spec.ts 삭제
- app.service.ts 삭제
- app.module.ts 에서 삭제한 컨트롤러, 서비스 삭제

```javascript
@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

## 패키지 설치

- typeorm 패키지 설치

```bash
yarn add @nestjs/typeorm typeorm mysql2
npm install @nestjs/typeorm typeorm mysql2
```

- env 관리를 위한 config 패키지 설치

```bash
yarn add @nestjs/config
npm install @nestjs/config
```

## .env

- 이 파일을 프로젝트 root 에 위치시키도록 한다.
- 정보는 아래를 참고하고 자신에게 맞는 정보로 수정.

```shell
MYSQL_HOST=tutorials-mysql-1
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=1234
MYSQL_DATABASE=tutorial
```

## AppModule 에 ConfigModule 추가

- 아래 예시처럼 설정하면 .env 파일에 추가한 값들을 ConfigService를 통해 애플리케이션 전체에서 사용할 수 있게 된다.
- 이 tutorial은 typeorm 관련내용이기 때문에 자세히 다루지 않겠다.

```javascript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // 이 설정으로 프로젝트 전역에서 구성모듈을 다시 가져올 필요가 없음을 의미함.
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

## Database Module

- synchronize 옵션은 프로덕션 환경에서는 권장되지 않는다. 이 tutorial 에서는 체험을 위해 true 로 사용하였다.

### 아래와 같이 DatabaseModule 을 정의

- 이 프로젝트에서는 디렉토리구조는 신경쓰지 않고 src/ 에 두엇다.

```javascript
@Module({
  imports: [
    // 모듈 설정시 외부에서 설정을 가져올땐 forRootAsync 를 사용하며, 직접적으로 선언하는 경우엔 forRoot() 로 사용한다.
    TypeOrmModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: await configService.getOrThrow('MYSQL_HOST'), // getOrThrow 는 가져올때 없으면 오류를 발생시킴.
        port: await configService.getOrThrow('MYSQL_PORT'),
        database: await configService.getOrThrow('MYSQL_DATABASE'),
        username: await configService.getOrThrow('MYSQL_USERNAME'),
        password: await configService.getOrThrow('MYSQL_PASSWORD'),
        autoLoadEntities: true, // 이 옵션을 true 로 줌으로서, 모델이 어디에 있는지 수동으로 알릴 필요가 없음.
        synchronize: true, // TypeORM은 애플리케이션 실행 시 엔티티들을 확인하고 변경사항을 감지하여 수정함.
        logging: true, // typeorm 이 실행하고 있는 쿼리를 로깅할지 여부
      }),
      inject: [ConfigService], // 위 useFactory 에 의존성 주입을 위해 inject 를 선언한다.
    }),
  ],
})
export class DatabaseModule {}
```

- 모듈 선언시 **외부에서** 설정을 가져올땐 **forRootAsync()** 를 사용하며, **직접적으로** 선언하는 경우엔 **forRoot()** 로 사용한다.
- 위 예시에선 외부에서 ConfigService를 필요로 하기 때문에 **TypeOrmModule**.forRootAsync()시 **의존성 주입을 위해 inject 를 선언**한다.
- ConfigService.**getOrThrow**('MYSQL_HOST') 는 가져올때 없으면 **오류를 발생**시킨다.
- TypeOrmModuleOptions 에 **autoLoadEntities: true** 로 줌으로서, 엔티티가 어디에 있는지 **수동으로 알릴 필요가 없다.**

### AppModule 에 바인딩

```javascript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule, // 바인딩 : NestJS에서 모듈을 다른 모듈에 연결하고 의존성을 주입하는 것을 바인딩 이라고 한다.
  ],
  providers: [], // 이 프로바이더 배열에 추가하는 것은 AppModule 내에서 의존성 주입을 받을 프로바이더를 등록하는 행위이다. '의존성 주입 한다' or '의존성 주입 등록 한다.'. 이라고 한다.
})
export class AppModule {}
```

### 프로젝트를 구동하여 모듈들 의존성 주입 확인

```
[Nest] 678  - 07/09/2023, 12:26:58 AM     LOG [InstanceLoader] DatabaseModule dependencies initialized +0ms
[Nest] 678  - 07/09/2023, 12:26:58 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized +0ms
[Nest] 678  - 07/09/2023, 12:26:58 AM     LOG [InstanceLoader] ConfigHostModule dependencies initialized +0ms
[Nest] 678  - 07/09/2023, 12:26:58 AM     LOG [InstanceLoader] ConfigModule dependencies initialized +0ms
[Nest] 678  - 07/09/2023, 12:26:58 AM     LOG [InstanceLoader] TypeOrmCoreModule dependencies initialized +78ms
```

#

## 제너레이터로 product 리소스 생성

- 이제 실제 제공할 모듈을 작성해보자.
- 상품을 예시로 들었다.

```shell
nest g res product --no-spec
? What transport layer do you use? REST API
? Would you like to generate CRUD entry points? Yes
```

- **product** 라는 디렉토리가 생성되고, 안에 **dto, entities 와 컨트롤러, 서비스, 모듈 생성됨**을 확인.
- **app.module.ts** 에 product.module.ts 이 **자동으로 바인딩** 됨을 확인.
- --no-spec 은 spec 파일이 생성되지 않게 하는 옵션이다.

## 엔티티 수정

- 간단하게, 시퀀스, 상품명, 가격. 3개의 맴버를 추가했다.
- 여기에서는 자세한 맴버의 자료형에 대한 정의는 다루지 않겠다.

```javascript
@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  p_id: number;

  @Column({ default: '' })
  p_name: string;

  @Column({ default: 0 })
  p_price: number;
}
```

## Create DTO 수정

- DTO 는 데이터 전송객체이며 크게 두 가지로 나뉜다.
  - 요청구조를 정의한 DTO
  - 응답구조를 정의한 DTO
- 이 tutorial 에서는 요청구조를 정의해볼 것 이다.
- 더 자세한 내용과 유효성 검사와 밀접한 관련이 있으나, 이 tutorial 에서는 다루지 않겠다.

```javascript
export class CreateProductDto {
  p_name: string;
  p_price: number;
}
```

## [잠깐] 속성명 컨벤션에 대해서

- 사실, JavaScript와 TypeScript에서 변수와 속성 이름을 작성하는 데 사용되는 네이밍 컨벤션은 camelCase 가 관례이다.
- 그러나 개개인마다 가독성을 느끼는 편차가 다르고, 프로젝트 팀의 네이밍 규칙이나 조직의 가이드라인에 따라 다른 네이밍 스타일이 있다.
- 그리고 엔티티 클래스의 속성명은 데이터베이스 테이블의 컬럼 이름과 일치해야하는 문제가 발생한다.
- 대소문자를 구분하지 않는 파일 시스템 데이터베이스에서는 소문자와 언더스코어(\_)를 사용하여 컬럼 이름을 작성하기 때문에 일부 설정 변경이 필요하다.
- 허나 중요한 것은 일관성을 유지하고 가독성을 높이는 것이다.

## TableNamingStrategy

- 위 에서 이야기했던 속성명 컨벤션문제를 typeorm 에서 제공하는 NamingStrategyInterface 로 도움 받을 수 있다.
- 이 tutorial 에서는 테이블명이 될 엔티티 클래스명을 snakeCase 로 변경하고 뒤에 '\_tb' 이 붙도록 추가해보았다.

```javascript
// src/table-naming.strategy.ts
export class TableNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  private tbNamePrefix: string = '_tb';

  tableName(className: string, customName: string): string {
    const tbName = customName ? customName : snakeCase(className); // 엔티티 클래스명을 snakeCase 로
    return `${tbName}${this.tbNamePrefix}`; // 뒤에 '\_tb' 이 붙도록
  }

  // 테이블명 뿐만아니라 컬럼등 다양한 함수가 존재하며 이들을 구현하여 활용할 수 있다.
  // 자세한 내용은 NamingStrategyInterface 내부를 들여다보길 바란다.
}
```

- DatabaseModule 에 적용한 모습

```javascript
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: await configService.getOrThrow('MYSQL_HOST'),
        port: await configService.getOrThrow('MYSQL_PORT'),
        database: await configService.getOrThrow('MYSQL_DATABASE'),
        username: await configService.getOrThrow('MYSQL_USERNAME'),
        password: await configService.getOrThrow('MYSQL_PASSWORD'),
        autoLoadEntities: true,
        synchronize: true,
        logging: true,
        namingStrategy: new TableNamingStrategy(), // 적용
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
```

- ProductModule 에 사용할 Product 엔티티를 정의.

```javascript
@Module({
  imports: [TypeOrmModule.forFeature([Product])], // 추가
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
```

- 프로젝트 구동. namingStrategy 이 적용되어 테이블을 생성한 모습.
- 생성만 관련있는 것이 아니라, 이제부터 엔티티클래스가 namingStrategy를 참고하여, 매핑된 테이블과 상호작용 하게 된다.

```
mysql> show tables;
+--------------------+
| Tables_in_tutorial |
+--------------------+
| product_tb         |
+--------------------+
```

#

## Typeorm의 DB 상호작용 방식 3가지

- 크게 3가지 방식이 있다. 각 방식의 차이점을 한마디로 이야기 하자면 '추상화 수준' 이다.
  - Repository
  - QueryBuilder
  - queryRunner
- 자세한 내용은 공식 docs 를 참고하길 바란다. [Typeorm Docs](https://typeorm.io/)

### Repository 활용

- TypeORM에서 가장 일반적으로 사용되는 방식
- Repository를 사용하여 CRUD(Create, Read, Update, Delete) 작업을 수행하고, 데이터베이스 트랜잭션을 관리
- 높은 수준의 추상화를 제공

```javascript
@Injectable()
export class ProductService {
  constructor(
    // Entity와의 상호작용을 통해 객체지향적인 접근 방식이 큰 특징이다.
    @InjectRepository(Product) private readonly prdRepo: Repository<Product>,
  ) {}

  create(createProductDto: CreateProductDto) {
    return this.prdRepo.save(createProductDto);
  }

  findAll() {
    return this.prdRepo.find();
  }

  findOne(id: number) {
    return this.prdRepo.findOneBy({ p_id: id });
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return this.prdRepo.update(id, updateProductDto);
  }

  remove(id: number) {
    return this.prdRepo.delete(id);
  }
}
```

### QueryBuilder 활용

- Repository 보다 좀 더 복잡한 쿼리 작업이 필요한 경우에 사용.
- 아래처럼 동적인 조건 조회가 필요한 작업을 수행하는데 적합.
- 즉, 세밀한 제어를 원하는 경우에 사용할 수 있으며, Repository보다 더 낮은 수준의 추상화를 제공
- 하지만 관계 데이터 생성 또는 매핑을 직접적으로 지원하지는 않는다.

```javascript
const query = await this.productRepository
  .createQueryBuilder('product')
  .leftJoinAndSelect('product.options', 'options')
  .select([
    'product.id',
    'product.name',
    'product.description',
    'options.id',
    'options.name',
    'options.value',
  ]);

// 동적으로 조건 적용한 모습
if (searchDto.productName) {
  query.andWhere('product.name = :productName', { productName });
}
if (productOptionValue) {
  query.andWhere('options.value = :productOptionValue', {
    productOptionValue,
  });
}
const results = await query.getMany(); // 실행부
console.log(query.getSql()); // 실행되는 쿼리 확인
```

#### 대량 데이터 insert

- 아래의 데이터 생성 예시 처럼, 쿼리 빌더는 데이터베이스와의 통신 횟수가 줄어들어 네트워크 오버헤드를 감소시킬 수 있으며, '알아서' 데이터베이스 시스템에 따라 최적화된 방식으로 처리한다.
- 하지만 아쉽게도 관계가 형성된 데이터 생성은 지원하지 않는다.
- 단일 테이블의 대용량 처리가 필요할때 사용.

```javascript
this.dataSource
  .createQueryBuilder()
  .insert()
  .into(Product)
  .values([
    {
      name: '상품1',
      description: '상품설명1',
    },
    {
      name: '상품2',
      description: '상품설명2',
    },
  ])
  .execute();
```

### queryRunner 활용

- 대부분은 repository 와 createQueryBuilder 로 커버가 가능하지만, 이 수준을 넘어서는 sql 작업이 필요할때 사용. (프로시저 호출 등.)

```javascript
this.dataSource
  .createQueryBuilder()
  .connection.transaction(async (entityManager) => {
    const queryRunner = entityManager.queryRunner;

    const productId = await queryRunner.query(
      `INSERT INTO product (name, description) VALUES ('상품1', '상품설명1') RETURNING id`,
    );
  });
```

#

## TypeOrm Repository를 이용한 관계 데이터 생성

- Orm 은 Object Relational Mapping 의 줄임말로서 객체와 관계형 데이터베이스를 자동으로 매핑시켜주는 것을 말한다.
- 이제부터 강력한 TypeOrm 의 관계 매핑기능을 활용한 insert 예시를 들어보겠다.

### 관계 엔티티 생성

#### 상품과 1:1 관계 상품상세

- description 필드를 가진 엔티티.

```javascript
@Entity()
export class ProductDetail {
  @PrimaryGeneratedColumn()
  pd_id: number;

  @Column()
  pd_description: string;
}
```

#### 상품과 1:N 관계인 상품옵션

- 옵션명과 옵션값 필드를 가진 엔티티.

```javascript
@Entity()
export class ProductOption {
  @PrimaryGeneratedColumn()
  po_id: number;

  @Column({ default: '' })
  po_name: string;

  @Column({ default: '' })
  po_value: string;
```

#### 상품과 N:M 관계인 상품태그

- 태그명 만 가진다.

```javascript
@Entity()
export class ProductTag {
  @PrimaryGeneratedColumn()
  pt_id: number;

  @Column()
  pt_name: string;
}
```

### 관계 정의

- 아래와 같이 각각의 엔티티 관계들을 정의한다.

#### relation-one-to-one

```javascript
  // src/product/entities/product.entity.ts
  @OneToOne(() => ProductDetail, { cascade: true }) // 주목
  @JoinColumn({ name: 'product_detail_id' })
  p_product_detail: ProductDetail;
```

#### relation-one-to-many

```javascript
  // src/product/entities/product.entity.ts
  @OneToMany(() => ProductOption, (productOption) => productOption.po_product, {
    cascade: true,  // 주목
  })
  p_product_options: ProductOption[];
```

```javascript
  // src/provided-modules/product/entities/product-option.entity.ts
  @ManyToOne(() => Product, (po_product) => po_product.p_product_options)
  po_product: Product;
```

#### relation-many-to-many

```javascript
  // src/product/entities/product.entity.ts
  @ManyToMany(() => ProductTag, { cascade: true })  // 주목
  @JoinTable({name : '매핑테이블명'})
  p_product_tags: ProductTag[];
```

### ProductModule 에 엔티티들 추가

```javascript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductDetail, // 추가
      ProductOption, // 추가
      ProductTag, // 추가
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
```

### Create DTO 정의

```javascript
export class CreateProductDetailDto {
  pd_description: string;
}
```

```javascript
export class CreateProductOptionDto {
  po_name: string;
  po_value: string;
}
```

```javascript
export class CreateProductTagDto {
  pt_name: string;
}
```

```javascript
export class CreateProductDto {
  p_name: string;
  p_price: number;
  p_product_detail: CreateProductDetailDto;
  p_product_options: CreateProductOptionDto[];
  p_product_tags: CreateProductTagDto[];
}
```

### 관계 데이터 요청 & 생성

- 아래의 데이터 구조가 DTO 를 통해 들어오게 되면.

```json
// 요청
{
  "p_name": "인상적인 주전자",
  "p_price": 10000,
  "p_product_detail": {
    "pd_description": "멋진 주전자"
  },
  "p_product_options": [
    {
      "po_name": "인상적인 주전자 옵션1",
      "po_value": "인상적인 주전자 옵션값1"
    },
    {
      "po_name": "인상적인 주전자 옵션2",
      "po_value": "인상적인 주전자 옵션값2"
    }
  ],
  "p_product_tags": [
    {
      "pt_name": "주방용품"
    },
    {
      "pt_name": "주전자"
    }
  ]
}
```

- 이 코드를 실행하는 것 만으로

```javascript
  create(createProductDto: CreateProductDto) {
    return this.prdRepo.save(createProductDto);
  }
```

- 관계된 모든 테이블들의 시퀀스 매핑이 자동으로 이루어 지면서 insert 되는 것을 볼 수 있다.
- 물론 이 과정에서 트랜젝션 처리가 이루어지며, 중간에 다른 테이블 sql 이 실패되면 이전 sql 이 롤백된다.
- 자세한 sql 처리 과정은 typeorm 옵션 logging: true 로 확인 해보길 바란다.

```javascript
// 결과
{
	"p_name": "인상적인 주전자",
	"p_price": 10000,
	"p_product_detail": {
		"pd_description": "멋진 주전자",
		"pd_id": 1
	},
	"p_product_options": [
		{
			"po_name": "인상적인 주전자 옵션1",
			"po_value": "인상적인 주전자 옵션값1",
			"po_id": 1
		},
		{
			"po_name": "인상적인 주전자 옵션2",
			"po_value": "인상적인 주전자 옵션값2",
			"po_id": 2
		}
	],
	"p_product_tags": [
		{
			"pt_name": "주방용품",
			"pt_id": 1
		},
		{
			"pt_name": "주전자",
			"pt_id": 2
		}
	],
	"p_id": 1
}
```

### cascade 옵션

- cascade 옵션은 관계정의를 통해 연결된 엔티티를 토대로 DB 조작시 시퀀스관계를 자동으로 매핑시켜 작업을 수행하게 한다.
- cascade 옵션에는 다음과 같은 값들 설정가능.

1. "insert": 연관된 객체의 생성(insert)에 대한 cascade 작업을 수행.
2. "update": 연관된 객체의 업데이트(update)에 대한 cascade 작업을 수행.
3. "remove": 연관된 객체의 삭제(remove)에 대한 cascade 작업을 수행.
4. "soft-remove": 연관된 객체의 소프트 삭제(soft remove)에 대한 cascade 작업을 수행.
5. "recover": soft Delete 된 연관 객체의 복구(recover) cascade 작업을 수행.
6. true : 모든 작업들을 수행.

- cascade 옵션은 배열 형태로도 지정가능. 예를 들어 cascade: ["insert", "update"]

#### cascade 옵션을 사용하지 않았을 경우, 트랜잭션 처리와 함께 관계엔티티 매핑작업이 이루어져야함.

```javascript
  async create(createDto: CreateProductDto) {
    const createPrdEntity = plainToInstance(Product, createDto);
    return await this.dataSource
      .createQueryBuilder()
      .connection.transaction(async (entityManager) => {
        const prdRepo = entityManager.withRepository(this.productRepository);
        const prdOptRepo = entityManager.withRepository(
          this.productOptionRepository,
        );

        try {
          const newPrd = await prdRepo.save(createPrdEntity);
          createPrdEntity.options.map(
            (v, idx) => (createPrdEntity.options[idx].product = newPrd), // 관계를 일일히 주입하고있다.
          );
          await prdOptRepo.save(createPrdEntity.options);

          return prdRepo.find({
            where: { id: newPrd.id },
            relations: {
              options: true,
            },
          });
        } catch (error) {
          throw new InternalServerErrorException(error);
        }
      });
  }
```

#

## Typeorm 메서드에 Entity를 넘기는 것이 권장사항이다.

- 지금 예시에서는 DTO 객체를 save() 매개변수에 넘기고 있다. 제대로 동작이 이루어지는 이유는 DTO 객체와 엔티티의 구조가 동일하기 때문이다. 즉, DTO객체가 그대로 사용되고 TypeORM은 해당 DTO 객체를 데이터베이스에 저장하고 있는 것이다.

### 왜 엔티티를 넘겨야 하는가

- 타입 안정성: TypeORM은 엔티티의 타입을 기반으로 적합한 쿼리를 생성하여 타입 안정성을 보장한다.
- 단일책임원칙 : DTO를 그대로 DB 상호작용에 이용한다면, DTO의 변경이 곧 DB에 영향을 주기 때문에 지향해야 한다.

때문에 DTO와 엔티티를 분리하여 각각의 역할에 집중할 수 있도록 관리하는 걸 제안한다.

#

## DTO -> Entity 의 트랜스폼

- 위에서 언급한 권장사항을 수기로 처리하는게 아닌 패키지의 도움을 받을 수 있다.
- class-transformer 패키지의 plainToInstance() 의 도움으로 변환을 쉽게 처리할 수 있다.

### 관련 패키지 설치

```
yarn add class-transformer
npm install class-transformer
```

### 사용예시

```javascript
// createProductDto 를 ProductEntity 로 트랜스폼
const ProductEntity = plainToInstance(ProductEntity, createProductDto);
```

```javascript
// productEntity 를 ResponseProductDto 로 트랜스폼
const responseProductDto = plainToInstance(ResponseProductDto, productEntity);
```

### 장점

1. 중복 제거

- DTO와 엔티티 사이의 매핑 및 변환 로직을 코드의 중복없이 간편하게 변환가능, 이는 개발속도를 향상시킨다.

2. 중첩된 객체 변환

- 객체 내부에 또 다른 객체가 포함되어 있는 경우에도 모두 인스턴스로 변환이 가능하다.
- 즉, 객체배열을 넘겨도 배열 내 모든 객체들을 변환.

```javascript
export declare function plainToInstance<T, V>(cls: ClassConstructor<T>, plain: V[], options?: ClassTransformOptions): T[];
export declare function plainToInstance<T, V>(cls: ClassConstructor<T>, plain: V, options?: ClassTransformOptions): T;
```

3. 유지보수와 범용성

- 공식 패키지 함수를 사용함 으로서 실수가 빈번하게 일어날 수 있는 구간을 대신함.
- 자연스레 데이터 변환이 이루어지는 지점임이 명시되면서 코드의 가독성을 높임.

## plainToInstance() 를 이용한 update 구현

### Update Dto 정의

- 주요 포인트
  - PartialType을 사용하여 각 DTO의 필드를 선택적으로 업데이트할 수 있도록 정의.
  - UpdateProductDto 를 제외한 테이블들의 시퀀스를 선택적으로 받음 으로서 save() 를 통해 시퀀스 유무로 insert, update 를 동작하도록 구성.

```javascript
export class UpdateProductDto {
  p_id: number;
  p_name?: string;
  p_price?: number;
  p_product_detail?: UpdateProductDetailDto;
  p_product_options?: UpdateProductOptionDto[];
  p_product_tags?: UpdateProductTagDto[];
}

```

```javascript
export class UpdateProductDetailDto extends PartialType(CreateProductDetailDto) {
  pd_id?: number;
}
```

```javascript
export class UpdateProductOptionDto extends PartialType(CreateProductOptionDto) {
  po_id?: number;
}
```

```javascript
export class UpdateProductTagDto extends PartialType(CreateProductTagDto) {
  pt_id?: number;
}
```

```javascript
  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.prdRepo.findOneBy({ p_id: id });
    if (!product) {
      throw new HttpException(
        '상품이 존재하지 않습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const updateProductEntity = plainToInstance(Product, updateProductDto); // 사용된 부분.
    updateProductEntity.p_id = id;
    return await this.prdRepo.save(updateProductEntity);
  }

```

- 자동 변경 감지: TypeORM은 변경된 속성만을 업데이트하여 성능을 개선하고 중복 작업을 방지한다.
- localhost:3000/product/1 PATCH 요청

```
{
	"p_name": "인상적인 주전자",
	"p_price": 10000,
	"p_product_detail": {
		"pd_description": "멋진 주전자 설명", // 멋진 주전자 -> 멋진 주전자 설명
		"pd_id": 1
	},
	"p_product_options": [
		{
			"po_name": "인상적인 주전자 옵션1",
			"po_value": "인상적인 주전자 옵션값1",
			"po_id": 1
		},
		{
			"po_name": "인상적인 주전자 옵션2",
			"po_value": "인상적인 주전자 옵션값2",
			"po_id": 2
		},
		{ // 새 옵션을 추가 (시퀀스 없음)
			"po_name": "인상적인 주전자 옵션3",
			"po_value": "인상적인 주전자 옵션값3"
		}
	],
	"p_product_tags": [
		{
			"pt_name": "주방용품",
			"pt_id": 1
		},
		{
			"pt_name": "주전자",
			"pt_id": 2
		}
	]
}
```

- 변경된 사항만 찾아 update 되는 것을 볼 수 있다.

```
query: START TRANSACTION
query: UPDATE `product_detail_tb` SET `pd_description` = ? WHERE `pd_id` IN (?) -- PARAMETERS: ["멋진 주전자 설명",1]
query: INSERT INTO `product_option_tb`(`po_id`, `po_name`, `po_value`, `poProductPId`) VALUES (DEFAULT, ?, ?, ?) -- PARAMETERS: ["인상적인 주전자 옵션3","인상적인 주전자 옵션값3",1]
query: COMMIT
```

## TypeORM의 insert(), update()

- 이 메서드들은 관계 매핑을 지원하지않는다.
- 이들은 단순히 주어진 데이터를 데이터베이스에 삽입, 변경하는 용도로 사용된다.
- 만약 사용하면서 관계를 처리하고 싶다면, 관계를 수동으로 처리해야 한다.

## entityManager 를 이용한 transaction 처리

- Repository는 관계가 형성된 엔티티들을 처리. 그 보다 범위가 큰 작업이 필요할 경우 사용.
- typeorm의 entityManager를 이용한 방법.
- 여러 트랜젝션처리 방법이 있지만, 이 방법이 제일 깔끔한것같아 제시.

```javascript
// src/product/product.service.ts
  async update(id: number, updateProductDto: UpdateProductDto) {
    const res = await this.entityManager.transaction(async (entityManager) => {
      // entityManager.withRepository()로 각 Repository를 선언, 이를 통해 각각 수행하는 쿼리들은 하나의 트랜젝션키로 묶이게된다.
      const prdRepo = entityManager.withRepository(this.prdRepo);
      const prdOptionRepo = entityManager.withRepository(this.prdOptionRepo);

      const product = await prdRepo.save(상품데이터); // 성공
      const prdOption = await prdOptionRepo.save(옵션데이터); // 예외 발생시 prdRepo.save() 에서 실행된 sql 롤백됨.
    });
    return res;
  }
```

## Custom Repository

- 복잡한 요구사항으로 인해 Repository 만으론 코드 관리의 양이 방대할 경우, 특정 데이터베이스 관련 로직을 캡슐화하여 사용하는 것이 권장사항이다.
- 이로서 해당 영역에선 DB과 관련된 로직에만 집중할 수 있고, 서비스단에서 분리됨으로서 코드의 유지 보수성이 향상된다.
- 데이터베이스 관련 코드를 조직화하고 관리하는 좋은 방법이다.
- 아래는 가장 최근 TypeOrm 버전에서 Custom Repository 구현하는 방식이다.

```javascript
@Injectable()
export class ProductRepository extends Repository<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  findByName(p_name: string) {
    return this.repository
      .createQueryBuilder('product')
      .where('product.p_name = :p_name', { p_name })
      .getMany();
  }

  /**
   * 상품리스트같은 경우 요구되는 곳을 다양하며, 요구사항도 각양각색일 것이다.
   * 이럴때 리스트만을 위한 레포지토리(ProductListRepository)를 따로 관리 하거나
   * 단일 리스트의 요구사항이 복잡할 경우 그 한가지 리스트 select 처리만을 담당하는 레포지토리로 복잡성이 높은 코드를 분리시켜 관리.
   */
}
```

## migration

### 필요 패키지 설치

- 명령어로 마이그래이션을 실행할때, 외부에서 .env 로드하기 위한 패키지 설치

```shell
yarn add dotenv
```

```shell
npm install dotenv
```

### 마이그레이션 설정 파일 생성

- migration.config.ts 참고

### 마이그레이션 생성 명령어 추가

- package.json 에 아래 명령어 추가

```javascript
"scripts": {
  "typeorm": "ts-node ./node_modules/typeorm/cli",
  "typeorm:create-migration": "npm run typeorm -- migration:create ./migrations/$npm_config_name"
}
```

### 터미널에서 파일 생성 명령어 실행

```shell
npm run typeorm:create-migration --name=UpdateProductPrice

> typeorm-tutorial@0.0.1 typeorm:create-migration
> npm run typeorm -- migration:create ./migrations/$npm_config_name


> typeorm-tutorial@0.0.1 typeorm
> ts-node ./node_modules/typeorm/cli migration:create ./migrations/UpdateProductPrice

Migration /home/typeorm-tutorial/migrations/1688885822966-UpdateProductPrice.ts has been generated successfully.
npm notice
npm notice New minor version of npm available! 9.5.1 -> 9.7.2
npm notice Changelog: https://github.com/npm/cli/releases/tag/v9.7.2
npm notice Run npm install -g npm@9.7.2 to update!
npm notice
```

- 파일생성 확인 migrations/1688885822966-UpdateProductPrice.ts

### up(), down() MigrationInterface 함수 구현

```javascript
export class UpdateProductPrice1688885822966 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    Logger.log('상품 가격 모두 10000원 으로');
    await queryRunner.query('UPDATE product set p_price = 10000;');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    Logger.log('상품 가격 모두 0원 으로');
    await queryRunner.query('UPDATE product set p_price = 0;');
  }
}

```

### 마이그레이션 실행 명령어 추가

- package.json 에 명령어 추가

```javascript
"typeorm:run-migrations": "npm run typeorm migration:run -- -d ./migration.config.ts",
"typeorm:revert-migrations": "npm run typeorm migration:revert -- -d ./migration.config.ts"
```

### 터미널에서 마이그레이션 실행

#### [UP]

```shell
npm run typeorm:run-migrations

> typeorm-tutorial@0.0.1 typeorm:run-migrations
> npm run typeorm migration:run -- -d ./migration.config.ts


> typeorm-tutorial@0.0.1 typeorm
> ts-node ./node_modules/typeorm/cli migration:run -d ./migration.config.ts

query: SELECT VERSION() AS `version`
query: SELECT * FROM `INFORMATION_SCHEMA`.`COLUMNS` WHERE `TABLE_SCHEMA` = 'test' AND `TABLE_NAME` = 'migrations'
query: CREATE TABLE `migrations` (`id` int NOT NULL AUTO_INCREMENT, `timestamp` bigint NOT NULL, `name` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB
query: SELECT * FROM `test`.`migrations` `migrations` ORDER BY `id` DESC
0 migrations are already loaded in the database.
1 migrations were found in the source code.
1 migrations are new migrations must be executed.
query: START TRANSACTION
[Nest] 2923  - 06/27/2023, 9:28:41 AM     LOG 상품 가격 모두 10000원 으로
query: UPDATE product set p_price = 10000;
query: INSERT INTO `test`.`migrations`(`timestamp`, `name`) VALUES (?, ?) -- PARAMETERS: [1688885822966,"UpdateProductPrice1688885822966"]
Migration UpdateProductPrice1688885822966 has been  executed successfully.
query: COMMIT
```

#### [Down]

```shell
npm run typeorm:revert-migrations

> typeorm-tutorial@0.0.1 typeorm:revert-migrations
> npm run typeorm migration:revert -- -d ./migration.config.ts


> typeorm-tutorial@0.0.1 typeorm
> ts-node ./node_modules/typeorm/cli migration:revert -d ./migration.config.ts

query: SELECT VERSION() AS `version`
query: SELECT * FROM `INFORMATION_SCHEMA`.`COLUMNS` WHERE `TABLE_SCHEMA` = 'test' AND `TABLE_NAME` = 'migrations'
query: SELECT * FROM `test`.`migrations` `migrations` ORDER BY `id` DESC
1 migrations are already loaded in the database.
UpdateProductPrice1688885822966 is the last executed migration. It was executed on Tue Jun 27 2023 09:09:01 GMT+0000 (Coordinated Universal Time).
Now reverting it...
query: START TRANSACTION
[Nest] 2958  - 06/27/2023, 9:29:33 AM     LOG 상품 가격 모두 0원 으로
query: UPDATE product set p_price = 0;
query: DELETE FROM `test`.`migrations` WHERE `timestamp` = ? AND `name` = ? -- PARAMETERS: [1688885822966,"UpdateProductPrice1688885822966"]
Migration UpdateProductPrice1688885822966 has been  reverted successfully.
query: COMMIT
```

**[참고]**
error: Error: Got error 168 - 'Unknown (generic) error from engine' from storage engine
관련 에러가 난다면

- **데이터베이스 권한 확인**
- **동일한** 이름을 가진 다른 **객체가 있는지 확인**
- 실행된 sql MySQL 버전 호환성확인
- 데이터베이스 status 확인
