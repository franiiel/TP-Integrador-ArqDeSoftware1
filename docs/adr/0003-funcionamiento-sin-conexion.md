# ADR-03: Funcionamiento sin conexión con guardado local y envío diferido

**Estado:** Aceptada

## Contexto

El casco urbano tiene buena señal, pero hay cortes de pocos minutos. Un inspector no puede perder un acta a medio cargar ni quedar bloqueado en la obra por falta de conexión. Por este motivo, el sistema debe permitir completar y emitir el acta desde el celular, aunque no haya conexión con el servidor en ese momento.

**Atributos y restricción que pesan:** Tolerancia a fallos e Integridad (un acta no se pierde ni se registra dos veces). Restricción: cortes de señal de pocos minutos en el casco urbano.

## Decisión

- El acta se completa y se guarda en el celular, en el almacenamiento del navegador (IndexedDB), incluidas las fotografías.
- Al confirmar, queda en una cola local de envíos pendientes. La aplicación intenta enviarla inmediatamente y, si no hay conexión, vuelve a intentarlo cuando detecta que se recuperó la conectividad, cuando se abre o vuelve a primer plano y mientras permanece activa. En los navegadores compatibles, también puede utilizar mecanismos de sincronización en segundo plano.
- Cada acta lleva un identificador único generado en el celular. Este identificador se conserva durante todos los reintentos. Si un mismo envío llega más de una vez al servidor, este reconoce el identificador y evita registrar dos veces la misma acta, garantizando la idempotencia de la operación.
- Hasta que el servidor confirme su recepción, la aplicación muestra el acta como «pendiente de envío». La confirmación del servidor indica que el acta fue recibida correctamente, pero no modifica su fecha de emisión.
- La app solicita al navegador almacenamiento persistente, para reducir el riesgo de que borre los datos locales por falta de espacio.
- No se permite cerrar sesión mientras haya actas pendientes de envío.
- Si no se puede obtener la ubicación de la inspección, el acta se puede emitir sin ella.
- La fecha legal del acta es la del labrado, registrada en el celular al confirmarla (atributo `fechaEmision` del modelo de dominio). Esta fecha se conserva y no se modifica cuando el servidor recibe el acta.
- Al recibir un acta, el servidor registra automáticamente la fecha y hora de recepción (`fechaRecepcion`). Este dato es independiente de `fechaEmision`, que conserva el momento de labrado registrado por el dispositivo. De esta manera, se pueden distinguir ambos momentos incluso cuando el acta se envía posteriormente por falta de conexión.
- Una vez confirmada la recepción del acta por el servidor, la aplicación elimina la copia local del acta y sus fotografías, liberando el almacenamiento del dispositivo. Si la recepción todavía no fue confirmada, los datos permanecen almacenados localmente para permitir nuevos intentos de envío.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Exigir conexión para cargar el acta | Un corte de señal dejaría al inspector bloqueado en la obra y podría perder lo cargado. |
| Guardar borradores en el servidor durante la carga | Requiere conexión constante y suma complejidad. Con cortes breves, alcanza con el guardado local. |

## Consecuencias negativas

- **Pérdida si se borran los datos del navegador con actas pendientes:** se reduce el riesgo solicitando almacenamiento persistente y mostrando un aviso visible de actas pendientes.
- En iOS no hay envío en segundo plano con la app cerrada (ver ADR-02): el envío ocurre al abrirla.
- La confirmación de recepción del servidor puede demorarse mientras no haya conexión. Durante ese tiempo, el acta permanece identificada como pendiente de envío.
- **Actas sin ubicación:** se pierde un dato de respaldo ante un reclamo. Queda registrado que la ubicación no estaba disponible.
- La fecha legal depende del reloj del celular, que el municipio no controla. Esta limitación se acepta como parte de la solución y debe tenerse en cuenta ante posibles reclamos.

## Confirmación

Con el navegador en modo sin conexión se emite un acta, que se envía sola al volver la red; un test e2e envía dos veces la misma acta con el mismo identificador y comprueba que queda un único registro (ver NFR Tolerancia a fallos).
