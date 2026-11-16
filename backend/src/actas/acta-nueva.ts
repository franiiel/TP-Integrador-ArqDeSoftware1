import { BadRequestException } from '@nestjs/common';
import { TipoMedida } from './acta.entity.js';

export interface ActaNueva {
  id: string;
  inspeccionId: string;
  fechaEmision: Date;
  ubicacion: string | null;
  observaciones: string;
  tipoMedida: TipoMedida;
  notificacion: { fechaEmision: string; destinatario: string; medio: string };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const esTexto = (valor: unknown): valor is string =>
  typeof valor === 'string' && valor.trim().length > 0;

// Validates the `acta` field of the multipart request against the ActaNueva schema.
export function parsearActaNueva(json: unknown): ActaNueva {
  let datos: Record<string, unknown>;
  let notificacion: Record<string, unknown>;
  try {
    datos = JSON.parse(String(json)) as Record<string, unknown>;
    notificacion = datos.notificacion as Record<string, unknown>;
  } catch {
    throw new BadRequestException('El campo acta no es un JSON válido');
  }

  const errores: string[] = [];
  if (typeof datos.id !== 'string' || !UUID.test(datos.id))
    errores.push('id debe ser un UUID');
  if (typeof datos.inspeccionId !== 'string' || !UUID.test(datos.inspeccionId))
    errores.push('inspeccionId debe ser un UUID');
  const fechaEmision = new Date(String(datos.fechaEmision));
  if (typeof datos.fechaEmision !== 'string' || isNaN(fechaEmision.getTime()))
    errores.push('fechaEmision debe ser una fecha y hora');
  if (datos.ubicacion != null && typeof datos.ubicacion !== 'string')
    errores.push('ubicacion debe ser texto o null');
  if (typeof datos.observaciones !== 'string')
    errores.push('observaciones debe ser texto');
  if (!Object.values(TipoMedida).includes(datos.tipoMedida as TipoMedida))
    errores.push('tipoMedida debe ser NINGUNA, INTIMACION o CLAUSURA');
  if (
    typeof notificacion?.fechaEmision !== 'string' ||
    !FECHA.test(notificacion.fechaEmision) ||
    !esTexto(notificacion.destinatario) ||
    !esTexto(notificacion.medio)
  )
    errores.push(
      'notificacion debe tener fechaEmision (AAAA-MM-DD), destinatario y medio',
    );
  if (errores.length > 0) throw new BadRequestException(errores);

  return {
    id: datos.id as string,
    inspeccionId: datos.inspeccionId as string,
    fechaEmision,
    ubicacion: (datos.ubicacion as string | null | undefined) ?? null,
    observaciones: datos.observaciones as string,
    tipoMedida: datos.tipoMedida as TipoMedida,
    notificacion: {
      fechaEmision: notificacion.fechaEmision as string,
      destinatario: notificacion.destinatario as string,
      medio: notificacion.medio as string,
    },
  };
}
