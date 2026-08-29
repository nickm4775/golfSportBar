import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReservationCompleted1730000002000 implements MigrationInterface {
  name = 'ReservationCompleted1730000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.replaceReservationStatusEnum(queryRunner, [
      'PENDING',
      'CONFIRMED',
      'CHECKED_IN',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
    ]);
    await queryRunner.query(`
      UPDATE "gspro_reservations" AS r
      SET "status" = 'COMPLETED'
      FROM "gspro_sessions" AS s
      WHERE s.reservation_id = r.id
        AND s.status = 'COMPLETED'
        AND r.status = 'CHECKED_IN'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "gspro_reservations"
      SET "status" = 'CHECKED_IN'
      WHERE "status" = 'COMPLETED'
    `);
    await this.replaceReservationStatusEnum(queryRunner, [
      'PENDING',
      'CONFIRMED',
      'CHECKED_IN',
      'CANCELLED',
      'NO_SHOW',
    ]);
  }

  private async replaceReservationStatusEnum(
    queryRunner: QueryRunner,
    values: string[],
  ) {
    const enumSql = values.map((value) => `'${value}'`).join(', ');
    await queryRunner.query(
      `ALTER TABLE "gspro_reservations" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "ReservationStatus" RENAME TO "ReservationStatus_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "ReservationStatus" AS ENUM (${enumSql})`,
    );
    await queryRunner.query(`
      ALTER TABLE "gspro_reservations"
      ALTER COLUMN "status" TYPE "ReservationStatus"
      USING "status"::text::"ReservationStatus"
    `);
    await queryRunner.query(
      `ALTER TABLE "gspro_reservations" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(`DROP TYPE "ReservationStatus_old"`);
  }
}
