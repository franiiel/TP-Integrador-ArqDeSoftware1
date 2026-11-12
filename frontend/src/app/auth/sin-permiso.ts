import { Component, inject } from '@angular/core';
import { AuthService } from './auth.service';

const TEXTO_ROL = {
  INSPECTOR: 'Inspector',
  SUPERVISOR: 'Supervisor',
  ADMINISTRATIVO: 'Administrativo',
} as const;

/**
 * Pantalla `/sin-permiso`: el usuario ingresó pero su rol no es inspector.
 * Las pantallas de supervisor y administrativo quedan solo diseñadas (alcance del TP).
 */
@Component({
  selector: 'app-sin-permiso',
  template: `
    <section class="pagina pagina-ingreso">
      <h1>Sin acceso a estas pantallas</h1>
      @if (auth.usuario(); as usuario) {
        <p>
          Ingresaste como <strong>{{ usuario.nombre }}</strong> con el rol
          <strong>{{ textoRol[usuario.rol] }}</strong>.
        </p>
      }
      <p class="texto-tenue">
        Esta versión de la aplicación solo tiene las pantallas del inspector. Las de supervisor y
        administrativo todavía no están disponibles.
      </p>
      <button type="button" class="boton boton-secundario boton-ancho" (click)="salir()">Cerrar sesión</button>
    </section>
  `,
})
export class SinPermiso {
  protected readonly auth = inject(AuthService);
  protected readonly textoRol = TEXTO_ROL;

  protected salir(): void {
    void this.auth.salir();
  }
}
