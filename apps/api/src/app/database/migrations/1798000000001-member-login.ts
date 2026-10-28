import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds sign-in to team members: the old free-text `role` column becomes
 * `jobTitle` (data kept), and `role` now holds the access level.
 */
export class MemberLogin1798000000001 implements MigrationInterface {
  name = 'MemberLogin1798000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`EXEC sp_rename 'members.role', 'jobTitle', 'COLUMN'`);
    await queryRunner.query(
      `ALTER TABLE "members" ADD "passwordHash" nvarchar(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "members" ADD "role" nvarchar(20) CONSTRAINT CHK_d6846f064f2e7aa0d426879ca7_ENUM CHECK(role IN ('MANAGER','USER')) NOT NULL CONSTRAINT "DF_accd93971fb3c5cd788335d0159" DEFAULT 'USER'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "members" DROP CONSTRAINT "DF_accd93971fb3c5cd788335d0159"`,
    );
    await queryRunner.query(
      `ALTER TABLE "members" DROP CONSTRAINT "CHK_d6846f064f2e7aa0d426879ca7_ENUM"`,
    );
    await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "role"`);
    await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "passwordHash"`);
    await queryRunner.query(`EXEC sp_rename 'members.jobTitle', 'role', 'COLUMN'`);
  }
}
