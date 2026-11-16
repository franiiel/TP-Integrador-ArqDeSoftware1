import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { parse } from 'yaml';
import { AppModule } from './app.module.js';
import { configurarApp } from './configurar-app.js';

async function bootstrap() {
  const app = configurarApp(await NestFactory.create(AppModule));

  // Design-first: the docs serve the contract itself, not one generated from decorators.
  const contrato = parse(
    readFileSync(join(import.meta.dirname, '../../docs/openapi.yaml'), 'utf8'),
  ) as OpenAPIObject;
  SwaggerModule.setup('api/docs', app, contrato);

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
