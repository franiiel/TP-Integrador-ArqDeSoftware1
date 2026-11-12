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
import { OBTENER_TOKEN } from './api-client/api-client';
import { routes } from './app.routes';
import { AuthService } from './auth/auth.service';
import { ColaOfflineService } from './cola-offline/cola-offline.service';
import { InspeccionesService } from './inspecciones/inspecciones.service';
import { BACKEND_SIMULADO_ACTIVO, backendSimulado } from './simulador/backend-simulado';
import { SincronizacionService } from './sincronizacion/sincronizacion.service';

registerLocaleData(localeEsAr);

/**
 * Al abrir la app, antes de la primera navegación: retoma la sesión (o termina el login
 * si se vuelve de Auth0), carga lo guardado en el celular y arranca el reenvío de pendientes.
 */
async function iniciarApp(): Promise<void> {
  const auth = inject(AuthService);
  const cola = inject(ColaOfflineService);
  const inspecciones = inject(InspeccionesService);
  const sincronizacion = inject(SincronizacionService);

  void pedirAlmacenamientoPersistente();
  await auth.iniciar();
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
    {
      provide: OBTENER_TOKEN,
      useFactory: () => {
        const auth = inject(AuthService);
        return () => auth.obtenerToken();
      },
    },
    provideAppInitializer(iniciarApp),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
