import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The only database the e2e tests may touch. Hardcoded on purpose: it never
// comes from .env, so a test run can't reach the development database.
export const TEST_DB = 'inspecciones_test';

// Outside the repository; recreated on every run.
export const TEST_FOTOS_DIR = join(tmpdir(), 'inspecciones-obra-e2e-fotos');

export const testEnv = {
  POSTGRES_DB: TEST_DB,
  FOTOS_DIR: TEST_FOTOS_DIR,
  AUTH0_DOMAIN: 'test.auth0.local',
  AUTH0_AUDIENCE: 'https://inspecciones-obra/api',
};
