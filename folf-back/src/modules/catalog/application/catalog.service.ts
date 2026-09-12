import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Repository } from 'typeorm';
import { BusinessProduct } from '../../../shared/infrastructure/database/entities/business-product.entity';
import { Product } from '../../../shared/infrastructure/database/entities/product.entity';
import { ProductCategory } from '../../../shared/infrastructure/database/entities/product-category.entity';
import {
  CreateBusinessProductDto,
  UpdateBusinessProductDto,
} from '../presentation/dto/catalog.dto';
import { BusinessRealtimeService } from '../../realtime/application/business-realtime.service';
import { PrepStation } from '../../../shared/domain/enums';

const KITCHEN_SLUGS = new Set(['petiscos', 'pizzas', 'burgers', 'sobremesas']);

const IMAGE_EXTENSIONS_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(BusinessProduct)
    private readonly businessProductRepo: Repository<BusinessProduct>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepo: Repository<ProductCategory>,
    @Optional() private readonly realtime?: BusinessRealtimeService,
  ) {}

  async getMenu(businessId: string, category?: string, includeUnavailable = false) {
    const qb = this.businessProductRepo
      .createQueryBuilder('bp')
      .innerJoinAndSelect('bp.product', 'product')
      .innerJoinAndSelect('product.category', 'category')
      .where('bp.businessId = :businessId', { businessId })
      .andWhere('product.isActive = true');

    if (!includeUnavailable) {
      qb.andWhere('bp.isAvailable = true');
    }

    if (category) {
      qb.andWhere('category.slug = :category', { category });
    }

    qb.orderBy('category.sortOrder', 'ASC').addOrderBy('product.namePt', 'ASC');

    const businessProducts = await qb.getMany();
    const categories = await this.categoryRepo.find({
      order: { sortOrder: 'ASC' },
    });

    return {
      categories,
      items: businessProducts.map((bp) => this.toMenuItem(bp)),
    };
  }

  async createProduct(businessId: string, dto: CreateBusinessProductDto) {
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    const product = await this.productRepo.save({
      slug: await this.uniqueSlug(dto.name),
      categoryId: dto.categoryId,
      namePt: dto.name,
      descriptionPt: dto.description ?? '',
      basePriceBrl: dto.priceBrl,
      imageSrc: dto.imageSrc?.trim() || '/images/menu/pizza-pepperoni.png',
      featured: dto.featured ?? false,
      isActive: true,
      prepStation: dto.prepStation ?? null,
    });

    const businessProduct = await this.businessProductRepo.save({
      businessId,
      productId: product.id,
      priceBrl: dto.priceBrl,
      isAvailable: dto.isAvailable ?? true,
    });

    const saved = await this.businessProductRepo.findOneOrFail({
      where: { id: businessProduct.id },
      relations: { product: { category: true } },
    });
    await this.emitChanged(businessId, product.id);
    return saved;
  }

  async updateBusinessProduct(
    businessId: string,
    productId: string,
    dto: UpdateBusinessProductDto,
  ) {
    const businessProduct = await this.businessProductRepo.findOne({
      where: { businessId, productId },
      relations: { product: true },
    });

    if (!businessProduct) {
      throw new NotFoundException('Product not found for this business');
    }

    const productPatch: Partial<Product> = {};
    if (dto.name) productPatch.namePt = dto.name;
    if (dto.description !== undefined) productPatch.descriptionPt = dto.description;
    if (dto.categoryId) productPatch.categoryId = dto.categoryId;
    if (dto.featured !== undefined) productPatch.featured = dto.featured;
    if (dto.imageSrc !== undefined) productPatch.imageSrc = dto.imageSrc;
    if (dto.prepStation !== undefined) productPatch.prepStation = dto.prepStation;

    if (Object.keys(productPatch).length > 0) {
      if (dto.categoryId) {
        const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
        if (!category) throw new NotFoundException('Category not found');
      }
      await this.productRepo.update(productId, productPatch);
    }

    const overlayPatch: Partial<BusinessProduct> = {};
    if (dto.priceBrl !== undefined) overlayPatch.priceBrl = dto.priceBrl;
    if (dto.isAvailable !== undefined) overlayPatch.isAvailable = dto.isAvailable;

    if (Object.keys(overlayPatch).length > 0) {
      await this.businessProductRepo.update(businessProduct.id, overlayPatch);
    }

    const saved = await this.businessProductRepo.findOneOrFail({
      where: { id: businessProduct.id },
      relations: { product: { category: true } },
    });
    await this.emitChanged(businessId, productId);
    return saved;
  }

  async saveProductImage(businessId: string, file: Express.Multer.File) {
    const ext = IMAGE_EXTENSIONS_BY_MIME_TYPE[file.mimetype] ?? '';
    const filename = `${randomUUID()}${ext}`;
    const dir = join(process.cwd(), 'uploads', 'products', businessId);

    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), file.buffer);

    const publicBaseUrl = (
      process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`
    ).replace(/\/+$/, '');

    return { url: `${publicBaseUrl}/uploads/products/${businessId}/${filename}` };
  }

  async removeBusinessProduct(businessId: string, productId: string) {
    const businessProduct = await this.businessProductRepo.findOne({
      where: { businessId, productId },
    });

    if (!businessProduct) {
      throw new NotFoundException('Product not found for this business');
    }

    await this.businessProductRepo.delete(businessProduct.id);
    await this.emitChanged(businessId, productId);
  }

  private async emitChanged(businessId: string, entityId: string) {
    await this.realtime?.notify(businessId, {
      type: 'catalog.changed',
      entityId,
    });
  }

  private toMenuItem(bp: BusinessProduct) {
    const prepStation =
      bp.product.prepStation ??
      bp.product.category.prepStation ??
      (KITCHEN_SLUGS.has(bp.product.category.slug)
        ? PrepStation.KITCHEN
        : PrepStation.BAR);

    return {
      id: bp.product.id,
      slug: bp.product.slug,
      category: bp.product.category.slug,
      categoryName: bp.product.category.namePt,
      categoryId: bp.product.categoryId,
      categoryPrepStation: bp.product.category.prepStation,
      prepStation,
      productPrepStation: bp.product.prepStation,
      name: bp.product.namePt,
      description: bp.product.descriptionPt,
      priceBrl: Number(bp.priceBrl),
      featured: bp.product.featured,
      imageSrc: bp.product.imageSrc,
      isAvailable: bp.isAvailable,
      businessProductId: bp.id,
    };
  }

  private async uniqueSlug(name: string) {
    const base =
      name
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'product';

    let slug = base;
    let n = 2;
    while (await this.productRepo.findOne({ where: { slug } })) {
      slug = `${base}-${n}`;
      n += 1;
    }
    return slug;
  }
}
