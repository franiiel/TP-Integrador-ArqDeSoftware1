import { Component, inject } from '@angular/core';
import { Rol } from '../api-client/modelos';
import { AuthService } from './auth.service';

const TEXTO_ROL: Record<Rol, string> = {
  INSPECTOR: 'Inspector',
  SUPERVISOR: 'Supervisor',
  ADMINISTRATIVO: 'Administrativo',
};

/** Funciones de cada rol que quedan solo diseñadas en el TP (ver la documentación de la entrega). */
const FUNCIONES_DISENADAS: Record<Rol, string[]> = {
  INSPECTOR: [],
  SUPERVISOR: [
    'Asignar las inspecciones a los inspectores.',
    'Revisar las actas emitidas.',
    'Rectificar o anular un acta cuando corresponde.',
  ],
  ADMINISTRATIVO: [
    'Consultar las inspecciones y las actas registradas.',
    'Ver si cada acta quedó asociada a su expediente.',
  ],
};

/**
 * Pantalla `/sin-permiso`: el usuario ingresó con un rol que no es inspector.
 * Las pantallas de supervisor y administrativo quedan solo diseñadas (alcance del TP),
 * así que se muestra una bienvenida con lo que va a poder hacer ese rol.
 */
@Component({
  selector: 'app-sin-permiso',
  template: `
    <section class="pagina pagina-ingreso">
      @if (auth.usuario(); as usuario) {
        <p class="rol-chip">{{ textoRol[usuario.rol] }}</p>
        <h1>Hola, {{ usuario.nombre }}</h1>
        @if (usuario.cargo) {
          <p class="texto-tenue">{{ usuario.cargo }}</p>
        }

        @if (funciones[usuario.rol].length > 0) {
          <div class="tarjeta rol-funciones">
            <h2>Lo que vas a poder hacer</h2>
            <ul>
              @for (funcion of funciones[usuario.rol]; track funcion) {
                <li>{{ funcion }}</li>
              }
            </ul>
            <p class="aviso">
              Estas pantallas están diseñadas pero todavía no implementadas: esta versión del sistema solo incluye las
              pantallas del inspector.
            </p>
          </div>
        }
      } @else {
        <h1>Sin acceso a estas pantallas</h1>
        <p class="texto-tenue">Esta versión de la aplicación solo tiene las pantallas del inspector.</p>
      }
      <button type="button" class="boton boton-secundario boton-ancho" (click)="salir()">Cerrar sesión</button>
    </section>
  `,
})
export class SinPermiso {
  protected readonly auth = inject(AuthService);
  protected readonly textoRol = TEXTO_ROL;
  protected readonly funciones = FUNCIONES_DISENADAS;

  protected salir(): void {
    void this.auth.salir();
  }
}
