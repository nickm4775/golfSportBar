import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { In } from 'typeorm';
import dataSource from './data-source';
import { PrepStation, RoleScope, UserKind } from '../shared/domain/enums';
import { Permission } from '../shared/infrastructure/database/entities/permission.entity';
import { Role } from '../shared/infrastructure/database/entities/role.entity';
import { RolePermission } from '../shared/infrastructure/database/entities/role-permission.entity';
import { ProductCategory } from '../shared/infrastructure/database/entities/product-category.entity';
import { Product } from '../shared/infrastructure/database/entities/product.entity';
import { User } from '../shared/infrastructure/database/entities/user.entity';
import { Organization } from '../shared/infrastructure/database/entities/organization.entity';
import { Business } from '../shared/infrastructure/database/entities/business.entity';
import { BusinessMember } from '../shared/infrastructure/database/entities/business-member.entity';
import { BusinessProduct } from '../shared/infrastructure/database/entities/business-product.entity';
import { GsproBay } from '../shared/infrastructure/database/entities/gspro-bay.entity';

type MenuCatalog = {
  categories: Array<{ slug: string; namePt: string; sortOrder: number }>;
  products: Array<{
    slug: string;
    categorySlug: string;
    namePt: string;
    descriptionPt: string;
    priceBrl: number;
    featured: boolean;
    imageSrc: string;
  }>;
  stores: Array<{
    slug: string;
    name: string;
    address: string;
    district: string;
    postalCode: string;
    city: string;
    state: string;
    country: string;
    lat: number;
    lng: number;
  }>;
};

export type { MenuCatalog };

const PERMISSIONS = [
  { key: 'business:read', description: 'Ver datos del negocio' },
  { key: 'business:write', description: 'Editar datos del negocio' },
  { key: 'members:read', description: 'Ver staff del negocio' },
  { key: 'members:write', description: 'Gestionar staff del negocio' },
  { key: 'catalog:read', description: 'Ver catálogo del negocio' },
  { key: 'catalog:write', description: 'Editar catálogo del negocio' },
  { key: 'orders:read', description: 'Ver pedidos' },
  { key: 'orders:create', description: 'Crear pedidos' },
  { key: 'orders:manage', description: 'Gestionar estados de pedidos' },
  { key: 'customers:read', description: 'Ver clientes' },
  { key: 'customers:write', description: 'Crear y editar clientes' },
  { key: 'gspro:bays:read', description: 'Ver bays GSPro' },
  { key: 'gspro:bays:write', description: 'Gestionar bays GSPro' },
  { key: 'gspro:reservations:read', description: 'Ver reservas GSPro' },
  { key: 'gspro:reservations:write', description: 'Crear/editar reservas GSPro' },
  { key: 'gspro:sessions:read', description: 'Ver sesiones GSPro' },
  { key: 'gspro:sessions:manage', description: 'Abrir/cerrar sesiones GSPro' },
];

const ROLE_DEFINITIONS = [
  {
    name: 'ADMIN',
    description: 'Administrador de plataforma con acceso total',
    scope: RoleScope.SYSTEM,
    permissions: PERMISSIONS.map((p) => p.key),
  },
  {
    name: 'OWNER',
    description: 'Dueño del negocio con acceso total',
    scope: RoleScope.BUSINESS,
    permissions: PERMISSIONS.map((p) => p.key),
  },
  {
    name: 'MANAGER',
    description: 'Gerente operativo del negocio',
    scope: RoleScope.BUSINESS,
    permissions: PERMISSIONS.map((p) => p.key),
  },
  {
    name: 'WAITER',
    description: 'Camarero - pedidos, caja, reservas y sesiones',
    scope: RoleScope.BUSINESS,
    permissions: [
      'orders:read',
      'orders:create',
      'orders:manage',
      'catalog:read',
      'customers:read',
      'customers:write',
      'gspro:bays:read',
      'gspro:reservations:read',
      'gspro:reservations:write',
      'gspro:sessions:read',
      'gspro:sessions:manage',
    ],
  },
  {
    name: 'COOK',
    description: 'Cocina - solo pedidos',
    scope: RoleScope.BUSINESS,
    permissions: ['orders:read'],
  },
  {
    name: 'BARTENDER',
    description: 'Barra - solo pedidos',
    scope: RoleScope.BUSINESS,
    permissions: ['orders:read'],
  },
];

/** Vacía todas las tablas de la app (respeta FKs) antes de sembrar. */
async function clearDatabase() {
  const tableNames = dataSource.entityMetadatas
    .map((meta) => `"${meta.tableName}"`)
    .join(', ');
  if (!tableNames) {
    throw new Error('No hay tablas para limpiar');
  }
  console.log('Limpiando base de datos...');
  await dataSource.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
  console.log('Base de datos vacía.');
}

async function seedPermissionsAndRoles() {
  const permissionRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const rolePermissionRepo = dataSource.getRepository(RolePermission);

  for (const permission of PERMISSIONS) {
    await permissionRepo.upsert(permission, ['key']);
  }

  for (const roleDef of ROLE_DEFINITIONS) {
    await roleRepo.upsert(
      {
        name: roleDef.name,
        description: roleDef.description,
        scope: roleDef.scope,
      },
      ['name'],
    );

    const role = await roleRepo.findOneByOrFail({ name: roleDef.name });

    for (const permissionKey of roleDef.permissions) {
      const permission = await permissionRepo.findOneByOrFail({ key: permissionKey });
      await rolePermissionRepo.upsert(
        { roleId: role.id, permissionId: permission.id },
        ['roleId', 'permissionId'],
      );
    }
  }
}

const KITCHEN_CATEGORY_BASES = new Set([
  'petiscos',
  'pizzas',
  'burgers',
  'sobremesas',
]);

function categoryPrepStation(slug: string): PrepStation {
  return KITCHEN_CATEGORY_BASES.has(slug) ? PrepStation.KITCHEN : PrepStation.BAR;
}

export async function seedCatalog(catalog: MenuCatalog) {
  const categoryRepo = dataSource.getRepository(ProductCategory);
  const productRepo = dataSource.getRepository(Product);
  const categoryMap = new Map<string, string>();

  for (const category of catalog.categories) {
    await categoryRepo.upsert(
      {
        slug: category.slug,
        namePt: category.namePt,
        sortOrder: category.sortOrder,
        prepStation: categoryPrepStation(category.slug),
      },
      ['slug'],
    );
    const row = await categoryRepo.findOneByOrFail({ slug: category.slug });
    categoryMap.set(category.slug, row.id);
  }

  for (const product of catalog.products) {
    const categoryId = categoryMap.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Categoría no encontrada para producto ${product.slug}`);
    }
    await productRepo.upsert(
      {
        slug: product.slug,
        categoryId,
        namePt: product.namePt,
        descriptionPt: product.descriptionPt,
        basePriceBrl: product.priceBrl,
        imageSrc: product.imageSrc,
        featured: product.featured,
      },
      ['slug'],
    );
  }
}

async function ensureUser(input: {
  email: string;
  name: string;
  password: string;
  kind?: UserKind;
}): Promise<User> {
  const userRepo = dataSource.getRepository(User);
  const passwordHash = await bcrypt.hash(input.password, 10);
  const kind = input.kind ?? UserKind.STAFF;
  const existing = await userRepo.findOne({ where: { email: input.email } });
  if (existing) {
    existing.name = input.name;
    existing.passwordHash = passwordHash;
    existing.kind = kind;
    existing.isActive = true;
    return userRepo.save(existing);
  }
  return userRepo.save({
    email: input.email,
    name: input.name,
    passwordHash,
    kind,
    isActive: true,
  });
}

/** Usuarios, organización, negocio, memberships, carta del local y 3 bays. */
async function seedCoreData(catalog: MenuCatalog) {
  const organizationRepo = dataSource.getRepository(Organization);
  const businessRepo = dataSource.getRepository(Business);
  const roleRepo = dataSource.getRepository(Role);
  const memberRepo = dataSource.getRepository(BusinessMember);
  const bayRepo = dataSource.getRepository(GsproBay);

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@folf.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? 'owner@folf.local';
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? 'Owner123!';
  const managerEmail = process.env.SEED_MANAGER_EMAIL ?? 'manager@folf.local';
  const managerPassword = process.env.SEED_MANAGER_PASSWORD ?? 'Manager123!';
  const waiterEmail = process.env.SEED_WAITER_EMAIL ?? 'waiter@folf.local';
  const waiterPassword = process.env.SEED_WAITER_PASSWORD ?? 'Waiter123!';
  const cookEmail = process.env.SEED_COOK_EMAIL ?? 'cook@folf.local';
  const cookPassword = process.env.SEED_COOK_PASSWORD ?? 'Cook123!';
  const bartenderEmail = process.env.SEED_BARTENDER_EMAIL ?? 'bartender@folf.local';
  const bartenderPassword = process.env.SEED_BARTENDER_PASSWORD ?? 'Bartender123!';
  const customerEmail = process.env.SEED_CUSTOMER_EMAIL ?? 'customer@folf.local';
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD ?? 'Customer123!';

  const admin = await ensureUser({
    email: adminEmail,
    name: 'Admin',
    password: adminPassword,
  });
  const owner = await ensureUser({
    email: ownerEmail,
    name: 'Owner',
    password: ownerPassword,
  });
  const manager = await ensureUser({
    email: managerEmail,
    name: 'Manager',
    password: managerPassword,
  });
  const waiter = await ensureUser({
    email: waiterEmail,
    name: 'Waiter',
    password: waiterPassword,
  });
  const cook = await ensureUser({
    email: cookEmail,
    name: 'Cook',
    password: cookPassword,
  });
  const bartender = await ensureUser({
    email: bartenderEmail,
    name: 'Bartender',
    password: bartenderPassword,
  });
  await ensureUser({
    email: customerEmail,
    name: 'Customer',
    password: customerPassword,
    kind: UserKind.CUSTOMER,
  });

  await organizationRepo.save({
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Golf Sport Bar',
    ownerId: admin.id,
  });
  const organization = await organizationRepo.findOneByOrFail({
    id: '00000000-0000-4000-8000-000000000001',
  });

  const store = catalog.stores[0];
  await businessRepo.save({
    organizationId: organization.id,
    slug: store?.slug ?? 'bc-centro',
    name: store?.name ?? 'Golf Sport Bar — Centro BC',
    address: store?.address ?? 'R. 3600, N205',
    district: store?.district,
    postalCode: store?.postalCode,
    city: store?.city ?? 'Balneário Camboriú',
    state: store?.state ?? 'SC',
    country: store?.country ?? 'Brasil',
    lat: store?.lat,
    lng: store?.lng,
  });
  const business = await businessRepo.findOneByOrFail({
    slug: store?.slug ?? 'bc-centro',
  });

  const adminRole = await roleRepo.findOneByOrFail({ name: 'ADMIN' });
  const ownerRole = await roleRepo.findOneByOrFail({ name: 'OWNER' });
  const managerRole = await roleRepo.findOneByOrFail({ name: 'MANAGER' });
  const waiterRole = await roleRepo.findOneByOrFail({ name: 'WAITER' });
  const cookRole = await roleRepo.findOneByOrFail({ name: 'COOK' });
  const bartenderRole = await roleRepo.findOneByOrFail({ name: 'BARTENDER' });

  await memberRepo.save([
    { businessId: business.id, userId: admin.id, roleId: adminRole.id, isActive: true },
    { businessId: business.id, userId: owner.id, roleId: ownerRole.id, isActive: true },
    { businessId: business.id, userId: manager.id, roleId: managerRole.id, isActive: true },
    { businessId: business.id, userId: waiter.id, roleId: waiterRole.id, isActive: true },
    { businessId: business.id, userId: cook.id, roleId: cookRole.id, isActive: true },
    { businessId: business.id, userId: bartender.id, roleId: bartenderRole.id, isActive: true },
  ]);

  await linkCatalogToBusiness(business.id, catalog);

  await bayRepo.save([
    { businessId: business.id, code: 'BAY-1', name: 'Bay 1', isActive: true },
    { businessId: business.id, code: 'BAY-2', name: 'Bay 2', isActive: true },
    { businessId: business.id, code: 'BAY-3', name: 'Bay 3', isActive: true },
  ]);
}

export async function linkCatalogToBusiness(businessId: string, catalog: MenuCatalog) {
  const productRepo = dataSource.getRepository(Product);
  const businessProductRepo = dataSource.getRepository(BusinessProduct);
  const slugs = catalog.products.map((product) => product.slug);
  if (slugs.length === 0) return [];

  const products = await productRepo.find({ where: { slug: In(slugs) } });
  for (const product of products) {
    await businessProductRepo.save({
      businessId,
      productId: product.id,
      priceBrl: product.basePriceBrl,
      isAvailable: true,
    });
  }
  return products;
}

async function main() {
  await dataSource.initialize();
  const catalogPath = join(__dirname, 'seed', 'menu-catalog.json');
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as MenuCatalog;

  await clearDatabase();
  await seedPermissionsAndRoles();
  await seedCatalog(catalog);
  await seedCoreData(catalog);

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@folf.local';
  const waiterEmail = process.env.SEED_WAITER_EMAIL ?? 'waiter@folf.local';
  const cookEmail = process.env.SEED_COOK_EMAIL ?? 'cook@folf.local';
  const bartenderEmail = process.env.SEED_BARTENDER_EMAIL ?? 'bartender@folf.local';
  const customerEmail = process.env.SEED_CUSTOMER_EMAIL ?? 'customer@folf.local';
  console.log('Seed completed successfully (users + business + menu + 3 bays)');
  console.log(`Admin user: ${adminEmail}`);
  console.log(`Waiter user: ${waiterEmail}`);
  console.log(`Cook user: ${cookEmail}`);
  console.log(`Bartender user: ${bartenderEmail}`);
  console.log(`Customer (folf-app): ${customerEmail}`);
  await dataSource.destroy();
}

if (require.main === module) {
  main().catch(async (error) => {
    console.error(error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  });
}
