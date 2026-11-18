import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ActaEmitida, ActaNueva, ErrorApi, Inspeccion } from './modelos';

/** URL base de la API. En desarrollo `/api` pasa por el proxy de `ng serve` (proxy.conf.json). */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => '/api',
});

/**
 * Devuelve el token de acceso de Auth0 para adjuntarlo a cada llamada.
 * Lo provee el componente `auth` (ver app.config.ts); sin él, las llamadas salen sin token.
 */
export const OBTENER_TOKEN = new InjectionToken<() => Promise<string | null>>('OBTENER_TOKEN', {
  providedIn: 'root',
  factory: () => async () => null,
});

/** Llamadas HTTP al backend con el token adjunto (componente `api-client`). */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_URL);
  private readonly obtenerToken = inject(OBTENER_TOKEN);

  async listarInspecciones(): Promise<Inspeccion[]> {
    return firstValueFrom(
      this.http.get<Inspeccion[]>(`${this.base}/inspecciones`, { headers: await this.encabezados() }),
    );
  }

  /** Envía el acta y sus fotos en un único POST multipart (201 la primera vez, 200 si es un reintento). */
  async enviarActa(acta: ActaNueva, fotos: Blob[]): Promise<ActaEmitida> {
    const datos = new FormData();
    datos.append('acta', JSON.stringify(acta));
    fotos.forEach((foto, i) => datos.append('fotos', foto, `foto-${i + 1}.jpg`));
    return firstValueFrom(
      this.http.post<ActaEmitida>(`${this.base}/actas`, datos, { headers: await this.encabezados() }),
    );
  }

  async obtenerActa(id: string): Promise<ActaEmitida> {
    return firstValueFrom(
      this.http.get<ActaEmitida>(`${this.base}/actas/${encodeURIComponent(id)}`, {
        headers: await this.encabezados(),
      }),
    );
  }

  private async encabezados(): Promise<HttpHeaders> {
    const token = await this.obtenerToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}

/**
 * Sin respuesta del servidor: no hay señal o el servidor no está disponible.
 * `TypeError` es lo que lanza `fetch` sin red (por ejemplo, al renovar el token de Auth0).
 */
export function esFallaDeConexion(error: unknown): boolean {
  return error instanceof HttpErrorResponse ? error.status === 0 : error instanceof TypeError;
}

/** Texto legible del error que devolvió el backend (esquema `Error` del contrato). */
export function mensajeDeError(error: unknown): string {
  if (error instanceof TypeError) {
    return 'Sin conexión con el servidor';
  }
  if (!(error instanceof HttpErrorResponse)) {
    return error instanceof Error ? error.message : 'Error desconocido';
  }
  if (error.status === 0) {
    return 'Sin conexión con el servidor';
  }
  const cuerpo = error.error as Partial<ErrorApi> | null;
  const mensaje = cuerpo?.message;
  if (Array.isArray(mensaje) && mensaje.length > 0) {
    return mensaje.join('. ');
  }
  if (typeof mensaje === 'string' && mensaje.trim() !== '') {
    return mensaje;
  }
  switch (error.status) {
    case 400:
      return 'Los datos del acta no son válidos';
    case 401:
      return 'La sesión venció';
    case 403:
      return 'No tenés permiso para enviar esta acta';
    case 404:
      return 'La inspección no existe';
    case 409:
      return 'La inspección ya tiene otra acta emitida';
    default:
      return `Error del servidor (${error.status})`;
  }
}
