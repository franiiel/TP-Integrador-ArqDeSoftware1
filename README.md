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
| `docs/adr/` | Registros de decisiones de arquitectura (ADR-01 a ADR-05) |
| `docs/evidencias/` | Evidencia de la verificación de los NFR |

## Primeros pasos

Para desplegar solo hace falta Docker. Para desarrollar, además, Node 24 y pnpm 10.

```bash
git clone https://github.com/franiiel/TP-Integrador-ArqDeSoftware1.git inspecciones-obra
cd inspecciones-obra
cp .env.example .env          # completar valores
docker compose up --build -d  # levanta todo el sistema
```

| Servicio | URL |
|---|---|
| Aplicación (PWA) | http://localhost:4200 |
| API y Swagger | http://localhost:3000/api/docs |
| Simulador SOAP | http://localhost:8080/expedientes |

En el `.env` hacen falta como mínimo `POSTGRES_PASSWORD`, `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` y los `sub` de Auth0 de los usuarios de prueba (`SEED_INSPECTOR_AUTH0_ID`, `SEED_SUPERVISOR_AUTH0_ID` y `SEED_ADMINISTRATIVO_AUTH0_ID`). Auth0 es un servicio externo y queda fuera del compose; su configuración está en [backend/README.md](backend/README.md).

## Usuarios de prueba

Cuentas demo de Auth0 (ingresar con usuario y contraseña en la pantalla de login). Cada una tiene su rol asignado en Auth0 y su fila en la tabla `usuarios`, que carga la semilla.

| Rol | Usuario | Contraseña | Qué puede hacer |
|---|---|---|---|
| Inspector | `inspector.demo@inspecciones.test` | `InspectorDemo2026` | Ver sus inspecciones y emitir actas (caso de uso mínimo) |
| Supervisor | `supervisor.demo@inspecciones.test` | `SupervisorDemo2026` | Ingresa y ve "Sin acceso": sus pantallas quedan solo diseñadas |
| Administrativo | `administrativo.demo@inspecciones.test` | `AdministrativoDemo2026` | Ingresa y ve "Sin acceso": sus pantallas quedan solo diseñadas |

## Datos y volúmenes

Al arrancar, el backend corre las migraciones y carga los datos semilla. Si ya están aplicadas o cargadas, no hace nada. La base vive en el volumen `db-data` y las fotos de las actas en el volumen `fotos`. `docker compose down` baja todo y conserva los datos.

Para desarrollar sin contenedores, `pnpm db:up` levanta solo PostgreSQL y cada parte se corre con su propio comando (ver el README de cada carpeta). Antes hay que bajar el compose completo, porque usa los mismos puertos. `pnpm openapi:lint` valida el contrato de la API.

Para trabajar en el repo (personas o agentes de código), leer [AGENTS.md](AGENTS.md).
