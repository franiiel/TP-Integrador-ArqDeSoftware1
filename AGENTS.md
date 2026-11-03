# AGENTS.md

Guía para agentes de código (y personas) que trabajen en este repositorio. Leela completa antes de hacer cambios.

## Qué es este proyecto

Trabajo práctico de **Arquitectura de Software** (UNAHUR). Sistema de **inspecciones de obra municipales**, escenario **2A · Municipio chico**.

La Dirección de Obras Particulares tiene inspectores que recorren obras y labran **actas** con observaciones, fotos y, si corresponde, intimaciones o clausuras. Las actas tienen **valor legal** y deben quedar asociadas a un expediente del **sistema municipal de expedientes**, que no se puede modificar y solo expone servicios **SOAP**.

Lo que se evalúa es la **arquitectura**: que las decisiones estén justificadas y que la implementación refleje lo diseñado. No se busca cantidad de funcionalidades.

### Condiciones del escenario (guían todas las decisiones)

- 4 inspectores, ~15 inspecciones por día, un único supervisor.
- Los inspectores usan **sus propios celulares, de cualquier marca y sistema**.
- Hay **cortes de señal de pocos minutos**.
- Lo mantiene **un único desarrollador** municipal.
- Corre en **un único servidor** del municipio.
- Atributos prioritarios: **mantenibilidad y simplicidad**.

Ante la duda entre dos soluciones, elegí la más simple que cumpla. No agregues colas de mensajería, microservicios, cachés distribuidas ni infraestructura extra.

## Alcance de la implementación

Se diseña el sistema completo, pero **solo se implementa**:

1. **Inicio de sesión** (Auth0).
2. **Caso de uso mínimo:** un inspector completa un acta y queda asociada al expediente.

El objetivo del código es **demostrar las decisiones de arquitectura**, no cubrir todo el dominio. El NFR estrella es la simplicidad: implementar de más contradice el escenario.

### Qué se implementa

- Login con Auth0 (Google) y control de acceso por rol.
- Lista de las inspecciones asignadas al inspector.
- Formulario del acta: ítems de control, observaciones, fotos con la cámara, ubicación opcional, notificado y medidas.
- Guardado offline en el celular y reenvío automático al recuperar la señal (es la restricción central del escenario).
- Recepción idempotente del acta en el backend y numeración correlativa por año.
- Asociación al expediente a través del simulador SOAP.

### Qué queda solo diseñado (no implementar)

- Asignación de inspecciones, revisión, rectificación y anulación de actas.
- Pantallas de supervisor y administrativo.
- Alta de obras y expedientes: se resuelve con **datos semilla**.
- Hashes de integridad y registro de auditoría: se documentan en un ADR, no se programan.
- Sincronización en segundo plano con la app cerrada (Background Sync): alcanza con reintentar mientras la app está abierta.

Si una tarea parece requerir algo de esta lista, frená y preguntá antes de implementarlo.

## Stack

| Parte | Tecnología |
|---|---|
| Frontend | Angular como **PWA** (`@angular/pwa`) |
| Backend | NestJS (monolito modular) |
| Base de datos | PostgreSQL 18 |
| ORM | TypeORM |
| Autenticación | Auth0 (OIDC), login con cuenta de Google |
| Sistema externo | Simulador SOAP del sistema de expedientes |
| Gestor de paquetes | **pnpm** (workspaces). No uses npm ni yarn. |
| Node | 24 (ver `.nvmrc`) |

## Estructura del repositorio

```
frontend/          PWA Angular
backend/           API NestJS
simulador-soap/    Simulación del sistema municipal de expedientes
docs/
  openapi.yaml     Contrato de la API (diseño primero)
  diagramas/       Fuentes Mermaid de los diagramas del documento de arquitectura
docker-compose.yml Servicios de desarrollo (por ahora, PostgreSQL)
```

`frontend/`, `backend/` y `simulador-soap/` todavía no tienen proyecto generado: cada uno tiene un README con lo previsto.

## Comandos

```bash
cp .env.example .env     # completar valores
pnpm db:up               # levanta PostgreSQL
pnpm db:down             # baja los servicios
pnpm openapi:lint        # valida docs/openapi.yaml
pnpm openapi:preview     # documentación navegable de la API
```

## Reglas de arquitectura

### Backend: monolito modular (ADR-04)

Una sola aplicación NestJS, un solo proceso, una sola base de datos, organizada en módulos por área de negocio:

| Módulo | Responsabilidad |
|---|---|
| `auth` | Valida tokens de Auth0 y verifica roles (guards) |
| `usuarios` | Cargo y legajo, vinculados al `sub` de Auth0 |
| `obras` | Obras y expedientes |
| `inspecciones` | Asignación y consulta de inspecciones |
| `actas` | Recepción, numeración, medidas, fotos, revisión, anulación |
| `catalogos` | Ítems de control y artículos normativos (solo lectura) |
| `integracion-expedientes` | Adaptador SOAP: asociación de actas y reintentos |
| `auditoria` | Registro de acciones sobre las actas |

Reglas entre módulos (ADR-04):
- Un módulo expone a los demás solo sus servicios públicos (exportados en su `Module`).
- Cada módulo es dueño de sus tablas: otro módulo no usa sus repositorios ni consulta sus tablas directamente.
- **Solo `integracion-expedientes` conoce SOAP.** Ningún otro módulo importa librerías SOAP ni arma XML.

### Frontend: PWA (ADR-02)

- Una sola aplicación para todos los roles; se puede instalar o usar desde el navegador.
- **Las fotos se toman solo con la cámara dentro de la app** (API de cámara del navegador). Nunca uses un selector de archivos ni permitas elegir de la galería.
- La ubicación es **opcional**: si no se obtiene, el acta se emite igual con `ubicacion: null`.
- Debe funcionar en Chrome (Android) y Safari (iOS). Safari no tiene sincronización en segundo plano: no dependas de ella.

### Funcionamiento sin conexión (ADR-03)

- El acta se completa y se guarda **solo en el celular** (IndexedDB), incluidas las fotos. No hay borradores en el servidor.
- Al confirmarla entra en una **cola local de envíos pendientes**. Se reintenta al recuperar la señal, al abrir la app y periódicamente mientras está abierta.
- El **`id` del acta (UUID) se genera en el celular** y hace que el envío sea idempotente.
- El **número de acta lo asigna el servidor** al recibirla.
- **No se permite cerrar sesión con actas pendientes de envío.**
- Pedí almacenamiento persistente al navegador (`navigator.storage.persist()`).

### Autenticación (ADR-01)

- Auth0 con login de Google. El backend **no maneja contraseñas**.
- El backend valida el JWT contra las claves públicas de Auth0 (JWKS), verificando emisor y audiencia.
- Los roles (`INSPECTOR`, `SUPERVISOR`, `ADMINISTRATIVO`) se asignan en Auth0 y viajan en el token.
- Un usuario sin rol asignado no puede acceder (lo rechaza una Action de Auth0).
- El frontend renueva el token en segundo plano con *refresh tokens* con rotación.

## Reglas de dominio que el código debe respetar

- **Un acta emitida es inmutable.** No se actualiza ni se borra su contenido. Lo único que cambia es su `estado`.
- Un acta se considera **emitida cuando el servidor la recibe**.
- La **fecha legal** del acta es `fechaHoraLabrado` (del celular). El servidor guarda además `fechaHoraRecepcion`.
- Estados del acta: `PENDIENTE_ASOCIACION` → `ASOCIADA`; luego puede pasar a `RECTIFICADA` o `ANULADA`.
- Solo se puede rectificar o anular un acta `ASOCIADA`, y solo lo hace el supervisor.
- **Solo el inspector carga actas**, y solo de las inspecciones asignadas a él.
- Cada inspección genera exactamente un acta.
- Un acta tiene entre **1 y 10 fotos**, un resultado por cada ítem de control y cero o más medidas.
- Una medida es **intimación** (falta, conducta a corregir, plazo, artículo) o **clausura** (falta, tipo total/parcial, sector si es parcial, número de faja, artículo). Un acta puede tener ambas.
- Número de acta: **correlativo por año** (`2026-00001`), asignado con la tabla `numeradores_acta` bloqueando la fila del año.
- El notificado no recibe nada del sistema; solo se registran nombre, DNI y si firmó.

## API

**Diseño primero:** `docs/openapi.yaml` es el contrato. Si un cambio afecta la API, **primero se modifica la especificación**, se valida con `pnpm openapi:lint` y después se implementa. El backend debe exponer además Swagger en `/api/docs`.

- Prefijo `/api`, sin versión en la URL.
- JSON en camelCase.
- El acta y sus fotos se envían en **un único `POST /api/actas`** (`multipart/form-data`).

## Base de datos

- PostgreSQL con TypeORM. **Identificadores UUID** en todas las tablas.
- Nombres de tablas y columnas en `snake_case`.
- El modelo está en `docs/diagramas/modelo-datos.mmd`.
- Una sola tabla `usuarios` (rol como columna) y una sola tabla `medidas` (tipo como columna, con restricciones `CHECK` por tipo).
- **Migraciones versionadas en el repositorio** (ADR-05). `synchronize` de TypeORM siempre desactivado: todo cambio de entidad lleva su migración.
- **Las fotos se guardan en una carpeta del servidor**; la tabla `fotografias` guarda solo la ruta del archivo. La carpeta se configura por variable de entorno y nunca se sube al repositorio.

## Convenciones de código

- **Idioma:** el dominio en español (`Acta`, `Inspeccion`, `emitirActa`, `fechaHoraLabrado`); lo técnico del framework en inglés (`ActasService`, `ActasController`, `actas.module.ts`). Sin tildes ni ñ en identificadores (`Inspeccion`, `numeroAnio`). Comentarios y textos de la interfaz en español.
- TypeScript estricto en frontend y backend.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/es/) en español, por ejemplo `feat(actas): recepción idempotente de actas` o `docs: agrega ADR de despliegue`.
- **Nunca subas secretos.** Toda configuración sensible va en `.env` (ignorado por git); documentá cada variable nueva en `.env.example`.

## Decisiones pendientes: no las inventes

Estas cuestiones todavía no se decidieron. Si una tarea depende de alguna, **frená y preguntá** en lugar de asumir:

- Integración SOAP: qué datos se envían, si la asociación es sincrónica o en segundo plano, política de reintentos, manejo de rechazos de negocio, validación del expediente al darlo de alta.
- Diseño del simulador SOAP.
- Despliegue completo con Docker Compose (por ahora solo PostgreSQL), incluido el volumen de fotos.
- Datos semilla (obras, expedientes, inspecciones y catálogos de prueba).
- Estrategia de tests.
- Licencia del repositorio.
