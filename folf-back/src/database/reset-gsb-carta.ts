import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Not } from 'typeorm';
import dataSource from './data-source';
import { linkCatalogToBusiness, seedCatalog, type MenuCatalog } from './seed';
import { Business } from '../shared/infrastructure/database/entities/business.entity';
import { BusinessProduct } from '../shared/infrastructure/database/entities/business-product.entity';
import { Customer } from '../shared/infrastructure/database/entities/customer.entity';
import { GsproReservation } from '../shared/infrastructure/database/entities/gspro-reservation.entity';
import { GsproSession } from '../shared/infrastructure/database/entities/gspro-session.entity';
import { Order } from '../shared/infrastructure/database/entities/order.entity';
import { OrderItem } from '../shared/infrastructure/database/entities/order-item.entity';
import { Organization } from '../shared/infrastructure/database/entities/organization.entity';
import { Payment } from '../shared/infrastructure/database/entities/payment.entity';
import { PrintJob } from '../shared/infrastructure/database/entities/print-job.entity';
import { Product } from '../shared/infrastructure/database/entities/product.entity';
import { ProductCategory } from '../shared/infrastructure/database/entities/product-category.entity';
import { User } from '../shared/infrastructure/database/entities/user.entity';

const GSB_SLUG = 'bc-centro';

async function wipeTransactional() {
  const printJobRepo = dataSource.getRepository(PrintJob);
  const paymentRepo = dataSource.getRepository(Payment);
  const orderItemRepo = dataSource.getRepository(OrderItem);
  const orderRepo = dataSource.getRepository(Order);
  const sessionRepo = dataSource.getRepository(GsproSession);
  const reservationRepo = dataSource.getRepository(GsproReservation);
  const customerRepo = dataSource.getRepository(Customer);

  await printJobRepo.createQueryBuilder().delete().execute();
  await paymentRepo.createQueryBuilder().delete().execute();
  await orderItemRepo.createQueryBuilder().delete().execute();
  await orderRepo.createQueryBuilder().delete().execute();
  await sessionRepo.createQueryBuilder().delete().execute();
  await reservationRepo.createQueryBuilder().delete().execute();
  await customerRepo.createQueryBuilder().delete().execute();
}

async function wipeOtherBusinesses(keepBusinessId: string, keepOrganizationId: string) {
  const businessRepo = dataSource.getRepository(Business);
  const organizationRepo = dataSource.getRepository(Organization);

  await businessRepo.delete({ id: Not(keepBusinessId) });

  const remainingOrgs = await organizationRepo.find();
  for (const org of remainingOrgs) {
    if (org.id === keepOrganizationId) continue;
    const count = await businessRepo.count({ where: { organizationId: org.id } });
    if (count === 0) {
      await organizationRepo.delete({ id: org.id });
    }
  }
}

async function wipeCatalog() {
  const businessProductRepo = dataSource.getRepository(BusinessProduct);
  const productRepo = dataSource.getRepository(Product);
  const categoryRepo = dataSource.getRepository(ProductCategory);

  await businessProductRepo.createQueryBuilder().delete().execute();
  await productRepo.createQueryBuilder().delete().execute();
  await categoryRepo.createQueryBuilder().delete().execute();
}

async function main() {
  await dataSource.initialize();

  const catalogPath = join(__dirname, 'seed', 'menu-catalog.json');
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as MenuCatalog;

  const businessRepo = dataSource.getRepository(Business);
  const userRepo = dataSource.getRepository(User);
  const businessProductRepo = dataSource.getRepository(BusinessProduct);
  const orderRepo = dataSource.getRepository(Order);

  const usersBefore = await userRepo.count();
  const gsb = await businessRepo.findOneBy({ slug: GSB_SLUG });
  if (!gsb) {
    throw new Error(`Business with slug "${GSB_SLUG}" not found — aborting reset`);
  }

  console.log(`Keeping business ${gsb.name} (${gsb.slug}) id=${gsb.id}`);
  console.log(`Users before: ${usersBefore}`);

  await wipeTransactional();
  console.log('Wiped transactional data (orders, payments, reservations, customers, print jobs)');

  await wipeOtherBusinesses(gsb.id, gsb.organizationId);
  console.log('Removed other businesses and orphan organizations');

  await wipeCatalog();
  console.log('Cleared product catalog');

  await seedCatalog(catalog);
  const linked = await linkCatalogToBusiness(gsb.id, catalog);
  console.log(`Imported ${catalog.products.length} products, linked ${linked.length} to ${GSB_SLUG}`);

  const businesses = await businessRepo.count();
  const productsLinked = await businessProductRepo.count({ where: { businessId: gsb.id } });
  const orders = await orderRepo.count();
  const usersAfter = await userRepo.count();

  console.log('--- verification ---');
  console.log(`businesses: ${businesses} (expected 1)`);
  console.log(`business_products for GSB: ${productsLinked}`);
  console.log(`orders: ${orders} (expected 0)`);
  console.log(`users: ${usersAfter} (before ${usersBefore})`);

  if (businesses !== 1 || orders !== 0 || usersAfter !== usersBefore) {
    throw new Error('Post-reset verification failed');
  }

  await dataSource.destroy();
  console.log('Reset + carta import completed successfully');
}

main().catch(async (error) => {
  console.error(error);
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
  process.exit(1);
});
