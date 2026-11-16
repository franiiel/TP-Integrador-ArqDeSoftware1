import { INestApplication, VersioningType } from '@nestjs/common';
import { ProblemDetailsFilter } from './problem-details.filter.js';

// Shared by main.ts and the e2e tests, so both run the same HTTP setup.
export function configurarApp<T extends INestApplication>(app: T): T {
  app.setGlobalPrefix('api');
  // Major version in the URL (/api/v1). A breaking change adds @Version('2')
  // to the affected controller; everything else keeps answering on v1.
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalFilters(new ProblemDetailsFilter());
  return app;
}
