import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DataSource, DataSourceOptions, DefaultNamingStrategy } from 'typeorm';

// Loaded here (not in main.ts) because the TypeORM CLI imports this file directly.
const envFile = join(import.meta.dirname, '../../.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

export const snakeCase = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();

class SnakeNamingStrategy extends DefaultNamingStrategy {
  columnName(propertyName: string, customName: string, prefixes: string[]) {
    return customName ?? snakeCase([...prefixes, propertyName].join('_'));
  }
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER ?? 'inspecciones',
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB ?? 'inspecciones',
  entities: [join(import.meta.dirname, '**/*.entity.js')],
  migrations: [join(import.meta.dirname, 'migrations/*.js')],
  synchronize: false,
  namingStrategy: new SnakeNamingStrategy(),
  uuidExtension: 'pgcrypto',
};

export default new DataSource(dataSourceOptions);
