# backend

API REST en NestJS, organizada como monolito modular (ADR-04). Persistencia en PostgreSQL con TypeORM.

> Pendiente: generar el proyecto con Nest CLI dentro de esta carpeta.

Módulos previstos (ver `docs/diagramas/c4-componentes-backend.mmd`):
`auth`, `usuarios`, `obras`, `inspecciones`, `actas`, `catalogos`, `integracion-expedientes` y `auditoria`.

El contrato de la API está en `docs/openapi.yaml` y la implementación debe respetarlo.
