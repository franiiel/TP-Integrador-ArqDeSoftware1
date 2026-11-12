import { Component, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { SincronizacionService } from '../sincronizacion/sincronizacion.service';
import { AUTH0_CONFIGURADO, AuthService, MODO_PRUEBA, destinoSeguro } from './auth.service';

/** Pantalla `/ingresar`: login con la cuenta de Google a través de Auth0. */
@Component({
  selector: 'app-ingresar',
  template: `
    <section class="pagina pagina-ingreso">
      <img class="ingreso-logo" src="icons/icon-192x192.png" alt="" width="96" height="96" />
      <h1>Inspecciones de obra</h1>
      <p class="texto-tenue">Dirección de Obras Particulares</p>

      @if (auth.error(); as mensaje) {
        <p class="aviso aviso-error" role="alert">{{ mensaje }}</p>
      }

      @if (auth.autenticado() && !auth.usuario()) {
        @if (auth.cargandoUsuario()) {
          <p class="texto-tenue">Cargando tus datos…</p>
        } @else {
          <button type="button" class="boton boton-principal" (click)="reintentar()">Reintentar</button>
          <button type="button" class="boton boton-secundario boton-ancho" (click)="salir()">Ingresar con otra cuenta</button>
        }
      } @else if (!auth.autenticado()) {
        @if (!configurado) {
          <p class="aviso aviso-error">Falta configurar Auth0 en src/app/auth/configuracion-auth0.ts.</p>
        } @else {
          <button type="button" class="boton boton-principal" (click)="ingresar()">
            {{ modoPrueba ? 'Ingresar (sesión de prueba)' : 'Ingresar con Google' }}
          </button>
          @if (modoPrueba) {
            <p class="texto-tenue">
              Auth0 todavía no está configurado: en desarrollo se entra como un inspector de prueba, sin login real.
            </p>
          }
          @if (!enLinea()) {
            <p class="aviso aviso-alerta" role="status">Sin señal: para ingresar hace falta conexión.</p>
          }
        }
      }
    </section>
  `,
})
export class Ingresar {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Query param `?destino=` con la pantalla a la que quería ir. */
  readonly destino = input<string>();

  protected readonly configurado = AUTH0_CONFIGURADO || MODO_PRUEBA;
  protected readonly modoPrueba = MODO_PRUEBA;
  protected readonly enLinea = inject(SincronizacionService).enLinea;

  constructor() {
    // Con la sesión y los datos del usuario cargados, sigue a la pantalla que corresponde.
    effect(() => {
      if (this.auth.autenticado() && this.auth.usuario()) {
        void this.router.navigateByUrl(destinoSeguro(this.destino()), { replaceUrl: true });
      }
    });
  }

  protected ingresar(): void {
    void this.auth.ingresar(destinoSeguro(this.destino()));
  }

  protected reintentar(): void {
    void this.auth.actualizarUsuario();
  }

  protected salir(): void {
    void this.auth.salir();
  }
}
