# Evidencia: NFR Tolerancia a fallos

**Escenario:** un inspector confirma un acta durante un corte de señal de hasta 5 minutos. Medida: el acta queda guardada en el celular, se envía sola al volver la conexión y queda registrada una sola vez aunque el envío se repita (0 actas perdidas y 0 duplicadas).

## Backend: el reenvío no duplica el acta

**Verificación:** [`backend/test/caso-uso-minimo.e2e-spec.ts`](../../backend/test/caso-uso-minimo.e2e-spec.ts), contra PostgreSQL real (`pnpm --filter backend test:e2e`).

| Test | Qué comprueba |
|---|---|
| `un reenvío del mismo id responde 200 con la misma acta, sin duplicarla` | El segundo `POST /api/v1/actas` con el mismo `id` (generado en el celular) responde 200 con el mismo número, y en la base queda un único registro. |
| `si el sistema de expedientes no responde, las actas quedan pendientes` | Con el sistema SOAP caído, el acta ya registrada queda en `PENDIENTE_ASOCIACION`: la falla externa no la pierde. |
| `asocia las pendientes y deja pendiente la de un expediente rechazado` | Al volver el sistema SOAP, el proceso periódico asocia las pendientes sin intervención manual. |

```
 ✓ POST /api/actas > emite el acta con número correlativo y la deja pendiente de asociación
 ✓ POST /api/actas > un reenvío del mismo id responde 200 con la misma acta, sin duplicarla
 ✓ asociación al expediente en segundo plano > si el sistema de expedientes no responde, las actas quedan pendientes
 ✓ asociación al expediente en segundo plano > asocia las pendientes y deja pendiente la de un expediente rechazado
 Test Files  1 passed (1)
      Tests  25 passed (25)
```

## Frontend: guardado sin conexión y envío automático

**Pendiente.** Requiere la cola local de la PWA (ADR-03). Prueba manual a hacer:

1. En DevTools > Network, poner "Offline".
2. Cargar y confirmar un acta y comprobar que aparece como «pendiente de envío».
3. Volver a "Online" y comprobar que se envía sola y desaparece de pendientes.
4. Comprobar que el servidor la tiene una sola vez y que `fechaEmision` es la del momento de confirmación, no la de recepción.

Evidencia a sumar: capturas (o un GIF corto) del acta pendiente y luego enviada.
