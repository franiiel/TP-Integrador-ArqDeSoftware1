import { createServer } from 'node:http';

// Expedientes that exist in the simulated municipal system (same as the seed data).
const EXPEDIENTES = new Set(['1001', '1002', '1003']);

const sobre = (cuerpo: string) => `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:exp="http://municipio.local/expedientes">
  <soap:Body>${cuerpo}</soap:Body>
</soap:Envelope>`;

const fault = (mensaje: string) =>
  sobre(
    `<soap:Fault><faultcode>soap:Client</faultcode><faultstring>${mensaje}</faultstring></soap:Fault>`,
  );

// Single operation: AsociarActa(identificadorExpediente, numeroActa, fechaEmision, tipoMedida).
export function crearSimulador() {
  return createServer((req, res) => {
    let xml = '';
    req.on('data', (parte: Buffer) => (xml += parte.toString()));
    req.on('end', () => {
      const responder = (status: number, cuerpo: string) =>
        res.writeHead(status, { 'Content-Type': 'text/xml' }).end(cuerpo);
      const campo = (nombre: string) =>
        new RegExp(`<exp:${nombre}>([^<]*)</exp:${nombre}>`).exec(xml)?.[1];

      if (req.method !== 'POST' || !xml.includes('<exp:AsociarActa>')) {
        return responder(500, fault('Operación no soportada'));
      }
      const expediente = campo('identificadorExpediente');
      const numeroActa = campo('numeroActa');
      if (!expediente || !numeroActa) {
        return responder(500, fault('Faltan datos del acta'));
      }
      if (!EXPEDIENTES.has(expediente)) {
        return responder(500, fault(`El expediente ${expediente} no existe`));
      }
      console.log(`Acta ${numeroActa} asociada al expediente ${expediente}`);
      responder(
        200,
        sobre(
          '<exp:AsociarActaResponse><exp:resultado>OK</exp:resultado></exp:AsociarActaResponse>',
        ),
      );
    });
  });
}

if (import.meta.main) {
  const puerto = Number(process.env.PORT ?? 8080);
  crearSimulador().listen(puerto, () =>
    console.log(`Simulador SOAP en http://localhost:${puerto}/expedientes`),
  );
}
