# Evidencia: NFR Mantenibilidad

Los límites entre módulos del backend (ADR-04) los controla [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) con la configuración de `backend/.dependency-cruiser.mjs`. Corre junto con el lint (`pnpm --filter backend lint`) y también suelto (`pnpm --filter backend lint:deps`).

| Regla | Qué prohíbe |
|---|---|
| `solo-api-publica` | Que un módulo importe archivos internos de otro. De otro módulo solo se puede usar su módulo Nest, sus servicios, sus entidades (por las relaciones de TypeORM) y los decoradores de `auth/auth.constants.ts`. |
| `acl-aislada` | Que `integracion-expedientes`, la capa anticorrupción frente al SOAP, dependa de cualquier otro módulo. El sistema no usa una librería SOAP: el XML se arma a mano dentro de ese módulo. |

## Salida sin violaciones

```
$ pnpm --filter backend lint:deps
✔ no dependency violations found (45 modules, 127 dependencies cruised)
```

## Prueba negativa

Se agregaron a propósito dos imports prohibidos, se corrió el script y después se revirtieron:

- `inspecciones.service.ts` importa `actas/acta-nueva.ts`, un archivo interno de `actas`.
- `integracion-expedientes.service.ts` importa `actas/acta.entity.ts`.

```
$ pnpm --filter backend lint:deps
  error solo-api-publica: src/inspecciones/inspecciones.service.ts → src/actas/acta-nueva.ts
  error acl-aislada: src/integracion-expedientes/integracion-expedientes.service.ts → src/actas/acta.entity.ts

x 2 dependency violations (2 errors, 0 warnings). 45 modules, 129 dependencies cruised.
```

El script termina con código de salida 2, así que el lint falla.
