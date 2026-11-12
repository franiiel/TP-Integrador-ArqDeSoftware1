import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, isDevMode, signal } from '@angular/core';
import { Auth0Client, GenericError } from '@auth0/auth0-spa-js';
import { firstValueFrom } from 'rxjs';
import { API_URL, esFallaDeConexion, mensajeDeError } from '../api-client/api-client';
import { Usuario } from '../api-client/modelos';
import { STORE_CACHE, borrarTodo, guardar, leer } from '../almacenamiento/base-local';
import { ColaOfflineService } from '../cola-offline/cola-offline.service';
import { CONEXION_GOOGLE, CONFIGURACION_AUTH0 } from './configuracion-auth0';

const CLAVE_USUARIO = 'usuario';
const CLAVE_SESION_PRUEBA = 'sesion-prueba';

/** Errores de Auth0 que significan "hay que volver a iniciar sesión" (no se arreglan reintentando). */
const ERRORES_SESION_VENCIDA = [
  'login_required',
  'missing_refresh_token',
  'invalid_grant',
  'consent_required',
  'interaction_required',
];

export const AUTH0_CONFIGURADO = !Object.values(CONFIGURACION_AUTH0).some((valor) => valor.includes('COMPLETAR'));

/** Sin Auth0 configurado, en desarrollo se entra con una sesión de prueba (sin token). */
export const MODO_PRUEBA = !AUTH0_CONFIGURADO && isDevMode();

interface EstadoRedireccion {
  destino?: string;
}

/**
 * Sesión del usuario (componente `auth`, ADR-01): login con Google a través de Auth0,
 * renovación del token con refresh tokens rotativos y datos del usuario (`GET /api/me`).
 * Los datos del usuario quedan guardados en el celular para poder abrir la app sin señal.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly cola = inject(ColaOfflineService);

  private cliente: Auth0Client | null = null;
  private inicio: Promise<void> | null = null;

  readonly autenticado = signal(false);
  readonly usuario = signal<Usuario | null>(null);
  readonly cargandoUsuario = signal(false);
  /** El refresh token venció o fue revocado: hay que volver a ingresar para seguir enviando. */
  readonly sesionVencida = signal(false);
  readonly error = signal<string | null>(null);

  /** Hay sesión y se pueden hacer llamadas a la API. */
  readonly sesionActiva = computed(() => this.autenticado() && !this.sesionVencida());

  /** Se llama al arrancar la app, antes de la primera navegación. */
  iniciar(): Promise<void> {
    this.inicio ??= this.iniciarSesion();
    return this.inicio;
  }

  /** Lleva al login de Auth0 con Google. Al volver, la app sigue en `destino`. */
  async ingresar(destino = '/inspecciones'): Promise<void> {
    this.error.set(null);
    if (MODO_PRUEBA) {
      escribirLocal(CLAVE_SESION_PRUEBA, '1');
      this.autenticado.set(true);
      await this.cargarUsuario();
      return;
    }
    if (!this.cliente) {
      this.error.set('Falta configurar Auth0 en src/app/auth/configuracion-auth0.ts.');
      return;
    }
    await this.cliente.loginWithRedirect<EstadoRedireccion>({
      authorizationParams: { connection: CONEXION_GOOGLE },
      appState: { destino: destinoSeguro(destino) },
    });
  }

  /**
   * Cierra la sesión y borra lo guardado en el celular.
   * Devuelve `false` sin hacer nada si quedan actas pendientes de envío (ADR-03).
   */
  async salir(): Promise<boolean> {
    if (this.cola.hayPendientesDeEnvio()) {
      return false;
    }
    await borrarTodo();
    if (this.cliente) {
      await this.cliente.logout({ logoutParams: { returnTo: `${location.origin}/ingresar` } });
    } else {
      borrarLocal(CLAVE_SESION_PRUEBA);
      // Recargar deja todos los servicios en blanco.
      location.assign('/ingresar');
    }
    return true;
  }

  /** Token de acceso para la API (lo usa `api-client`). Se renueva solo con el refresh token. */
  async obtenerToken(): Promise<string | null> {
    if (!this.cliente) {
      return null;
    }
    try {
      const token = await this.cliente.getTokenSilently();
      this.sesionVencida.set(false);
      return token ?? null;
    } catch (e) {
      if (e instanceof GenericError && ERRORES_SESION_VENCIDA.includes(e.error)) {
        this.sesionVencida.set(true);
        throw new Error('La sesión venció: volvé a ingresar');
      }
      throw e;
    }
  }

  /** Pide los datos del usuario al backend y los guarda en el celular. */
  async actualizarUsuario(): Promise<void> {
    this.cargandoUsuario.set(true);
    try {
      const token = await this.obtenerToken();
      const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
      const usuario = await firstValueFrom(this.http.get<Usuario>(`${this.apiUrl}/me`, { headers }));
      this.usuario.set(usuario);
      this.error.set(null);
      await guardar(STORE_CACHE, usuario, CLAVE_USUARIO);
    } catch (e) {
      // Con los datos guardados se puede seguir trabajando; solo es un problema la primera vez.
      if (!this.usuario()) {
        this.error.set(
          esFallaDeConexion(e)
            ? 'Sin señal: la primera vez que ingresás hace falta conexión.'
            : `No se pudieron cargar tus datos: ${mensajeDeError(e)}`,
        );
      }
    } finally {
      this.cargandoUsuario.set(false);
    }
  }

  private async iniciarSesion(): Promise<void> {
    try {
      if (MODO_PRUEBA) {
        this.autenticado.set(leerLocal(CLAVE_SESION_PRUEBA) === '1');
      } else if (AUTH0_CONFIGURADO) {
        // El constructor no usa la red: sin señal, la sesión guardada sigue valiendo.
        this.cliente = new Auth0Client({
          domain: CONFIGURACION_AUTH0.domain,
          clientId: CONFIGURACION_AUTH0.clientId,
          cacheLocation: 'localstorage',
          useRefreshTokens: true,
          useRefreshTokensFallback: false,
          authorizationParams: {
            redirect_uri: location.origin,
            audience: CONFIGURACION_AUTH0.audience,
            scope: 'openid profile email offline_access',
          },
        });
        await this.procesarVueltaDeAuth0();
        this.autenticado.set(await this.cliente.isAuthenticated());
      }
      if (this.autenticado()) {
        await this.cargarUsuario();
      }
    } catch (e) {
      this.error.set(`No se pudo iniciar sesión: ${mensajeDeError(e)}`);
    }
  }

  /** Si la página se abrió al volver del login de Auth0, completa el ingreso. */
  private async procesarVueltaDeAuth0(): Promise<void> {
    const parametros = new URLSearchParams(location.search);
    if (!this.cliente || !parametros.has('state') || !(parametros.has('code') || parametros.has('error'))) {
      return;
    }
    let destino = '/inspecciones';
    try {
      const { appState } = await this.cliente.handleRedirectCallback<EstadoRedireccion>();
      destino = destinoSeguro(appState?.destino);
    } finally {
      // Saca `code` y `state` de la dirección antes de que el router navegue.
      history.replaceState(null, '', destino);
    }
  }

  private async cargarUsuario(): Promise<void> {
    const guardado = await leer<Usuario>(STORE_CACHE, CLAVE_USUARIO);
    if (guardado) {
      this.usuario.set(guardado);
      void this.actualizarUsuario();
    } else {
      await this.actualizarUsuario();
    }
  }
}

/** Solo rutas internas de la app, para que nadie pueda armar un link que redirija a otro sitio. */
export function destinoSeguro(destino: string | null | undefined): string {
  return destino && destino.startsWith('/') && !destino.startsWith('//') ? destino : '/inspecciones';
}

function leerLocal(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribirLocal(clave: string, valor: string): void {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    // Sin localStorage, la sesión de prueba dura hasta recargar.
  }
}

function borrarLocal(clave: string): void {
  try {
    localStorage.removeItem(clave);
  } catch {
    // Nada que borrar.
  }
}
