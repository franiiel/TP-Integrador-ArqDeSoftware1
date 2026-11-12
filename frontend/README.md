# frontend

PWA en Angular usada por inspectores, supervisor y administrativo (ADR-02).

Generado con Angular CLI 22 (sin SSR, zoneless, CSS) y `@angular/pwa`.

```bash
pnpm start   # servidor de desarrollo en http://localhost:4200 (/api va al backend en :3000)
pnpm build   # build de producción en dist/ (incluye el service worker)
```

El service worker solo se activa en el build de producción, no con `pnpm start`.
La cámara y la ubicación solo funcionan en HTTPS o en `localhost`.

Componentes previstos (ver `docs/diagramas/c4-componentes-frontend.mmd`):
`auth`, `inspecciones`, `acta`, `camara`, `geolocalizacion`, `cola-offline`, `sincronizacion`, `api-client`, `consulta` y el service worker.

## Pantallas del inspector

| Ruta | Pantalla | Dónde está |
|---|---|---|
| `/inspecciones` | Mis inspecciones: lista del backend guardada en el celular, con el estado del acta de cada una | `src/app/inspecciones/` |
| `/inspecciones/:id/acta` | Emitir acta: observaciones, 1 a 10 fotos con la cámara, medida, notificación y ubicación opcional | `src/app/acta/emitir-acta.*` |
| `/pendientes` | Actas que todavía no llegaron al servidor, con el motivo si el servidor las rechazó | `src/app/cola-offline/pendientes.ts` |
| `/actas/:id` | Detalle: pendiente de envío, o número asignado y si quedó asociada al expediente | `src/app/acta/detalle-acta.*` |

## Funcionamiento sin conexión (ADR-03)

- **IndexedDB** (`almacenamiento/base-local.ts`): guarda las actas con sus fotos y la última lista de inspecciones. Al arrancar se pide almacenamiento persistente.
- **Cola offline** (`cola-offline/cola-offline.service.ts`): cada acta confirmada se guarda con su UUID generado en el celular y queda `PENDIENTE`. Cuando el servidor la recibe pasa a `ENVIADA` (se borran las fotos del celular y se guarda el número); si el servidor la rechaza (400, 403, 404, 409) queda `RECHAZADA` con el motivo y no se reintenta.
- **Sincronización** (`sincronizacion/sincronizacion.service.ts`): reintenta al volver la señal (`online`), al abrir la app o volver a mostrarla y cada 60 segundos. Los errores de conexión, 401, 408, 429 y 5xx se reintentan. No usa Background Sync.
- **api-client** (`api-client/api-client.ts`): llamadas según `docs/openapi.yaml`. El token de Auth0 se obtiene con el token de inyección `OBTENER_TOKEN`, que debe proveer el componente `auth`.
- No se puede cerrar sesión con actas pendientes de envío (`ColaOfflineService.hayPendientesDeEnvio`).

## Backend simulado (solo desarrollo)

Mientras el backend no tenga los endpoints, `src/app/simulador/backend-simulado.ts` responde `GET /api/me` (un inspector de prueba), `GET /api/inspecciones`, `POST /api/actas` y `GET /api/actas/:id` desde el propio frontend, con 4 inspecciones de ejemplo. Arriba se ve la etiqueta "Datos de prueba".

- Solo funciona con `pnpm start`; el build de producción usa siempre el backend real.
- Lo recibido se guarda en `localStorage` (clave `backend-simulado`); borrala para empezar de cero.
- Respeta el contrato: 201 la primera vez, 200 si se reenvía el mismo UUID, 409 si la inspección ya tiene acta, 400 si faltan fotos o datos. A los 30 segundos de recibida, el acta pasa a "asociada al expediente".
- Con "Offline" en las herramientas del navegador (pestaña Network) responde como si no hubiera señal.
- Cuando el backend tenga los endpoints: `USAR_BACKEND_SIMULADO = false` en ese archivo, o borrar la carpeta `simulador`.

## Inicio de sesión (Auth0, ADR-01)

Código en `src/app/auth/`: `auth.service.ts` (sesión), `guards.ts` (rol), `ingresar.ts` y `sin-permiso.ts` (pantallas).

- Se usa el SDK `@auth0/auth0-spa-js` con *refresh tokens* con rotación guardados en el navegador, para que la sesión siga abierta sin señal y el token se renueve solo.
- El rol y los datos del usuario se piden a `GET /api/me` y quedan guardados en el celular. Solo el rol `INSPECTOR` entra a las pantallas; los demás ven "Sin acceso".
- Si la sesión vence, las actas siguen guardadas y aparece un aviso para volver a ingresar.
- Al cerrar sesión se borra lo guardado en el celular. No se permite con actas pendientes de envío.

**Sin Auth0 configurado** (`configuracion-auth0.ts` con "COMPLETAR"), en desarrollo se entra con una sesión de prueba sin login real.

### Configurar Auth0

1. **APIs → Create API.** El *Identifier* es la audiencia (por ejemplo `https://inspecciones-obra/api`); es el mismo valor que valida el backend. Activar *Allow Offline Access*.
2. **Applications → Create Application → Single Page Application.** En *Settings*:
   - Allowed Callback URLs: `http://localhost:4200`
   - Allowed Logout URLs: `http://localhost:4200/ingresar`
   - Allowed Web Origins: `http://localhost:4200`
   - *Refresh Token Rotation*: activado.
   - Agregar las direcciones HTTPS que se usen para probar en el celular.
3. **Authentication → Social → Google** habilitado para esa aplicación.
4. Completar `domain`, `clientId` y `audience` en `src/app/auth/configuracion-auth0.ts`.
