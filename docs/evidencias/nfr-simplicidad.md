# Evidencia: NFR Simplicidad

**Escenario:** el desarrollador pone en marcha el sistema completo en el servidor municipal, que solo tiene Docker instalado. Medida: un único comando (`docker compose up`) levanta tres contenedores (frontend, backend y PostgreSQL) en menos de 15 minutos, sin colas de mensajería ni otros servicios.

**Verificación:** despliegue desde cero siguiendo solo el [README](../../README.md), el 17/11/2026.

- **Entorno limpio:** antes de empezar se borraron los contenedores, los volúmenes y las imágenes del proyecto, la imagen `postgres:18` y toda la caché de build de Docker. Todas las imágenes se descargaron y compilaron de nuevo.
- **Pasos cronometrados:** `git clone` del repositorio, copia del `.env` ya completado y `docker compose up --build -d`, hasta que el backend respondió en `http://localhost:3000/api/docs`.
- **Tiempo total: 1 min 45 s** (105 s), con una conexión doméstica. Holgado frente al límite de 15 minutos.
- Al arrancar, el backend aplicó las 2 migraciones y cargó los datos semilla; el frontend respondió 200 en `http://localhost:4200`.

El simulador SOAP aparece como cuarto contenedor, pero no forma parte del sistema: reemplaza al sistema municipal de expedientes, que en producción ya existe. Auth0 queda fuera por ser un servicio externo (ADR-01).

## `docker compose ps`

```
NAME                            IMAGE                         SERVICE     STATUS                    PORTS
inspecciones-db                 postgres:18                   db          Up 16 seconds (healthy)   0.0.0.0:5432->5432/tcp
inspecciones-obra-backend-1     inspecciones-obra-backend     backend     Up 5 seconds              0.0.0.0:3000->3000/tcp
inspecciones-obra-frontend-1    inspecciones-obra-frontend    frontend    Up 5 seconds              0.0.0.0:4200->80/tcp
inspecciones-obra-simulador-1   inspecciones-obra-simulador   simulador   Up 16 seconds             0.0.0.0:8080->8080/tcp
```

## Log del backend al arrancar

```
2 migrations are new migrations must be executed.
Migration CreaEsquemaInicial1793845145108 has been executed successfully.
Migration AlineaConDoc1794860200000 has been executed successfully.
Datos semilla cargados.
LOG [NestApplication] Nest application successfully started
```
