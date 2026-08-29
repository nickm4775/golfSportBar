import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWarehouses1730000004000 implements MigrationInterface {
  name = 'AddWarehouses1730000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "warehouses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "business_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "notes" TEXT,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_warehouses_business_id" ON "warehouses" ("business_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "warehouses"
      ADD CONSTRAINT "FK_warehouses_business"
      FOREIGN KEY ("business_id") REFERENCES "businesses"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "warehouse_outbounds" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "business_id" uuid NOT NULL,
        "warehouse_id" uuid NOT NULL,
        "order_id" uuid,
        "notes" TEXT,
        "created_by_id" uuid NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "warehouse_outbounds_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_warehouse_outbounds_business_created"
       ON "warehouse_outbounds" ("business_id", "created_at")`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_warehouse_outbounds_order_id"
      ON "warehouse_outbounds" ("order_id")
      WHERE "order_id" IS NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "warehouse_outbounds"
      ADD CONSTRAINT "FK_warehouse_outbounds_business"
      FOREIGN KEY ("business_id") REFERENCES "businesses"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "warehouse_outbounds"
      ADD CONSTRAINT "FK_warehouse_outbounds_warehouse"
      FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "warehouse_outbounds"
      ADD CONSTRAINT "FK_warehouse_outbounds_order"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "warehouse_outbounds"
      ADD CONSTRAINT "FK_warehouse_outbounds_created_by"
      FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "warehouse_outbound_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "outbound_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "quantity" INTEGER NOT NULL,
        "notes" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "warehouse_outbound_items_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_warehouse_outbound_items_outbound_id"
       ON "warehouse_outbound_items" ("outbound_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "warehouse_outbound_items"
      ADD CONSTRAINT "FK_warehouse_outbound_items_outbound"
      FOREIGN KEY ("outbound_id") REFERENCES "warehouse_outbounds"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "warehouse_outbound_items"
      ADD CONSTRAINT "FK_warehouse_outbound_items_product"
      FOREIGN KEY ("product_id") REFERENCES "products"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "warehouse_outbound_items" DROP CONSTRAINT "FK_warehouse_outbound_items_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "warehouse_outbound_items" DROP CONSTRAINT "FK_warehouse_outbound_items_outbound"`,
    );
    await queryRunner.query(`DROP TABLE "warehouse_outbound_items"`);

    await queryRunner.query(
      `ALTER TABLE "warehouse_outbounds" DROP CONSTRAINT "FK_warehouse_outbounds_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "warehouse_outbounds" DROP CONSTRAINT "FK_warehouse_outbounds_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "warehouse_outbounds" DROP CONSTRAINT "FK_warehouse_outbounds_warehouse"`,
    );
    await queryRunner.query(
      `ALTER TABLE "warehouse_outbounds" DROP CONSTRAINT "FK_warehouse_outbounds_business"`,
    );
    await queryRunner.query(`DROP TABLE "warehouse_outbounds"`);

    await queryRunner.query(
      `ALTER TABLE "warehouses" DROP CONSTRAINT "FK_warehouses_business"`,
    );
    await queryRunner.query(`DROP TABLE "warehouses"`);
  }
}
