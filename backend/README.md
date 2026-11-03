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

Módulos previstos (ver `docs/diagramas/c4-componentes-backend.mmd`):
`auth`, `usuarios`, `obras`, `inspecciones`, `actas`, `catalogos`, `integracion-expedientes` y `auditoria`.

El contrato de la API está en `docs/openapi.yaml` y la implementación debe respetarlo.
