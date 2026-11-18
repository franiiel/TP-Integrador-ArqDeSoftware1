import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { ApiClient, mensajeDeError } from '../api-client/api-client';
import { AuthService } from '../auth/auth.service';
import { ActaLocal, ColaOfflineService } from '../cola-offline/cola-offline.service';
import { InspeccionesService } from '../inspecciones/inspecciones.service';

/** Cada cuánto se reintenta mientras la app está abierta. */
export const INTERVALO_REINTENTO_MS = 60_000;

/**
 * Un error es transitorio si conviene volver a intentar más tarde: sin señal (0), servidor
 * caído o sobrecargado (5xx, 408, 429) o sesión vencida (401, se resuelve renovando el token).
 * Los demás (400, 403, 404, 409...) son rechazos del servidor: reintentar no cambia el resultado.
 */
export function esErrorTransitorio(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) {
    return true;
  }
  const { status } = error;
  return status === 0 || status === 401 || status === 408 || status === 429 || status >= 500;
}

/**
 * Envío de las actas pendientes (componente `sincronizacion`, ADR-03).
 * Reintenta al recuperar la señal, al abrir (o volver a mostrar) la app y cada 60 segundos.
 * No usa Background Sync: Safari no lo tiene y alcanza con reintentar mientras la app está abierta.
 */
@Injectable({ providedIn: 'root' })
export class SincronizacionService {
  private readonly api = inject(ApiClient);
  private readonly cola = inject(ColaOfflineService);
  private readonly inspecciones = inject(InspeccionesService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly enLinea = signal(typeof navigator === 'undefined' ? true : navigator.onLine);
  readonly enviando = signal(false);
  readonly ultimaRevision = signal<string | null>(null);

  private enCurso: Promise<void> | null = null;
  private iniciado = false;

  iniciar(): void {
    if (this.iniciado) {
      return;
    }
    this.iniciado = true;

    const alVolverLaSenal = () => {
      this.enLinea.set(true);
      void this.enviarPendientes();
    };
    const alPerderLaSenal = () => this.enLinea.set(false);
    const alMostrarse = () => {
      if (document.visibilityState === 'visible') {
        void this.enviarPendientes();
      }
    };

    window.addEventListener('online', alVolverLaSenal);
    window.addEventListener('offline', alPerderLaSenal);
    document.addEventListener('visibilitychange', alMostrarse);
    const intervalo = setInterval(() => void this.enviarPendientes(), INTERVALO_REINTENTO_MS);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('online', alVolverLaSenal);
      window.removeEventListener('offline', alPerderLaSenal);
      document.removeEventListener('visibilitychange', alMostrarse);
      clearInterval(intervalo);
    });

    void this.enviarPendientes();
  }

  /** Intenta enviar todas las pendientes. Si ya hay un envío en curso, espera ese mismo. */
  enviarPendientes(): Promise<void> {
    this.enCurso ??= this.procesar().finally(() => (this.enCurso = null));
    return this.enCurso;
  }

  private async procesar(): Promise<void> {
    this.ultimaRevision.set(new Date().toISOString());
    const pendientes = this.cola.paraEnviar();
    // Sin sesión (o con la sesión vencida) no se puede enviar: las actas siguen guardadas.
    if (pendientes.length === 0 || !navigator.onLine || !this.auth.sesionActiva()) {
      return;
    }
    this.enviando.set(true);
    try {
      for (const acta of pendientes) {
        const seguir = await this.enviar(acta);
        if (!seguir) {
          break;
        }
      }
    } finally {
      this.enviando.set(false);
    }
  }

  /** Devuelve `false` si no tiene sentido seguir con las demás (por ejemplo, sin señal). */
  private async enviar(acta: ActaLocal): Promise<boolean> {
    const intento = { intentos: acta.intentos + 1, ultimoIntento: new Date().toISOString() };
    try {
      const emitida = await this.api.enviarActa(acta.acta, acta.fotos);
      await this.cola.guardar({
        ...acta,
        ...intento,
        estadoLocal: 'ENVIADA',
        fotos: [],
        ultimoError: null,
        emitida,
      });
      await this.inspecciones.marcarActaEmitida(acta.acta.inspeccionId, emitida.id);
      this.enLinea.set(true);
      return true;
    } catch (error) {
      if (esErrorTransitorio(error)) {
        await this.cola.guardar({ ...acta, ...intento, ultimoError: mensajeDeError(error) });
        return false;
      }
      await this.cola.guardar({
        ...acta,
        ...intento,
        estadoLocal: 'RECHAZADA',
        ultimoError: null,
        motivoRechazo: mensajeDeError(error),
      });
      return true;
    }
  }
}
