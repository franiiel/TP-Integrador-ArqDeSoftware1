# backend

API REST en NestJS, organizada como monolito modular (ADR-04). Persistencia en PostgreSQL con TypeORM.

Generado con Nest CLI 12 (TypeScript estricto).

```bash
pnpm start:dev   # API en modo desarrollo con recarga, http://localhost:3000
pnpm build       # compila a dist/
pnpm test        # tests unitarios (Vitest)
pnpm test:e2e    # tests end-to-end
pnpm lint        # oxlint
```

La API responde bajo `/api` y la documentación (Swagger) está en `http://localhost:3000/api/docs`. Swagger muestra el contrato `docs/openapi.yaml` tal cual, sin generarlo desde el código.

### Base de datos y migraciones

La conexión se configura en `src/data-source.ts` con las variables `POSTGRES_*` del `.env` de la raíz (`POSTGRES_HOST` es opcional, por defecto `localhost`). La usan tanto la aplicación como la CLI de TypeORM. `synchronize` está siempre desactivado: todo cambio de entidad lleva su migración (ADR-05).

```bash
pnpm migration:generate src/migrations/NombreDelCambio   # genera la migración a partir de las entidades
pnpm migration:run                                       # aplica las migraciones pendientes
pnpm migration:revert                                    # revierte la última
```

Los tests e2e levantan la aplicación completa, así que necesitan la base corriendo (`pnpm db:up`).

Módulos previstos (ver `docs/diagramas/c4-componentes-backend.mmd`):
`auth`, `usuarios`, `obras`, `inspecciones`, `actas`, `catalogos`, `integracion-expedientes` y `auditoria`.

El contrato de la API está en `docs/openapi.yaml` y la implementación debe respetarlo.
