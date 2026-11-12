import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { ColaOfflineService } from './cola-offline/cola-offline.service';
import { BACKEND_SIMULADO_ACTIVO } from './simulador/backend-simulado';
import { SincronizacionService } from './sincronizacion/sincronizacion.service';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly cola = inject(ColaOfflineService);
  private readonly sincronizacion = inject(SincronizacionService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly backendSimulado = BACKEND_SIMULADO_ACTIVO;
  protected readonly enLinea = this.sincronizacion.enLinea;
  protected readonly cantidadPendientes = computed(() => this.cola.noEnviadas().length);
  protected readonly esInspector = computed(() => this.auth.usuario()?.rol === 'INSPECTOR');

  protected async salir(): Promise<void> {
    const pendientes = this.cola.paraEnviar().length;
    if (pendientes > 0) {
      alert(
        pendientes === 1
          ? 'No podés cerrar sesión: hay 1 acta pendiente de envío. Se va a enviar sola cuando haya señal.'
          : `No podés cerrar sesión: hay ${pendientes} actas pendientes de envío. Se van a enviar solas cuando haya señal.`,
      );
      return;
    }
    const rechazadas = this.cola.noEnviadas().length;
    const pregunta =
      rechazadas > 0
        ? `Al cerrar sesión se borran del celular ${rechazadas} acta(s) rechazada(s) por el servidor. ¿Cerrar sesión?`
        : '¿Cerrar sesión?';
    if (confirm(pregunta)) {
      await this.auth.salir();
    }
  }

  protected volverAIngresar(): void {
    void this.auth.ingresar(this.router.url);
  }
}
