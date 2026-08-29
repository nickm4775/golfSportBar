import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { In } from 'typeorm';
import dataSource from './data-source';
import {
  OrderItemStatus,
  OrderStatus,
  ReservationStatus,
  RoleScope,
  UserKind,
} from '../shared/domain/enums';
import { Permission } from '../shared/infrastructure/database/entities/permission.entity';
import { Role } from '../shared/infrastructure/database/entities/role.entity';
import { RolePermission } from '../shared/infrastructure/database/entities/role-permission.entity';
import { ProductCategory } from '../shared/infrastructure/database/entities/product-category.entity';
import { PrepStation } from '../shared/domain/enums';
import { Product } from '../shared/infrastructure/database/entities/product.entity';
import { User } from '../shared/infrastructure/database/entities/user.entity';
import { Organization } from '../shared/infrastructure/database/entities/organization.entity';
import { Business } from '../shared/infrastructure/database/entities/business.entity';
import { BusinessMember } from '../shared/infrastructure/database/entities/business-member.entity';
import { BusinessProduct } from '../shared/infrastructure/database/entities/business-product.entity';
import { GsproBay } from '../shared/infrastructure/database/entities/gspro-bay.entity';
import { Order } from '../shared/infrastructure/database/entities/order.entity';
import { OrderItem } from '../shared/infrastructure/database/entities/order-item.entity';
import { GsproReservation } from '../shared/infrastructure/database/entities/gspro-reservation.entity';
import { Customer } from '../shared/infrastructure/database/entities/customer.entity';

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

async function seedPermissionsAndRoles() {
  const permissionRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const rolePermissionRepo = dataSource.getRepository(RolePermission);

  const removedPermissions = await permissionRepo.find({
    where: { key: In(['warehouse:read', 'warehouse:write']) },
  });
  if (removedPermissions.length > 0) {
    const permissionIds = removedPermissions.map((permission) => permission.id);
    await rolePermissionRepo.delete({ permissionId: In(permissionIds) });
    await permissionRepo.delete({ id: In(permissionIds) });
  }

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

    const allowedPermissions = await permissionRepo.find({
      where: { key: In(roleDef.permissions) },
    });
    const allowedIds = new Set(allowedPermissions.map((permission) => permission.id));
    const currentLinks = await rolePermissionRepo.find({ where: { roleId: role.id } });
    for (const link of currentLinks) {
      if (!allowedIds.has(link.permissionId)) {
        await rolePermissionRepo.delete({
          roleId: role.id,
          permissionId: link.permissionId,
        });
      }
    }
  }

  const legacyRoles = ['STAFF', 'KITCHEN', 'BAR'];
  for (const legacyName of legacyRoles) {
    const legacyRole = await roleRepo.findOneBy({ name: legacyName });
    if (!legacyRole) continue;
    await rolePermissionRepo.delete({ roleId: legacyRole.id });
    await roleRepo.delete({ id: legacyRole.id });
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
        ...category,
        prepStation: categoryPrepStation(category.slug),
      },
      ['slug'],
    );
    const row = await categoryRepo.findOneByOrFail({ slug: category.slug });
    categoryMap.set(category.slug, row.id);
  }

  for (const product of catalog.products) {
    const categoryId = categoryMap.get(product.categorySlug);
    if (!categoryId) continue;

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

async function seedDemoData(catalog: MenuCatalog) {
  const userRepo = dataSource.getRepository(User);
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

  await userRepo.upsert(
    {
      email: adminEmail,
      name: 'Admin',
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
    ['email'],
  );
  const admin = await userRepo.findOneByOrFail({ email: adminEmail });

  await userRepo.upsert(
    {
      email: ownerEmail,
      name: 'Owner Demo',
      passwordHash: await bcrypt.hash(ownerPassword, 10),
    },
    ['email'],
  );
  const owner = await userRepo.findOneByOrFail({ email: ownerEmail });

  await userRepo.upsert(
    {
      email: managerEmail,
      name: 'Manager Demo',
      passwordHash: await bcrypt.hash(managerPassword, 10),
    },
    ['email'],
  );
  const manager = await userRepo.findOneByOrFail({ email: managerEmail });

  await userRepo.upsert(
    {
      email: waiterEmail,
      name: 'Waiter Demo',
      passwordHash: await bcrypt.hash(waiterPassword, 10),
    },
    ['email'],
  );
  const waiter = await userRepo.findOneByOrFail({ email: waiterEmail });

  await userRepo.upsert(
    {
      email: cookEmail,
      name: 'Cook Demo',
      passwordHash: await bcrypt.hash(cookPassword, 10),
    },
    ['email'],
  );
  const cook = await userRepo.findOneByOrFail({ email: cookEmail });

  await userRepo.upsert(
    {
      email: bartenderEmail,
      name: 'Bartender Demo',
      passwordHash: await bcrypt.hash(bartenderPassword, 10),
    },
    ['email'],
  );
  const bartender = await userRepo.findOneByOrFail({ email: bartenderEmail });

  await userRepo.upsert(
    {
      email: customerEmail,
      name: 'Ana Souza',
      passwordHash: await bcrypt.hash(customerPassword, 10),
      kind: UserKind.CUSTOMER,
    },
    ['email'],
  );
  const customerUser = await userRepo.findOneByOrFail({ email: customerEmail });

  await organizationRepo.upsert(
    {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'FOLF Demo Org',
      ownerId: admin.id,
    },
    ['id'],
  );
  const organization = await organizationRepo.findOneByOrFail({
    id: '00000000-0000-4000-8000-000000000001',
  });

  const store = catalog.stores[0];
  await businessRepo.upsert(
    {
      organizationId: organization.id,
      slug: store?.slug ?? 'bc-centro',
      name: store?.name ?? 'FOLF BC Centro',
      address: store?.address ?? 'R. 3600, 235',
      district: store?.district,
      postalCode: store?.postalCode,
      city: store?.city ?? 'Balneário Camboriú',
      state: store?.state ?? 'SC',
      country: store?.country ?? 'Brasil',
      lat: store?.lat,
      lng: store?.lng,
    },
    ['slug'],
  );
  const business = await businessRepo.findOneByOrFail({
    slug: store?.slug ?? 'bc-centro',
  });

  const adminRole = await roleRepo.findOneByOrFail({ name: 'ADMIN' });
  const ownerRole = await roleRepo.findOneByOrFail({ name: 'OWNER' });
  const managerRole = await roleRepo.findOneByOrFail({ name: 'MANAGER' });
  const waiterRole = await roleRepo.findOneByOrFail({ name: 'WAITER' });
  const cookRole = await roleRepo.findOneByOrFail({ name: 'COOK' });
  const bartenderRole = await roleRepo.findOneByOrFail({ name: 'BARTENDER' });

  await memberRepo.upsert(
    { businessId: business.id, userId: admin.id, roleId: adminRole.id, isActive: true },
    ['businessId', 'userId'],
  );
  await memberRepo.upsert(
    { businessId: business.id, userId: owner.id, roleId: ownerRole.id, isActive: true },
    ['businessId', 'userId'],
  );
  await memberRepo.upsert(
    { businessId: business.id, userId: manager.id, roleId: managerRole.id, isActive: true },
    ['businessId', 'userId'],
  );
  await memberRepo.upsert(
    { businessId: business.id, userId: waiter.id, roleId: waiterRole.id, isActive: true },
    ['businessId', 'userId'],
  );
  await memberRepo.upsert(
    { businessId: business.id, userId: cook.id, roleId: cookRole.id, isActive: true },
    ['businessId', 'userId'],
  );
  await memberRepo.upsert(
    { businessId: business.id, userId: bartender.id, roleId: bartenderRole.id, isActive: true },
    ['businessId', 'userId'],
  );

  const products = await linkCatalogToBusiness(business.id, catalog);

  const bays = [
    { code: 'BAY-1', name: 'Bay 1' },
    { code: 'BAY-2', name: 'Bay 2' },
    { code: 'BAY-3', name: 'Bay 3' },
  ];

  for (const bay of bays) {
    await bayRepo.upsert(
      { businessId: business.id, code: bay.code, name: bay.name, isActive: true },
      ['businessId', 'code'],
    );
  }

  const customers = await seedDemoCustomers(customerUser);

  await seedDemoOrders(business.id, waiter.id, products, customers);
  await seedDemoReservations(business.id, customers);
}

export async function linkCatalogToBusiness(businessId: string, catalog: MenuCatalog) {
  const productRepo = dataSource.getRepository(Product);
  const businessProductRepo = dataSource.getRepository(BusinessProduct);
  const slugs = catalog.products.map((product) => product.slug);
  if (slugs.length === 0) return [];

  const products = await productRepo.find({ where: { slug: In(slugs) } });
  for (const product of products) {
    await businessProductRepo.upsert(
      {
        businessId,
        productId: product.id,
        priceBrl: product.basePriceBrl,
        isAvailable: true,
      },
      ['businessId', 'productId'],
    );
  }
  return products;
}

async function seedDemoCustomers(appUser: User) {
  const customerRepo = dataSource.getRepository(Customer);
  const demos = [
    {
      fullName: 'Ana Souza',
      cpf: '52998224725',
      email: appUser.email,
      phone: '5547999110011',
      birthDate: '1994-03-12',
      city: 'Balneário Camboriú',
      state: 'SC',
      userId: appUser.id,
    },
    {
      fullName: 'Carlos Lima',
      cpf: '39053344705',
      email: 'carlos.lima@mail.com',
      phone: '5547999220022',
      birthDate: '1988-11-02',
      city: 'Itajaí',
      state: 'SC',
    },
    {
      fullName: 'Marina Costa',
      cpf: '11144477735',
      email: 'marina.costa@mail.com',
      phone: '5547999330033',
      birthDate: '1999-07-21',
      city: 'Balneário Camboriú',
      state: 'SC',
    },
  ];

  for (const demo of demos) {
    await customerRepo.upsert(
      {
        ...demo,
        lgpdAcceptedAt: new Date(),
        isActive: true,
      },
      ['cpf'],
    );
  }

  return customerRepo.find({ order: { fullName: 'ASC' } });
}

async function seedDemoOrders(
  businessId: string,
  createdById: string,
  products: Product[],
  customers: Customer[],
) {
  const orderRepo = dataSource.getRepository(Order);
  const itemRepo = dataSource.getRepository(OrderItem);

  const existing = await orderRepo.count({ where: { businessId } });
  if (existing > 0 || products.length === 0) return;

  const now = new Date();
  const scenarios: Array<{
    daysAgo: number;
    tableLabel: string;
    status: OrderStatus;
    itemCount: number;
  }> = [
    { daysAgo: 0, tableLabel: 'Mesa 1', status: OrderStatus.OPEN, itemCount: 2 },
    { daysAgo: 0, tableLabel: 'Mesa 4', status: OrderStatus.IN_PROGRESS, itemCount: 3 },
    { daysAgo: 0, tableLabel: 'Bay 2', status: OrderStatus.COMPLETED, itemCount: 2 },
    { daysAgo: 1, tableLabel: 'Mesa 3', status: OrderStatus.COMPLETED, itemCount: 4 },
    { daysAgo: 1, tableLabel: 'Mesa 6', status: OrderStatus.COMPLETED, itemCount: 2 },
    { daysAgo: 2, tableLabel: 'Mesa 2', status: OrderStatus.COMPLETED, itemCount: 3 },
    { daysAgo: 3, tableLabel: 'Mesa 5', status: OrderStatus.CANCELLED, itemCount: 1 },
    { daysAgo: 4, tableLabel: 'Bay 1', status: OrderStatus.COMPLETED, itemCount: 5 },
    { daysAgo: 5, tableLabel: 'Mesa 1', status: OrderStatus.COMPLETED, itemCount: 2 },
    { daysAgo: 6, tableLabel: 'Mesa 8', status: OrderStatus.COMPLETED, itemCount: 3 },
    { daysAgo: 8, tableLabel: 'Mesa 4', status: OrderStatus.COMPLETED, itemCount: 2 },
    { daysAgo: 10, tableLabel: 'Bay 3', status: OrderStatus.COMPLETED, itemCount: 4 },
    { daysAgo: 12, tableLabel: 'Mesa 2', status: OrderStatus.COMPLETED, itemCount: 1 },
    { daysAgo: 13, tableLabel: 'Mesa 7', status: OrderStatus.COMPLETED, itemCount: 3 },
  ];

  for (const [index, scenario] of scenarios.entries()) {
    const createdAt = new Date(now);
    createdAt.setUTCDate(createdAt.getUTCDate() - scenario.daysAgo);
    createdAt.setUTCHours(18 + (index % 4), (index * 11) % 60, 0, 0);

    const selected = products.slice(index % products.length, (index % products.length) + scenario.itemCount);
    const items = (selected.length ? selected : products.slice(0, scenario.itemCount)).map(
      (product, itemIndex) => ({
        product,
        quantity: 1 + (itemIndex % 2),
      }),
    );
    const totalBrl = items.reduce(
      (sum, item) => sum + Number(item.product.basePriceBrl) * item.quantity,
      0,
    );

    const order = await orderRepo.save({
      businessId,
      createdById,
      customerId: customers.length ? customers[index % customers.length].id : null,
      tableLabel: scenario.tableLabel,
      status: scenario.status,
      totalBrl: scenario.status === OrderStatus.CANCELLED ? 0 : totalBrl,
      createdAt,
      updatedAt: createdAt,
    });

    for (const item of items) {
      const itemStatus =
        scenario.status === OrderStatus.COMPLETED
          ? OrderItemStatus.SERVED
          : scenario.status === OrderStatus.CANCELLED
            ? OrderItemStatus.CANCELLED
            : scenario.status === OrderStatus.IN_PROGRESS
              ? OrderItemStatus.PREPARING
              : OrderItemStatus.PENDING;

      await itemRepo.save({
        orderId: order.id,
        productId: item.product.id,
        quantity: item.quantity,
        unitPriceBrl: item.product.basePriceBrl,
        status: itemStatus,
        createdAt,
        updatedAt: createdAt,
      });
    }
  }
}

async function seedDemoReservations(businessId: string, customers: Customer[]) {
  const bayRepo = dataSource.getRepository(GsproBay);
  const reservationRepo = dataSource.getRepository(GsproReservation);
  const bays = await bayRepo.find({ where: { businessId }, order: { code: 'ASC' } });
  if (bays.length === 0 || customers.length === 0) return;

  const existing = await reservationRepo.count({ where: { businessId } });
  if (existing > 0) return;

  const today = new Date();
  today.setUTCHours(20, 0, 0, 0);
  const later = new Date(today);
  later.setUTCHours(21, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setUTCHours(22, 0, 0, 0);

  const ana = customers.find((customer) => customer.cpf === '52998224725') ?? customers[0];
  const carlos = customers.find((customer) => customer.cpf === '39053344705') ?? customers[1] ?? customers[0];

  await reservationRepo.save([
    {
      businessId,
      bayId: bays[0].id,
      customerId: ana.id,
      customerName: ana.fullName,
      customerPhone: ana.phone,
      startAt: today,
      endAt: later,
      status: ReservationStatus.CONFIRMED,
    },
    {
      businessId,
      bayId: bays[1]?.id ?? bays[0].id,
      customerId: carlos.id,
      customerName: carlos.fullName,
      customerPhone: carlos.phone,
      startAt: tomorrow,
      endAt: tomorrowEnd,
      status: ReservationStatus.PENDING,
    },
  ]);
}

async function main() {
  await dataSource.initialize();
  const catalogPath = join(__dirname, 'seed', 'menu-catalog.json');
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as MenuCatalog;

  await seedPermissionsAndRoles();
  await seedCatalog(catalog);
  await seedDemoData(catalog);

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@folf.local';
  const waiterEmail = process.env.SEED_WAITER_EMAIL ?? 'waiter@folf.local';
  const cookEmail = process.env.SEED_COOK_EMAIL ?? 'cook@folf.local';
  const bartenderEmail = process.env.SEED_BARTENDER_EMAIL ?? 'bartender@folf.local';
  const customerEmail = process.env.SEED_CUSTOMER_EMAIL ?? 'customer@folf.local';
  console.log('Seed completed successfully');
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
