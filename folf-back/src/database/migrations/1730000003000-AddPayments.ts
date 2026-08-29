import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayments1730000003000 implements MigrationInterface {
  name = 'AddPayments1730000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CASH')`,
    );
    await queryRunner.query(
      `CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "PaymentProvider" AS ENUM ('MERCADOPAGO')`,
    );
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "business_id" uuid NOT NULL,
        "order_id" uuid NOT NULL,
        "method" "PaymentMethod" NOT NULL,
        "status" "PaymentStatus" NOT NULL,
        "amount_brl" DECIMAL(10,2) NOT NULL,
        "cash_received_brl" DECIMAL(10,2),
        "change_brl" DECIMAL(10,2),
        "provider" "PaymentProvider",
        "provider_payment_id" TEXT,
        "qr_code" TEXT,
        "expires_at" TIMESTAMPTZ,
        "paid_at" TIMESTAMPTZ,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_business_id" ON "payments" ("business_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_order_id" ON "payments" ("order_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_provider_payment_id" ON "payments" ("provider_payment_id")`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_payments_pending_pix_order"
      ON "payments" ("order_id")
      WHERE "status" = 'PENDING' AND "method" = 'PIX'
    `);
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_business"
      FOREIGN KEY ("business_id") REFERENCES "businesses"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_order"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_business"`,
    );
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "PaymentProvider"`);
    await queryRunner.query(`DROP TYPE "PaymentStatus"`);
    await queryRunner.query(`DROP TYPE "PaymentMethod"`);
  }
}
