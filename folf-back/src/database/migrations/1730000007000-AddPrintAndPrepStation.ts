import { MigrationInterface, QueryRunner } from 'typeorm';

const KITCHEN_SLUGS = ['petiscos', 'pizzas', 'burgers', 'sobremesas'];

export class AddPrintAndPrepStation1730000007000 implements MigrationInterface {
  name = 'AddPrintAndPrepStation1730000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "prep_station_enum" AS ENUM ('KITCHEN', 'BAR');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "product_categories"
      ADD COLUMN IF NOT EXISTS "prep_station" character varying NOT NULL DEFAULT 'BAR'
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "prep_station" character varying NULL
    `);

    for (const slug of KITCHEN_SLUGS) {
      await queryRunner.query(
        `UPDATE "product_categories" SET "prep_station" = 'KITCHEN' WHERE "slug" = $1`,
        [slug],
      );
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "business_print_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "business_id" uuid NOT NULL UNIQUE,
        "print_execution_mode" character varying NOT NULL DEFAULT 'AGENT',
        "agent_last_seen_at" TIMESTAMPTZ NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "fk_business_print_settings_business"
          FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "business_printers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "business_id" uuid NOT NULL,
        "station" character varying NOT NULL,
        "name" character varying NOT NULL DEFAULT '',
        "host" character varying NULL,
        "port" integer NOT NULL DEFAULT 9100,
        "enabled" boolean NOT NULL DEFAULT true,
        "paper_width" integer NOT NULL DEFAULT 80,
        "connection_status" character varying NOT NULL DEFAULT 'UNKNOWN',
        "last_seen_at" TIMESTAMPTZ NULL,
        "last_error" text NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_business_printers_business_station" UNIQUE ("business_id", "station"),
        CONSTRAINT "fk_business_printers_business"
          FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "print_jobs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "business_id" uuid NOT NULL,
        "order_id" uuid NULL,
        "station" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'PENDING',
        "payload" jsonb NOT NULL,
        "error_message" text NULL,
        "executed_by" character varying NULL,
        "printed_at" TIMESTAMPTZ NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "fk_print_jobs_business"
          FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_print_jobs_order"
          FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_print_jobs_business_status"
      ON "print_jobs" ("business_id", "status")
    `);

    await queryRunner.query(`
      INSERT INTO "business_print_settings" ("business_id", "print_execution_mode")
      SELECT b."id", 'AGENT' FROM "businesses" b
      WHERE NOT EXISTS (
        SELECT 1 FROM "business_print_settings" s WHERE s."business_id" = b."id"
      )
    `);

    for (const station of ['KITCHEN', 'BAR']) {
      await queryRunner.query(
        `
        INSERT INTO "business_printers" ("business_id", "station", "name")
        SELECT b."id", $1::character varying, $2::character varying FROM "businesses" b
        WHERE NOT EXISTS (
          SELECT 1 FROM "business_printers" p
          WHERE p."business_id" = b."id" AND p."station" = $1::character varying
        )
        `,
        [station, station === 'KITCHEN' ? 'Cocina' : 'Bar'],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "print_jobs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "business_printers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "business_print_settings"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "prep_station"`);
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP COLUMN IF EXISTS "prep_station"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "prep_station_enum"`);
  }
}
