import { Inspeccion } from '../api-client/modelos';
import { ActaLocal } from '../cola-offline/cola-offline.service';

/**
 * - `FALTA_ACTA`: todavía no se emitió el acta.
 * - `PENDIENTE`: el acta está guardada en el celular y no llegó al servidor.
 * - `RECHAZADA`: el servidor rechazó el acta; se puede volver a emitir.
 * - `EMITIDA`: el servidor recibió el acta.
 */
export type EstadoInspeccion = 'FALTA_ACTA' | 'PENDIENTE' | 'RECHAZADA' | 'EMITIDA';

export interface SituacionInspeccion {
  estado: EstadoInspeccion;
  /** Acta a la que lleva el detalle, si hay. */
  actaId: string | null;
}

/** Combina lo que dice el servidor (`actaId`) con lo que hay guardado en el celular. */
export function situacionDe(inspeccion: Inspeccion, local: ActaLocal | undefined): SituacionInspeccion {
  if (inspeccion.actaId) {
    return { estado: 'EMITIDA', actaId: inspeccion.actaId };
  }
  switch (local?.estadoLocal) {
    case 'ENVIADA':
      return { estado: 'EMITIDA', actaId: local.id };
    case 'PENDIENTE':
      return { estado: 'PENDIENTE', actaId: local.id };
    case 'RECHAZADA':
      return { estado: 'RECHAZADA', actaId: local.id };
    default:
      return { estado: 'FALTA_ACTA', actaId: null };
  }
}

export const TEXTO_ESTADO: Record<EstadoInspeccion, string> = {
  FALTA_ACTA: 'Falta emitir el acta',
  PENDIENTE: 'Acta pendiente de envío',
  RECHAZADA: 'Acta rechazada',
  EMITIDA: 'Acta emitida',
};
