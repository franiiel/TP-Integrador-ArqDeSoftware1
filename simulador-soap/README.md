# simulador-soap

Simulación del sistema municipal de expedientes, que en la realidad no se puede modificar y solo expone servicios SOAP.

```bash
pnpm --filter simulador-soap start   # http://localhost:8080/expedientes (PORT para cambiarlo)
```

Es un servidor HTTP de Node sin dependencias (Node 24 ejecuta el TypeScript directamente).

## Operación `AsociarActa`

SOAP 1.1, `POST` con `Content-Type: text/xml` y espacio de nombres `http://municipio.local/expedientes`.

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:exp="http://municipio.local/expedientes">
  <soap:Body>
    <exp:AsociarActa>
      <exp:identificadorExpediente>1001</exp:identificadorExpediente>
      <exp:numeroActa>2026-00001</exp:numeroActa>
      <exp:fechaEmision>2026-11-01T10:30:00.000Z</exp:fechaEmision>
      <exp:tipoMedida>INTIMACION</exp:tipoMedida>
    </exp:AsociarActa>
  </soap:Body>
</soap:Envelope>
```

- Si el expediente existe (1001, 1002 o 1003, los mismos de los datos semilla), responde `200` con `<exp:resultado>OK</exp:resultado>`.
- Si no existe o faltan datos, responde `500` con un `soap:Fault` (`faultcode` `soap:Client`).

No tiene estado: asociar dos veces la misma acta vuelve a responder OK.
