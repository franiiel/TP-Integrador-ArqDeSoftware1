import { execSync } from 'node:child_process';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { TEST_DB } from './test-env.js';

// Recreates the test database from the compiled migrations, so every run starts empty.
// Every connection names TEST_DB explicitly: nothing here depends on POSTGRES_DB.
export default async function setup() {
  // TypeORM loads migrations with a plain import(), which can't read .ts with decorators.
  execSync('pnpm build', { stdio: 'inherit' });
  const ruta = '../dist/data-source.js';
  const { dataSourceOptions } = (await import(ruta)) as {
    dataSourceOptions: DataSourceOptions;
  };

  const admin = new DataSource({
    ...dataSourceOptions,
    database: 'postgres',
    entities: [],
    migrations: [],
  });
  await admin.initialize();
  await admin.query(`DROP DATABASE IF EXISTS "${TEST_DB}"`);
  await admin.query(`CREATE DATABASE "${TEST_DB}"`);
  await admin.destroy();

  const test = new DataSource({ ...dataSourceOptions, database: TEST_DB });
  await test.initialize();
  await test.runMigrations();
  await test.destroy();
}
