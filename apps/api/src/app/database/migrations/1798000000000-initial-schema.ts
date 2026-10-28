import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1798000000000 implements MigrationInterface {
  name = 'InitialSchema1798000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "members" ("id" int NOT NULL IDENTITY(1,1), "createdAt" datetime2 NOT NULL CONSTRAINT "DF_12d2c4a4f7ac9472f51610b2f71" DEFAULT getdate(), "updatedAt" datetime2 NOT NULL CONSTRAINT "DF_3aa4c8c63867c680ea06368b2fd" DEFAULT getdate(), "name" nvarchar(100) NOT NULL, "email" nvarchar(150) NOT NULL, "role" nvarchar(100), "isActive" bit NOT NULL CONSTRAINT "DF_85d6263be6a57c16ad8b6c5ea60" DEFAULT 1, CONSTRAINT "PK_28b53062261b996d9c99fa12404" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2714af51e3f7dd42cf66eeb08d" ON "members" ("email")`,
    );
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" int NOT NULL IDENTITY(1,1), "createdAt" datetime2 NOT NULL CONSTRAINT "DF_10f8a3df60c9e7771cefba6c35b" DEFAULT getdate(), "updatedAt" datetime2 NOT NULL CONSTRAINT "DF_955b728d4ffcea6f051a341946d" DEFAULT getdate(), "projectId" int NOT NULL, "title" nvarchar(200) NOT NULL, "description" nvarchar(MAX), "status" nvarchar(20) CONSTRAINT CHK_f1ba046df02609aecdf4abe6da_ENUM CHECK(status IN ('TODO','IN_PROGRESS','IN_REVIEW','BLOCKED','DONE')) NOT NULL CONSTRAINT "DF_6086c8dafbae729a930c04d8651" DEFAULT 'TODO', "priority" nvarchar(20) CONSTRAINT CHK_3fafc52a6019a45ce26d8e955a_ENUM CHECK(priority IN ('LOW','MEDIUM','HIGH','CRITICAL')) NOT NULL CONSTRAINT "DF_bd213ab7fa55f02309c5f23bbc3" DEFAULT 'MEDIUM', "startDate" date NOT NULL, "dueDate" date NOT NULL, "progress" int NOT NULL CONSTRAINT "DF_9892cddd7cc095150685bc426ae" DEFAULT 0, "estimatedHours" decimal(8,2), "assigneeId" int, "completedAt" datetime2, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e08fca67ca8966e6b9914bf295" ON "tasks" ("projectId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6086c8dafbae729a930c04d865" ON "tasks" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c300d154a85801889174e92a3d" ON "tasks" ("dueDate")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a16d2c86252529f622fa53f1e" ON "tasks" ("assigneeId")`,
    );
    await queryRunner.query(
      `CREATE TABLE "projects" ("id" int NOT NULL IDENTITY(1,1), "createdAt" datetime2 NOT NULL CONSTRAINT "DF_4a38e9851744414bbe8142157f4" DEFAULT getdate(), "updatedAt" datetime2 NOT NULL CONSTRAINT "DF_7ac9a109e2afca520ed60ea5e00" DEFAULT getdate(), "code" nvarchar(20) NOT NULL, "name" nvarchar(150) NOT NULL, "description" nvarchar(MAX), "client" nvarchar(150), "status" nvarchar(20) CONSTRAINT CHK_e5636b3c474904a1e5e8ef9a03_ENUM CHECK(status IN ('NOT_STARTED','PLANNING','IN_PROGRESS','ON_HOLD','COMPLETED','CANCELLED')) NOT NULL CONSTRAINT "DF_a27865a7be17886e3088f4a6509" DEFAULT 'NOT_STARTED', "priority" nvarchar(20) CONSTRAINT CHK_34f6b6e928a9574d012b01d5ac_ENUM CHECK(priority IN ('LOW','MEDIUM','HIGH','CRITICAL')) NOT NULL CONSTRAINT "DF_bbcce409ce9ab4d8c65b0c89299" DEFAULT 'MEDIUM', "startDate" date NOT NULL, "endDate" date NOT NULL, "managerId" int, CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d95a87318392465ab663a32cc4" ON "projects" ("code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a27865a7be17886e3088f4a650" ON "projects" ("status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_239dec66b26610938a98a7b7bd3" FOREIGN KEY ("managerId") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_239dec66b26610938a98a7b7bd3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_a27865a7be17886e3088f4a650" ON "projects"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_d95a87318392465ab663a32cc4" ON "projects"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_9a16d2c86252529f622fa53f1e" ON "tasks"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_c300d154a85801889174e92a3d" ON "tasks"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_6086c8dafbae729a930c04d865" ON "tasks"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_e08fca67ca8966e6b9914bf295" ON "tasks"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_2714af51e3f7dd42cf66eeb08d" ON "members"`,
    );
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TABLE "members"`);
  }
}
