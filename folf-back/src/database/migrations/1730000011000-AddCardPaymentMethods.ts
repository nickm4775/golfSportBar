import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCardPaymentMethods1730000011000 implements MigrationInterface {
  name = 'AddCardPaymentMethods1730000011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CREDIT_CARD'`,
    );
    await queryRunner.query(
      `ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'DEBIT_CARD'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres cannot drop enum values; card payments may already reference them.
  }
}
