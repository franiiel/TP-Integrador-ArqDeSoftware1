import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localeEsAr from '@angular/common/locales/es-AR';
import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { pedirAlmacenamientoPersistente } from './almacenamiento/base-local';
import { routes } from './app.routes';
import { BACKEND_SIMULADO_ACTIVO, backendSimulado } from './simulador/backend-simulado';
import { ColaOfflineService } from './cola-offline/cola-offline.service';
import { InspeccionesService } from './inspecciones/inspecciones.service';
import { SincronizacionService } from './sincronizacion/sincronizacion.service';

registerLocaleData(localeEsAr);

/** Al abrir la app: carga lo guardado en el celular y arranca el reenvío de pendientes. */
async function iniciarModoSinConexion(): Promise<void> {
  const cola = inject(ColaOfflineService);
  const inspecciones = inject(InspeccionesService);
  const sincronizacion = inject(SincronizacionService);

  void pedirAlmacenamientoPersistente();
  try {
    await Promise.all([cola.cargar(), inspecciones.cargarGuardada()]);
  } catch (e) {
    console.error('No se pudo leer lo guardado en el celular', e);
  }
  sincronizacion.iniciar();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors(BACKEND_SIMULADO_ACTIVO ? [backendSimulado] : [])),
    { provide: LOCALE_ID, useValue: 'es-AR' },
    provideAppInitializer(iniciarModoSinConexion),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
