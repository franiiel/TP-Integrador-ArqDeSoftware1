# Inspecciones de obra municipales

Trabajo práctico de Arquitectura de Software (UNAHUR) · Escenario **2A · Municipio chico**.

Sistema para que los inspectores de la Dirección de Obras Particulares labren actas de inspección desde sus celulares, incluso con cortes de señal, y que queden asociadas al expediente del sistema municipal (SOAP).

**Integrantes:** Cejas Olson Vanina, Cerantonio Franco, Ponce Maite

## Stack

Angular (PWA) · NestJS · PostgreSQL · TypeORM · Auth0 · pnpm

## Estructura

| Carpeta | Contenido |
|---|---|
| `frontend/` | PWA Angular |
| `backend/` | API NestJS (monolito modular) |
| `simulador-soap/` | Simulación del sistema municipal de expedientes |
| `docs/openapi.yaml` | Contrato de la API |
| `docs/diagramas/` | Fuentes Mermaid de los diagramas |

## Primeros pasos

Requisitos: Node 24, pnpm 10 y Docker.

```bash
cp .env.example .env   # completar valores
pnpm db:up             # levanta PostgreSQL
pnpm openapi:lint      # valida el contrato de la API
```

Para trabajar en el repo (personas o agentes de código), leer [AGENTS.md](AGENTS.md).
