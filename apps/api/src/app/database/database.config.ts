import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as mssql from 'mssql';
import { MemberEntity } from '../members/member.entity';
import { ProjectEntity } from '../projects/project.entity';
import { TaskEntity } from '../tasks/task.entity';
import { migrations } from './migrations';

export const entities = [MemberEntity, ProjectEntity, TaskEntity];

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes'].includes(value.toLowerCase());
}

export function connectionSettings(config: ConfigService) {
  return {
    host: config.get<string>('DB_HOST', 'localhost'),
    port: Number(config.get<string>('DB_PORT', '1433')),
    username: config.get<string>('DB_USER', 'sa'),
    password: config.get<string>('DB_PASSWORD', ''),
    database: config.get<string>('DB_NAME', 'ProjectManagement'),
    encrypt: bool(config.get('DB_ENCRYPT'), false),
    trustServerCertificate: bool(
      config.get('DB_TRUST_SERVER_CERTIFICATE'),
      true,
    ),
  };
}

/** Creates the database on first start so a fresh SQL Server works out of the box. */
async function ensureDatabase(config: ConfigService) {
  const s = connectionSettings(config);
  const pool = await new mssql.ConnectionPool({
    server: s.host,
    port: s.port,
    user: s.username,
    password: s.password,
    database: 'master',
    options: {
      encrypt: s.encrypt,
      trustServerCertificate: s.trustServerCertificate,
    },
  }).connect();
  try {
    const result = await pool
      .request()
      .input('name', mssql.NVarChar, s.database)
      .query('SELECT database_id FROM sys.databases WHERE name = @name');
    if (result.recordset.length === 0) {
      Logger.log(`Creating database [${s.database}]`, 'Database');
      await pool
        .request()
        .batch(`CREATE DATABASE [${s.database.replace(/]/g, ']]')}]`);
    }
  } finally {
    await pool.close();
  }
}

export async function typeOrmOptions(
  config: ConfigService,
): Promise<TypeOrmModuleOptions> {
  if (bool(config.get('DB_CREATE_DATABASE'), true)) {
    await ensureDatabase(config);
  }
  const s = connectionSettings(config);
  return {
    type: 'mssql',
    host: s.host,
    port: s.port,
    username: s.username,
    password: s.password,
    database: s.database,
    options: {
      encrypt: s.encrypt,
      trustServerCertificate: s.trustServerCertificate,
    },
    entities,
    migrations,
    migrationsRun: bool(config.get('DB_MIGRATIONS_RUN'), true),
    synchronize: bool(config.get('DB_SYNCHRONIZE'), false),
    logging: bool(config.get('DB_LOGGING'), false),
  };
}
