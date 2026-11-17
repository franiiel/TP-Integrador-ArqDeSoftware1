import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { Observable, defer, delay, of, throwError } from 'rxjs';
import { ActaEmitida, ActaNueva, Inspeccion, Rol, Usuario } from '../api-client/modelos';
import { leerRolDePrueba } from '../auth/sesion-prueba';

/**
 * Backend simulado SOLO PARA DESARROLLO: responde `GET /api/me`, `GET /api/inspecciones`,
 * `POST /api/actas` y `GET /api/actas/:id` según docs/openapi.yaml, sin llamar al backend real.
 * Nunca se activa en el build de producción.
 * Cuando el backend tenga esos endpoints, poner esto en `false` (o borrar la carpeta `simulador`).
 */
const USAR_BACKEND_SIMULADO = true;

export const BACKEND_SIMULADO_ACTIVO = USAR_BACKEND_SIMULADO && isDevMode();

/** Demora de cada respuesta, para que se vean los estados "Actualizando…" y "Enviando…". */
const DEMORA_MS = 700;
/** Tiempo hasta que un acta recibida pasa a "asociada al expediente" (simula al sistema municipal). */
const DEMORA_ASOCIACION_MS = 30_000;
const CLAVE_ESTADO = 'backend-simulado';

interface ActaGuardada extends ActaEmitida {
  inspeccionId: string;
  recibidaEnMs: number;
}

interface EstadoSimulado {
  ultimoNumero: number;
  actas: ActaGuardada[];
}

/** Los usuarios que devuelve `GET /api/me`, según el rol elegido al ingresar en la sesión de prueba. */
const USUARIOS: Record<Rol, Usuario> = {
  INSPECTOR: {
    id: '3b2a1c0d-0000-4000-8000-000000000001',
    nombre: 'Inspector de prueba',
    email: 'inspector.prueba@example.com',
    rol: 'INSPECTOR',
    cargo: 'Inspector de obras',
    legajo: '1234',
  },
  SUPERVISOR: {
    id: '3b2a1c0d-0000-4000-8000-000000000002',
    nombre: 'Supervisor de prueba',
    email: 'supervisor.prueba@example.com',
    rol: 'SUPERVISOR',
    cargo: 'Supervisor de inspecciones',
    legajo: '2345',
  },
  ADMINISTRATIVO: {
    id: '3b2a1c0d-0000-4000-8000-000000000003',
    nombre: 'Administrativo de prueba',
    email: 'administrativo.prueba@example.com',
    rol: 'ADMINISTRATIVO',
    cargo: 'Administrativo de Obras Particulares',
    legajo: '3456',
  },
};

const INSPECCIONES: Inspeccion[] = [
  {
    id: '6f1c2b8e-1a2b-4c3d-8e9f-000000000001',
    fecha: hoyMasDias(0),
    ubicacion: '-34.588200,-58.637900',
    obra: { direccion: 'Av. Vergara 2450, Hurlingham', propietario: 'María Gómez', responsable: 'Arq. Pablo Ruiz' },
    expediente: { identificadorExterno: 15234 },
  },
  {
    id: '6f1c2b8e-1a2b-4c3d-8e9f-000000000002',
    fecha: hoyMasDias(0),
    ubicacion: null,
    obra: { direccion: 'Jauretche 1120, Hurlingham', propietario: 'Constructora Del Oeste S.A.', responsable: 'Ing. Laura Pérez' },
    expediente: { identificadorExterno: 15240 },
  },
  {
    id: '6f1c2b8e-1a2b-4c3d-8e9f-000000000003',
    fecha: hoyMasDias(1),
    ubicacion: null,
    obra: { direccion: 'Pedro Díaz 875, Villa Tesei', propietario: 'Jorge Benítez', responsable: 'MMO Hernán Sosa' },
    expediente: { identificadorExterno: 15251 },
  },
  {
    id: '6f1c2b8e-1a2b-4c3d-8e9f-000000000004',
    fecha: hoyMasDias(-1),
    ubicacion: null,
    obra: { direccion: 'Roca 3300, William C. Morris', propietario: 'Ana Fernández', responsable: 'Arq. Diego Molina' },
    expediente: { identificadorExterno: 15198 },
  },
];

/** La inspección de ayer ya tiene un acta emitida y asociada. */
const ESTADO_INICIAL: EstadoSimulado = {
  ultimoNumero: 1,
  actas: [
    {
      id: '9a8b7c6d-0000-4000-8000-000000000001',
      inspeccionId: INSPECCIONES[3].id,
      numero: `${new Date().getFullYear()}-00001`,
      estado: 'ASOCIADA',
      fechaEmision: `${hoyMasDias(-1)}T15:20:00.000Z`,
      fechaHoraRecepcion: `${hoyMasDias(-1)}T15:21:10.000Z`,
      recibidaEnMs: 0,
    },
  ],
};

export const backendSimulado: HttpInterceptorFn = (req, next) => {
  const ruta = new URL(req.url, location.origin).pathname;
  if (!ruta.startsWith('/api/') || ruta.startsWith('/api/docs')) {
    return next(req);
  }
  return defer(() => {
    // Con "Offline" en las herramientas del navegador se comporta como si no hubiera señal.
    if (!navigator.onLine) {
      return throwError(() => new HttpErrorResponse({ status: 0, statusText: 'Unknown Error', url: req.url }));
    }
    return responder(req, ruta);
  }).pipe(delay(DEMORA_MS));
};

function responder(req: HttpRequest<unknown>, ruta: string): Observable<HttpResponse<unknown>> {
  const estado = leerEstado();

  if (req.method === 'GET' && ruta === '/api/me') {
    return ok(200, USUARIOS[leerRolDePrueba() ?? 'INSPECTOR']);
  }

  if (req.method === 'GET' && ruta === '/api/inspecciones') {
    const lista = INSPECCIONES.map((i) => ({
      ...i,
      actaId: estado.actas.find((a) => a.inspeccionId === i.id)?.id ?? null,
    }));
    return ok(200, lista);
  }

  const actaPorId = /^\/api\/actas\/([^/]+)$/.exec(ruta);
  if (req.method === 'GET' && actaPorId) {
    const acta = estado.actas.find((a) => a.id === decodeURIComponent(actaPorId[1]));
    return acta ? ok(200, publica(acta)) : error(404, 'El acta no existe', 'Not Found');
  }

  if (req.method === 'POST' && ruta === '/api/actas') {
    return recibirActa(req, estado);
  }

  return error(404, `Cannot ${req.method} ${ruta}`, 'Not Found');
}

function recibirActa(req: HttpRequest<unknown>, estado: EstadoSimulado): Observable<HttpResponse<unknown>> {
  if (!(req.body instanceof FormData)) {
    return error(400, 'Se esperaba multipart/form-data', 'Bad Request');
  }
  let acta: ActaNueva;
  try {
    acta = JSON.parse(String(req.body.get('acta'))) as ActaNueva;
  } catch {
    return error(400, 'El campo acta no es un JSON válido', 'Bad Request');
  }
  const fotos = req.body.getAll('fotos');

  // Idempotencia: el mismo UUID devuelve la misma acta con 200.
  const existente = estado.actas.find((a) => a.id === acta.id);
  if (existente) {
    return ok(200, publica(existente));
  }
  if (!INSPECCIONES.some((i) => i.id === acta.inspeccionId)) {
    return error(404, 'La inspección no existe', 'Not Found');
  }
  if (estado.actas.some((a) => a.inspeccionId === acta.inspeccionId)) {
    return error(409, 'La inspección ya tiene un acta emitida', 'Conflict');
  }
  if (fotos.length < 1 || fotos.length > 10) {
    return error(400, 'El acta debe tener entre 1 y 10 fotos', 'Bad Request');
  }
  if (!acta.observaciones?.trim() || !acta.notificacion?.destinatario?.trim()) {
    return error(400, 'Faltan datos obligatorios del acta', 'Bad Request');
  }

  const ahora = new Date();
  const numero = estado.ultimoNumero + 1;
  const guardada: ActaGuardada = {
    id: acta.id,
    inspeccionId: acta.inspeccionId,
    numero: `${ahora.getFullYear()}-${String(numero).padStart(5, '0')}`,
    estado: 'PENDIENTE_ASOCIACION',
    fechaEmision: acta.fechaEmision,
    fechaHoraRecepcion: ahora.toISOString(),
    recibidaEnMs: ahora.getTime(),
  };
  guardarEstado({ ultimoNumero: numero, actas: [...estado.actas, guardada] });
  return ok(201, publica(guardada));
}

/** El acta como la devuelve la API; pasado un rato, figura asociada al expediente. */
function publica(acta: ActaGuardada): ActaEmitida {
  const asociada = acta.estado === 'ASOCIADA' || Date.now() - acta.recibidaEnMs >= DEMORA_ASOCIACION_MS;
  return {
    id: acta.id,
    numero: acta.numero,
    estado: asociada ? 'ASOCIADA' : 'PENDIENTE_ASOCIACION',
    fechaEmision: acta.fechaEmision,
    fechaHoraRecepcion: acta.fechaHoraRecepcion,
  };
}

function ok(status: number, body: unknown): Observable<HttpResponse<unknown>> {
  return of(new HttpResponse({ status, body }));
}

function error(statusCode: number, message: string, nombre: string): Observable<never> {
  return throwError(
    () => new HttpErrorResponse({ status: statusCode, statusText: nombre, error: { statusCode, message, error: nombre } }),
  );
}

/** Lo que "recibió el servidor" se guarda en localStorage para que sobreviva a recargar la página. */
function leerEstado(): EstadoSimulado {
  try {
    const guardado = localStorage.getItem(CLAVE_ESTADO);
    if (guardado) {
      return JSON.parse(guardado) as EstadoSimulado;
    }
  } catch {
    // Si no se puede leer, arranca de cero.
  }
  return structuredClone(ESTADO_INICIAL);
}

function guardarEstado(estado: EstadoSimulado): void {
  try {
    localStorage.setItem(CLAVE_ESTADO, JSON.stringify(estado));
  } catch {
    // Sin localStorage el simulador funciona igual hasta recargar.
  }
}

function hoyMasDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const dosDigitos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
}
