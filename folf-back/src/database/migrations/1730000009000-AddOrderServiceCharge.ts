import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderServiceCharge1730000009000 implements MigrationInterface {
  name = 'AddOrderServiceCharge1730000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "include_service_charge" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "service_charge_brl" numeric(10,2) NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders" DROP COLUMN IF EXISTS "service_charge_brl"
    `);
    await queryRunner.query(`
      ALTER TABLE "orders" DROP COLUMN IF EXISTS "include_service_charge"
    `);
  }
}
