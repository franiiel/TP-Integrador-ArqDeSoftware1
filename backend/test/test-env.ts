// The only database the e2e tests may touch. Hardcoded on purpose: it never
// comes from .env, so a test run can't reach the development database.
export const TEST_DB = 'inspecciones_test';

export const testEnv = {
  POSTGRES_DB: TEST_DB,
  AUTH0_DOMAIN: 'test.auth0.local',
  AUTH0_AUDIENCE: 'https://inspecciones-obra/api',
};
