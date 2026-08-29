import { MigrationInterface, QueryRunner } from 'typeorm';

const OPERATIONAL_ROLE_PERMISSIONS: Record<string, string[]> = {
  WAITER: [
    'orders:read',
    'orders:create',
    'orders:manage',
    'catalog:read',
    'customers:read',
    'customers:write',
    'gspro:bays:read',
    'gspro:reservations:read',
    'gspro:reservations:write',
    'gspro:sessions:read',
    'gspro:sessions:manage',
  ],
  COOK: ['orders:read'],
  BARTENDER: ['orders:read'],
};

const LEGACY_ROLE_MAP: Record<string, string> = {
  STAFF: 'WAITER',
  KITCHEN: 'COOK',
  BAR: 'BARTENDER',
};

export class RenameOperationalRoles1730000006000 implements MigrationInterface {
  name = 'RenameOperationalRoles1730000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [name, permissions] of Object.entries(OPERATIONAL_ROLE_PERMISSIONS)) {
      const description =
        name === 'WAITER'
          ? 'Camarero - pedidos, caja, reservas y sesiones'
          : name === 'COOK'
            ? 'Cocina - solo pedidos'
            : 'Barra - solo pedidos';

      await queryRunner.query(
        `
        INSERT INTO "roles" ("name", "description", "scope")
        VALUES ($1, $2, 'BUSINESS')
        ON CONFLICT ("name") DO UPDATE
        SET "description" = EXCLUDED."description", "scope" = EXCLUDED."scope"
        `,
        [name, description],
      );

      await queryRunner.query(
        `
        DELETE FROM "role_permissions"
        WHERE "role_id" = (SELECT "id" FROM "roles" WHERE "name" = $1)
        `,
        [name],
      );

      for (const permissionKey of permissions) {
        await queryRunner.query(
          `
          INSERT INTO "role_permissions" ("role_id", "permission_id")
          SELECT r.id, p.id
          FROM "roles" r
          CROSS JOIN "permissions" p
          WHERE r.name = $1 AND p.key = $2
          ON CONFLICT ("role_id", "permission_id") DO NOTHING
          `,
          [name, permissionKey],
        );
      }
    }

    for (const [legacyName, newName] of Object.entries(LEGACY_ROLE_MAP)) {
      await queryRunner.query(
        `
        UPDATE "business_members" bm
        SET "role_id" = (SELECT "id" FROM "roles" WHERE "name" = $2)
        WHERE bm."role_id" = (SELECT "id" FROM "roles" WHERE "name" = $1)
        `,
        [legacyName, newName],
      );

      await queryRunner.query(
        `
        DELETE FROM "role_permissions"
        WHERE "role_id" = (SELECT "id" FROM "roles" WHERE "name" = $1)
        `,
        [legacyName],
      );

      await queryRunner.query(`DELETE FROM "roles" WHERE "name" = $1`, [legacyName]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const legacyRoles = [
      {
        name: 'STAFF',
        description: 'Personal operativo',
        permissions: OPERATIONAL_ROLE_PERMISSIONS.WAITER,
      },
      {
        name: 'KITCHEN',
        description: 'Cocina - gestión de ítems de comida',
        permissions: OPERATIONAL_ROLE_PERMISSIONS.COOK,
      },
      {
        name: 'BAR',
        description: 'Barra - gestión de bebidas',
        permissions: OPERATIONAL_ROLE_PERMISSIONS.BARTENDER,
      },
    ];

    for (const role of legacyRoles) {
      await queryRunner.query(
        `
        INSERT INTO "roles" ("name", "description", "scope")
        VALUES ($1, $2, 'BUSINESS')
        ON CONFLICT ("name") DO UPDATE
        SET "description" = EXCLUDED."description", "scope" = EXCLUDED."scope"
        `,
        [role.name, role.description],
      );

      await queryRunner.query(
        `
        DELETE FROM "role_permissions"
        WHERE "role_id" = (SELECT "id" FROM "roles" WHERE "name" = $1)
        `,
        [role.name],
      );

      for (const permissionKey of role.permissions) {
        await queryRunner.query(
          `
          INSERT INTO "role_permissions" ("role_id", "permission_id")
          SELECT r.id, p.id
          FROM "roles" r
          CROSS JOIN "permissions" p
          WHERE r.name = $1 AND p.key = $2
          ON CONFLICT ("role_id", "permission_id") DO NOTHING
          `,
          [role.name, permissionKey],
        );
      }
    }

    const reverseMap: Record<string, string> = {
      WAITER: 'STAFF',
      COOK: 'KITCHEN',
      BARTENDER: 'BAR',
    };

    for (const [newName, legacyName] of Object.entries(reverseMap)) {
      await queryRunner.query(
        `
        UPDATE "business_members" bm
        SET "role_id" = (SELECT "id" FROM "roles" WHERE "name" = $2)
        WHERE bm."role_id" = (SELECT "id" FROM "roles" WHERE "name" = $1)
        `,
        [newName, legacyName],
      );

      await queryRunner.query(
        `
        DELETE FROM "role_permissions"
        WHERE "role_id" = (SELECT "id" FROM "roles" WHERE "name" = $1)
        `,
        [newName],
      );

      await queryRunner.query(`DELETE FROM "roles" WHERE "name" = $1`, [newName]);
    }
  }
}
