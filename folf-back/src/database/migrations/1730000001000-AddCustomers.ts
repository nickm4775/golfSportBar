import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomers1730000001000 implements MigrationInterface {
  name = 'AddCustomers1730000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "UserKind" AS ENUM ('STAFF', 'CUSTOMER')`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "kind" "UserKind" NOT NULL DEFAULT 'STAFF'`,
    );
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "full_name" TEXT NOT NULL,
        "cpf" VARCHAR(11) NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "birth_date" DATE NOT NULL,
        "postal_code" TEXT,
        "street" TEXT,
        "street_number" TEXT,
        "complement" TEXT,
        "district" TEXT,
        "city" TEXT,
        "state" TEXT,
        "lgpd_accepted_at" TIMESTAMP(3) NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "customers_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "customers_user_id_key" UNIQUE ("user_id"),
        CONSTRAINT "customers_cpf_key" UNIQUE ("cpf"),
        CONSTRAINT "customers_email_key" UNIQUE ("email"),
        CONSTRAINT "customers_phone_key" UNIQUE ("phone")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD CONSTRAINT "customers_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN "customer_id" uuid`);
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD CONSTRAINT "orders_customer_id_fkey"
      FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(
      `ALTER TABLE "gspro_reservations" ADD COLUMN "customer_id" uuid`,
    );
    await queryRunner.query(`
      ALTER TABLE "gspro_reservations"
      ADD CONSTRAINT "gspro_reservations_customer_id_fkey"
      FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      INSERT INTO "permissions" ("key", "description")
      VALUES
        ('customers:read', 'Ver clientes'),
        ('customers:write', 'Crear y editar clientes')
      ON CONFLICT ("key") DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE p.key IN ('customers:read', 'customers:write')
        AND r.name IN ('ADMIN', 'OWNER', 'MANAGER', 'STAFF')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "role_permissions" WHERE "permission_id" IN (SELECT id FROM "permissions" WHERE key IN ('customers:read', 'customers:write'))`,
    );
    await queryRunner.query(
      `DELETE FROM "permissions" WHERE key IN ('customers:read', 'customers:write')`,
    );
    await queryRunner.query(
      `ALTER TABLE "gspro_reservations" DROP CONSTRAINT "gspro_reservations_customer_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gspro_reservations" DROP COLUMN "customer_id"`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_fkey"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "customer_id"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "customers_user_id_fkey"`);
    await queryRunner.query(`DROP TABLE "customers"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "kind"`);
    await queryRunner.query(`DROP TYPE "UserKind"`);
  }
}
