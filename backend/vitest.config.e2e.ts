import { defineConfig } from 'vitest/config';

// Not taken from .env: tests sign their own tokens and use their own database.
const testEnv = {
  POSTGRES_DB: 'inspecciones_test',
  AUTH0_DOMAIN: 'test.auth0.local',
  AUTH0_AUDIENCE: 'https://inspecciones-obra/api',
};
// `test.env` only reaches the workers; globalSetup runs in this process.
Object.assign(process.env, testEnv);

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    env: testEnv,
  },
});
