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

### Auth0

El backend valida el token contra la JWKS del tenant (`AUTH0_DOMAIN`) y verifica emisor y audiencia (`AUTH0_AUDIENCE`). Los roles viajan en el claim `https://inspecciones-obra/roles`. Configuración del tenant `inspecciones-obras.us.auth0.com`:

1. **API** (*Applications → APIs*): identifier `https://inspecciones-obra/api`, RS256. *User access*: Allow; *Client access*: Deny.
2. **Aplicación** (*Applications → Applications*, tipo *Single Page Web Applications*), en *Settings*:
   - *Allowed Callback URLs*, *Allowed Logout URLs* y *Allowed Web Origins*: `http://localhost:4200`.
   - *Refresh Token Rotation*: activado.
3. **Google** (*Authentication → Social → google-oauth2*): habilitado para la aplicación.
4. **Roles** (*User Management → Roles*): crear `INSPECTOR`, `SUPERVISOR` y `ADMINISTRATIVO`, y asignar el que corresponda a cada usuario.
5. **Action** (*Actions → Library → Create Action*, trigger *Login / Post Login*), desplegarla y agregarla al flujo *Login*:

   ```js
   // Agrega los roles al token de acceso y rechaza a quien no tenga ninguno (ADR-01).
   exports.onExecutePostLogin = async (event, api) => {
     const roles = event.authorization?.roles ?? [];
     if (roles.length === 0) {
       api.access.deny('El usuario no tiene un rol asignado.');
       return;
     }
     api.accessToken.setCustomClaim('https://inspecciones-obra/roles', roles);
   };
   ```

Además, cada usuario tiene que existir en la tabla `usuarios` con su `sub` de Auth0 en `auth0_id` (ver datos semilla); si no, el backend responde 403.

### Fotos de las actas

Se guardan en la carpeta `FOTOS_DIR` (por defecto `uploads/fotos` en la raíz del repositorio, ignorada por git), una subcarpeta por acta. La tabla `fotografias` guarda solo la ruta.

### Datos semilla

```bash
pnpm seed   # carga 2 usuarios (inspector y supervisor), 2 obras con su expediente y 2 inspecciones del día
```

Se corre una vez, después de `pnpm migration:run`; si ya hay usuarios cargados, no hace nada (para recargarla, vaciá la base y volvé a correr las migraciones). Los `sub` de Auth0 se leen de `SEED_INSPECTOR_AUTH0_ID` y `SEED_SUPERVISOR_AUTH0_ID` del `.env`.

Los tests e2e levantan la aplicación completa, así que necesitan la base corriendo (`pnpm db:up`).

Módulos previstos (ver `docs/diagramas/c4-componentes-backend.mmd`):
`auth`, `usuarios`, `obras`, `inspecciones`, `actas`, `integracion-expedientes` y `auditoria`.

El contrato de la API está en `docs/openapi.yaml` y la implementación debe respetarlo.
