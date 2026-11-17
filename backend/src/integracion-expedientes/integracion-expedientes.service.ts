import { Injectable } from '@nestjs/common';

export interface AsociacionActa {
  identificadorExpediente: number;
  numeroActa: string;
  fechaEmision: Date;
  tipoMedida: string;
}

// The municipal system rejected the request (e.g. unknown expediente):
// retrying won't help until someone fixes the data.
export class RechazoExpedientes extends Error {}

// Anti-corruption layer: the only place that knows SOAP. It takes domain data
// and answers in domain terms (success, RechazoExpedientes or a network error).
// Values are numbers, server-generated codes and enums, so no XML escaping is needed.
@Injectable()
export class IntegracionExpedientesService {
  async asociarActa(datos: AsociacionActa): Promise<void> {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:exp="http://municipio.local/expedientes">
  <soap:Body>
    <exp:AsociarActa>
      <exp:identificadorExpediente>${datos.identificadorExpediente}</exp:identificadorExpediente>
      <exp:numeroActa>${datos.numeroActa}</exp:numeroActa>
      <exp:fechaEmision>${datos.fechaEmision.toISOString()}</exp:fechaEmision>
      <exp:tipoMedida>${datos.tipoMedida}</exp:tipoMedida>
    </exp:AsociarActa>
  </soap:Body>
</soap:Envelope>`;

    const res = await fetch(process.env.EXPEDIENTES_SOAP_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml', SOAPAction: 'AsociarActa' },
      body: xml,
      signal: AbortSignal.timeout(10_000),
    });
    const respuesta = await res.text();

    const fault = /<faultstring>([^<]*)<\/faultstring>/.exec(respuesta);
    if (fault) throw new RechazoExpedientes(fault[1]);
    if (!res.ok || !respuesta.includes('<exp:resultado>OK</exp:resultado>')) {
      throw new Error(
        `Respuesta inesperada del sistema de expedientes (${res.status})`,
      );
    }
  }
}
