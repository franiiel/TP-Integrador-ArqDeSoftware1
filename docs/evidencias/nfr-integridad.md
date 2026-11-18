# Evidencia: NFR Integridad

**Escenario:** un usuario autenticado, con cualquier rol, intenta modificar o eliminar un acta emitida a través de la API. Medida: se rechaza el 100 % de los intentos y el acta queda igual; la única forma de corregirla es una nueva acta de rectificación o anulación vinculada.

**Verificación:** el bloque `integridad del acta emitida` de [`backend/test/caso-uso-minimo.e2e-spec.ts`](../../backend/test/caso-uso-minimo.e2e-spec.ts), contra PostgreSQL real (`pnpm --filter backend test:e2e`).

| Test | Qué comprueba |
|---|---|
| `rechaza put/patch/delete sobre el acta con cualquier rol y el acta no cambia` | Con inspector, supervisor y administrativo, `PUT`, `PATCH` y `DELETE` sobre `/api/v1/actas/{id}` responden 404 (la API no expone esas rutas) y el acta en la base queda idéntica. |
| `la base rechaza un acta original sin inspección` | Un insert directo viola `ck_actas_origen` (código `23514`). Confirmación del ADR-05. |
| `la base rechaza un tipo de medida fuera de NINGUNA, INTIMACION o CLAUSURA` | El enum `tipo_medida` rechaza `MULTA` (código `22P02`). Confirmación del ADR-05. |
| `una rectificación es otra acta vinculada y la original queda igual` | Una `RECTIFICACION` con `acta_antecedente_id` se registra como otra fila y la original no cambia. |

La rectificación y la anulación solo están diseñadas (no tienen endpoint), por eso se prueban a nivel de base.

## Salida

```
 ✓ integridad del acta emitida > rechaza put sobre el acta con cualquier rol y el acta no cambia
 ✓ integridad del acta emitida > rechaza patch sobre el acta con cualquier rol y el acta no cambia
 ✓ integridad del acta emitida > rechaza delete sobre el acta con cualquier rol y el acta no cambia
 ✓ integridad del acta emitida > la base rechaza un acta original sin inspección
 ✓ integridad del acta emitida > la base rechaza un tipo de medida fuera de NINGUNA, INTIMACION o CLAUSURA
 ✓ integridad del acta emitida > una rectificación es otra acta vinculada y la original queda igual
 Test Files  1 passed (1)
      Tests  31 passed (31)
```
