# Guion de la demo

Demo del caso de uso mínimo desde el tag `v1.0`: un inspector labra un acta, incluso sin señal, y el acta queda asociada al expediente del sistema municipal. Dura unos 10 minutos.

## Antes de empezar

1. `git checkout v1.0`, `cp .env.example .env` y `docker compose down -v && docker compose up --build -d`.
2. `docker compose logs backend` muestra las migraciones y "Datos semilla cargados".
3. Abrir http://localhost:4200 en una ventana de incógnito (sin service worker ni sesión vieja) con las DevTools abiertas en la pestaña *Network*.
4. En otra pestaña, Swagger en http://localhost:3000/api/docs.

Usuarios: ver la tabla "Usuarios de prueba" del [README](../README.md).

## 1. Login y roles (ADR-01)

| Paso | Qué se muestra | Qué se dice |
|---|---|---|
| Ingresar con `supervisor.demo@inspecciones.test` | Pantalla "Sin acceso" | El login lo resuelve Auth0 (OIDC); el backend no maneja contraseñas. El rol viaja en el token y el backend lo vuelve a verificar. |
| Salir e ingresar con `inspector.demo@inspecciones.test` | Panel del inspector y sus inspecciones del día | El backend reconoce al usuario por el `sub` de Auth0 en la tabla `usuarios`. |

## 2. Emitir un acta con señal

| Paso | Qué se muestra | Qué se dice |
|---|---|---|
| "Emitir acta" en una inspección | Formulario: observaciones, fotos con la cámara, medida, notificación, ubicación opcional | Las fotos se toman solo con la cámara de la app, sin galería (ADR-02). La ubicación es opcional. |
| Completar y "Confirmar acta" | Diálogo "el acta no se puede modificar" y después el detalle con "Recibida · pendiente de asociar" y el número `2026-0000N` | El `id` (UUID) se genera en el celular y el número lo asigna el servidor, correlativo por año. El acta emitida es inmutable. |
| Esperar hasta 60 s y "Actualizar estado" | "Asociada al expediente" | La asociación al expediente corre en segundo plano a través de la capa anticorrupción `integracion-expedientes`, la única que conoce SOAP (ADR-04). |

## 3. Sin señal (ADR-03, la restricción central)

| Paso | Qué se muestra | Qué se dice |
|---|---|---|
| DevTools → *Network* → *Offline* | Indicador "Sin conexión" | Simula un corte de señal en la obra. |
| Emitir el acta de otra inspección | El acta queda en "Pendientes" | Se guarda en IndexedDB del celular, con las fotos. No se pierde aunque se cierre la pestaña. |
| Intentar "Salir" | La app no deja cerrar sesión | No se permite cerrar sesión con actas pendientes de envío. |
| Volver a *No throttling* | El acta se envía sola y pasa a recibida | Se reintenta al volver la señal, al abrir la app y periódicamente. Reenviar el mismo UUID no duplica el acta (idempotencia: 201 la primera vez, 200 después). |

## 4. Arquitectura por detrás (opcional)

- Swagger en `/api/docs`: el contrato `docs/openapi.yaml`, versionado por URL (`/api/v1`) y con errores en formato Problem Details.
- `docker compose ps`: un único servidor con PostgreSQL, el backend, el frontend y el simulador SOAP. Auth0 queda fuera por ser un servicio externo.
- `pnpm --filter backend lint:deps`: las reglas entre módulos del monolito modular se verifican automáticamente.
