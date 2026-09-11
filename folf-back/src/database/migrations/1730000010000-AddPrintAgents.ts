import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrintAgents1730000010000 implements MigrationInterface {
  name = 'AddPrintAgents1730000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "print_agents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "business_id" uuid NOT NULL,
        "device_id" character varying NOT NULL,
        "device_name" character varying NOT NULL DEFAULT '',
        "platform" character varying NOT NULL DEFAULT '',
        "token_hash" character varying NOT NULL,
        "last_seen_at" TIMESTAMPTZ NULL,
        "revoked_at" TIMESTAMPTZ NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_print_agents_device_id" UNIQUE ("device_id"),
        CONSTRAINT "fk_print_agents_business"
          FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "print_agent_pairing_codes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "business_id" uuid NOT NULL,
        "code" character varying(6) NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "used_at" TIMESTAMPTZ NULL,
        "created_by_user_id" uuid NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "fk_print_agent_pairing_codes_business"
          FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_print_agent_pairing_codes_user"
          FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_print_agent_pairing_codes_business_code"
      ON "print_agent_pairing_codes" ("business_id", "code")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "agent_printers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "business_id" uuid NOT NULL,
        "agent_id" uuid NOT NULL,
        "name" character varying NOT NULL DEFAULT '',
        "connection_type" character varying NOT NULL DEFAULT 'network',
        "address" character varying NOT NULL,
        "paper_width" integer NOT NULL DEFAULT 80,
        "is_online" boolean NOT NULL DEFAULT true,
        "last_seen_at" TIMESTAMPTZ NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_agent_printers_agent_address" UNIQUE ("agent_id", "address"),
        CONSTRAINT "fk_agent_printers_business"
          FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_agent_printers_agent"
          FOREIGN KEY ("agent_id") REFERENCES "print_agents"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "business_printers"
      ADD COLUMN IF NOT EXISTS "agent_printer_id" uuid NULL
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "business_printers"
        ADD CONSTRAINT "fk_business_printers_agent_printer"
          FOREIGN KEY ("agent_printer_id") REFERENCES "agent_printers"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "print_jobs"
      ADD COLUMN IF NOT EXISTS "printer_id" uuid NULL,
      ADD COLUMN IF NOT EXISTS "claimed_by_agent_id" uuid NULL,
      ADD COLUMN IF NOT EXISTS "claimed_at" TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS "attempts" integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "print_jobs"
        ADD CONSTRAINT "fk_print_jobs_agent_printer"
          FOREIGN KEY ("printer_id") REFERENCES "agent_printers"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "print_jobs"
        ADD CONSTRAINT "fk_print_jobs_claimed_by_agent"
          FOREIGN KEY ("claimed_by_agent_id") REFERENCES "print_agents"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "print_jobs" DROP CONSTRAINT IF EXISTS "fk_print_jobs_claimed_by_agent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "print_jobs" DROP CONSTRAINT IF EXISTS "fk_print_jobs_agent_printer"`,
    );
    await queryRunner.query(`
      ALTER TABLE "print_jobs"
      DROP COLUMN IF EXISTS "attempts",
      DROP COLUMN IF EXISTS "claimed_at",
      DROP COLUMN IF EXISTS "claimed_by_agent_id",
      DROP COLUMN IF EXISTS "printer_id"
    `);
    await queryRunner.query(
      `ALTER TABLE "business_printers" DROP CONSTRAINT IF EXISTS "fk_business_printers_agent_printer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_printers" DROP COLUMN IF EXISTS "agent_printer_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "agent_printers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "print_agent_pairing_codes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "print_agents"`);
  }
}
