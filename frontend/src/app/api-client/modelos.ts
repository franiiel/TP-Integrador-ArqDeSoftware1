// Tipos del contrato de la API (docs/openapi.yaml). Si cambia el contrato, se cambian acá.

export type TipoMedida = 'NINGUNA' | 'INTIMACION' | 'CLAUSURA';

export type Rol = 'INSPECTOR' | 'SUPERVISOR' | 'ADMINISTRATIVO';

/** Usuario autenticado (`GET /api/me`). */
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  /** Solo inspector y supervisor. */
  cargo?: string | null;
  /** Solo inspector y supervisor. */
  legajo?: string | null;
}

/** Estado de la asociación del acta al expediente en el sistema municipal. */
export type EstadoActa = 'PENDIENTE_ASOCIACION' | 'ASOCIADA';

export interface Inspeccion {
  id: string;
  /** Fecha `YYYY-MM-DD`. */
  fecha: string;
  ubicacion: string | null;
  obra: {
    direccion: string;
    propietario: string;
    responsable: string;
  };
  expediente: {
    identificadorExterno: number;
  };
  /** Acta ya emitida para esta inspección, si existe. */
  actaId?: string | null;
}

export interface NotificacionNueva {
  /** Fecha `YYYY-MM-DD`. */
  fechaEmision: string;
  destinatario: string;
  medio: string;
}

/** Acta tal como la envía el celular. */
export interface ActaNueva {
  /** UUID generado en el celular: hace idempotente el envío. */
  id: string;
  inspeccionId: string;
  /** Fecha legal del acta (date-time), tomada del celular al emitirla. */
  fechaEmision: string;
  /** `"lat,lon"` o `null` si no se pudo obtener. */
  ubicacion: string | null;
  observaciones: string;
  tipoMedida: TipoMedida;
  notificacion: NotificacionNueva;
}

export interface ActaEmitida {
  id: string;
  /** Correlativo por año asignado por el servidor, por ejemplo `2026-00001`. */
  numero: string;
  estado: EstadoActa;
  fechaEmision: string;
  fechaHoraRecepcion: string;
}

export interface ErrorApi {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export const MEDIDAS: { valor: TipoMedida; texto: string }[] = [
  { valor: 'NINGUNA', texto: 'Ninguna' },
  { valor: 'INTIMACION', texto: 'Intimación' },
  { valor: 'CLAUSURA', texto: 'Clausura' },
];

export function textoMedida(tipo: TipoMedida): string {
  return MEDIDAS.find((m) => m.valor === tipo)?.texto ?? tipo;
}
