import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGsproPartyPricing1730000008000 implements MigrationInterface {
  name = 'AddGsproPartyPricing1730000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "gspro_reservations"
      ADD COLUMN IF NOT EXISTS "companion_count" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "gspro_reservations"
      ADD COLUMN IF NOT EXISTS "unit_price_brl" numeric(10,2) NOT NULL DEFAULT 180
    `);
    await queryRunner.query(`
      ALTER TABLE "gspro_reservations"
      ADD COLUMN IF NOT EXISTS "total_cost_brl" numeric(10,2) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "gspro_sessions"
      ADD COLUMN IF NOT EXISTS "companion_count" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "gspro_sessions"
      ADD COLUMN IF NOT EXISTS "unit_price_brl" numeric(10,2) NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "gspro_sessions"
      ADD COLUMN IF NOT EXISTS "total_cost_brl" numeric(10,2) NULL
    `);

    // Recalcular totales de reservas existentes (1 persona × 180 × horas planificadas)
    await queryRunner.query(`
      UPDATE "gspro_reservations"
      SET
        "companion_count" = 0,
        "unit_price_brl" = 180,
        "total_cost_brl" = ROUND(
          180 * GREATEST(
            EXTRACT(EPOCH FROM ("end_at" - "start_at")) / 3600.0,
            1.0 / 60.0
          )::numeric,
          2
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "gspro_sessions" DROP COLUMN IF EXISTS "total_cost_brl"`);
    await queryRunner.query(`ALTER TABLE "gspro_sessions" DROP COLUMN IF EXISTS "unit_price_brl"`);
    await queryRunner.query(`ALTER TABLE "gspro_sessions" DROP COLUMN IF EXISTS "companion_count"`);
    await queryRunner.query(`ALTER TABLE "gspro_reservations" DROP COLUMN IF EXISTS "total_cost_brl"`);
    await queryRunner.query(`ALTER TABLE "gspro_reservations" DROP COLUMN IF EXISTS "unit_price_brl"`);
    await queryRunner.query(`ALTER TABLE "gspro_reservations" DROP COLUMN IF EXISTS "companion_count"`);
  }
}
