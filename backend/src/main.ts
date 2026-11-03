import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { parse } from 'yaml';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Design-first: the docs serve the contract itself, not one generated from decorators.
  const contrato = parse(
    readFileSync(join(import.meta.dirname, '../../docs/openapi.yaml'), 'utf8'),
  ) as OpenAPIObject;
  SwaggerModule.setup('api/docs', app, contrato);

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
