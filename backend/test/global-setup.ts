import { execSync } from 'node:child_process';
import type { DataSource, DataSourceOptions } from 'typeorm';

// Recreates the test database from the compiled migrations, so every run starts empty.
export default async function setup() {
  const database = process.env.POSTGRES_DB;
  if (!database?.endsWith('_test')) {
    throw new Error(
      `Se niega a recrear la base "${database}": no termina en _test`,
    );
  }

  // TypeORM loads migrations with a plain import(), which can't read .ts with decorators.
  execSync('pnpm build', { stdio: 'inherit' });
  const ruta = '../dist/data-source.js';
  const { default: dataSource, dataSourceOptions } = (await import(ruta)) as {
    default: DataSource;
    dataSourceOptions: DataSourceOptions;
  };

  const { DataSource: Conexion } = await import('typeorm');
  const admin = new Conexion({
    ...dataSourceOptions,
    database: 'postgres',
    entities: [],
    migrations: [],
  });
  await admin.initialize();
  await admin.query(`DROP DATABASE IF EXISTS "${database}"`);
  await admin.query(`CREATE DATABASE "${database}"`);
  await admin.destroy();

  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
}
