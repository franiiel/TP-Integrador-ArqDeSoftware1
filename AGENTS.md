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
- Formulario del acta: observaciones, fotos con la cámara, ubicación opcional, tipo de medida y notificación.
- Guardado offline en el celular y reenvío automático al recuperar la señal (es la restricción central del escenario).
- Recepción idempotente del acta en el backend y numeración correlativa por año.
- Asociación al expediente a través del simulador SOAP.

### Qué queda solo diseñado (no implementar)

- Asignación de inspecciones, revisión, rectificación y anulación de actas.
- Pantallas de supervisor y administrativo.
- Alta de obras y expedientes: se resuelve con **datos semilla**.
- Registro de auditoría (módulo `auditoria`) y verificación de integridad de las actas.
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
| `actas` | Recepción, numeración, fotos, notificación, revisión, rectificación y anulación |
| `integracion-expedientes` | Adaptador SOAP: asociación de actas y reintentos |
| `auditoria` | Registro de acciones sobre las actas |

Reglas entre módulos (ADR-04):
- Un módulo expone a los demás solo sus servicios públicos (exportados en su `Module`).
- Cada módulo es dueño de sus tablas: otro módulo no usa sus repositorios ni consulta sus tablas directamente.
- **Solo `integracion-expedientes` conoce SOAP.** Ningún otro módulo importa librerías SOAP ni arma XML. Es la **capa anticorrupción** frente al sistema de expedientes: traduce el acta del dominio al formato SOAP y la respuesta a términos del dominio.
- **La asociación al expediente es en segundo plano.** `POST /api/actas` guarda el acta en `PENDIENTE_ASOCIACION` y responde sin llamar al SOAP. Un proceso periódico dentro del mismo backend toma las actas pendientes, las asocia y las pasa a `ASOCIADA`; si falla, la reintenta en la próxima vuelta. Esa es toda la política de reintentos: sin colas ni tablas de trabajos.
- **Contrato con el sistema de expedientes:** una única operación SOAP, `AsociarActa`, que recibe identificador del expediente, número de acta, fecha de emisión y tipo de medida (ver `simulador-soap/README.md`). El XML se arma a mano con `fetch`, sin librerías SOAP. Un rechazo de negocio (`soap:Fault`, por ejemplo un expediente inexistente) se registra en el log y el acta queda en `PENDIENTE_ASOCIACION`.

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
- La **fecha legal** del acta es `fechaEmision` (del celular, al labrarla). El servidor guarda además `fechaHoraRecepcion`.
- Estados del acta (asociación al expediente): `PENDIENTE_ASOCIACION` → `ASOCIADA`.
- **Rectificar o anular es emitir otra acta** con `tipoActa` `RECTIFICACION` o `ANULACION` que referencia a la anterior (`actaOriginalId`); la anterior no cambia. Solo se rectifica o anula un acta `ASOCIADA`, y solo lo hace el supervisor.
- Un acta original viene de una inspección y no tiene `tipoActa`; una rectificación o anulación no tiene inspección (lo garantiza el `CHECK` `ck_actas_origen`).
- **Solo el inspector carga actas**, y solo de las inspecciones asignadas a él.
- Cada inspección genera exactamente un acta, y cada acta pertenece a un expediente.
- Un acta tiene entre **1 y 10 fotos** y un único `tipoMedida`: `NINGUNA`, `INTIMACION` o `CLAUSURA`.
- La ubicación se registra en la inspección (`ubicacion`, opcional) al labrar el acta.
- Número de acta: **correlativo por año** (`2026-00001`), asignado con la tabla `numeradores_acta` bloqueando la fila del año. El año es el de `fechaEmision` en hora argentina, no el de la recepción.
- Cada acta genera exactamente una notificación (fecha de emisión, destinatario y medio). El sistema no le envía nada al destinatario; solo la registra.

## API

**Diseño primero:** `docs/openapi.yaml` es el contrato. Si un cambio afecta la API, **primero se modifica la especificación**, se valida con `pnpm openapi:lint` y después se implementa. El backend debe exponer además Swagger en `/api/docs`.

- Prefijo `/api`, sin versión en la URL.
- JSON en camelCase.
- El acta y sus fotos se envían en **un único `POST /api/actas`** (`multipart/form-data`).

## Base de datos

- PostgreSQL con TypeORM. **Identificadores UUID** en todas las tablas.
- Nombres de tablas y columnas en `snake_case`.
- El modelo está en `docs/diagramas/modelo-datos.mmd`.
- Una sola tabla `usuarios` (rol como columna). La medida es la columna `tipo_medida` de `actas`, y una rectificación o anulación es otra fila de `actas` (`tipo_acta`, `acta_original_id`).
- **Migraciones versionadas en el repositorio** (ADR-05). `synchronize` de TypeORM siempre desactivado: todo cambio de entidad lleva su migración.
- **Las fotos se guardan en una carpeta del servidor**; la tabla `fotografias` guarda solo la ruta del archivo. La carpeta se configura por variable de entorno y nunca se sube al repositorio.

## Tests y datos semilla

- **Un test e2e del caso de uso** (`backend/test/caso-uso-minimo.e2e-spec.ts`) contra PostgreSQL real, con tokens firmados localmente en lugar de Auth0. Usa la base `inspecciones_test`, que se recrea en cada corrida; nunca la de desarrollo.
- Tests unitarios solo donde haya lógica que lo justifique, no uno por servicio.
- **Datos semilla:** `pnpm --filter backend seed` carga un inspector y un supervisor (con los `sub` de Auth0 tomados del `.env`), dos obras con su expediente y dos inspecciones del día.

## Convenciones de código

- **Idioma:** el dominio en español (`Acta`, `Inspeccion`, `emitirActa`, `fechaEmision`); lo técnico del framework en inglés (`ActasService`, `ActasController`, `actas.module.ts`). Sin tildes ni ñ en identificadores (`Inspeccion`, `numeroAnio`). Comentarios y textos de la interfaz en español.
- TypeScript estricto en frontend y backend.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/es/) en español, por ejemplo `feat(actas): recepción idempotente de actas` o `docs: actualiza el contrato de la API`.
- **Nunca subas secretos.** Toda configuración sensible va en `.env` (ignorado por git); documentá cada variable nueva en `.env.example`.

## Decisiones pendientes: no las inventes

Estas cuestiones todavía no se decidieron. Si una tarea depende de alguna, **frená y preguntá** en lugar de asumir:

- Validación del expediente en el sistema municipal al darlo de alta (el alta de expedientes no se implementa).
- Despliegue completo con Docker Compose (por ahora solo PostgreSQL), incluido el volumen de fotos.
- Licencia del repositorio.
