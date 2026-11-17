import { Component, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Rol } from '../api-client/modelos';
import { SincronizacionService } from '../sincronizacion/sincronizacion.service';
import { AUTH0_CONFIGURADO, AuthService, MODO_PRUEBA, destinoSeguro } from './auth.service';

/** Pantalla `/ingresar`: login con la cuenta de Google a través de Auth0. */
@Component({
  selector: 'app-ingresar',
  template: `
    <section class="pagina pagina-ingreso">
      <!-- Ícono propio: casco de obra (reemplaza el logo de Angular) -->
      <svg class="ingreso-logo" viewBox="0 0 64 64" width="88" height="88" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="var(--color-superficie)" />
        <path d="M14 42a18 18 0 0 1 36 0z" fill="var(--color-principal)" />
        <path d="M28 24.5V18h8v6.5" fill="none" stroke="var(--color-principal-oscuro)" stroke-width="3" stroke-linejoin="round" />
        <rect x="10" y="41" width="44" height="6" rx="3" fill="var(--color-principal-oscuro)" />
      </svg>
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
          @if (modoPrueba) {
            <p class="ingreso-pregunta">Ingresar como</p>
            <div class="ingreso-roles">
              @for (opcion of roles; track opcion.rol) {
                <button
                  type="button"
                  class="boton boton-ancho"
                  [class.boton-secundario]="opcion.rol !== 'INSPECTOR'"
                  (click)="ingresar(opcion.rol)"
                >
                  {{ opcion.texto }}
                </button>
              }
            </div>
            <p class="texto-tenue">
              Sesión de prueba: Auth0 todavía no está configurado, así que en desarrollo se elige el rol sin login real.
            </p>
          } @else {
            <button type="button" class="boton boton-principal" (click)="ingresar()">Ingresar con Google</button>
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
  /** Roles que se pueden elegir en la sesión de prueba. Con Auth0 el rol viene del backend. */
  protected readonly roles: { rol: Rol; texto: string }[] = [
    { rol: 'INSPECTOR', texto: 'Inspector' },
    { rol: 'SUPERVISOR', texto: 'Supervisor' },
    { rol: 'ADMINISTRATIVO', texto: 'Administrativo' },
  ];
  protected readonly enLinea = inject(SincronizacionService).enLinea;

  constructor() {
    // Con la sesión y los datos del usuario cargados, sigue a la pantalla que corresponde.
    effect(() => {
      if (this.auth.autenticado() && this.auth.usuario()) {
        void this.router.navigateByUrl(destinoSeguro(this.destino()), { replaceUrl: true });
      }
    });
  }

  protected ingresar(rol?: Rol): void {
    void this.auth.ingresar(destinoSeguro(this.destino()), rol);
  }

  protected reintentar(): void {
    void this.auth.actualizarUsuario();
  }

  protected salir(): void {
    void this.auth.salir();
  }
}
