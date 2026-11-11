import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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

  protected readonly backendSimulado = BACKEND_SIMULADO_ACTIVO;
  protected readonly enLinea = this.sincronizacion.enLinea;
  protected readonly cantidadPendientes = computed(() => this.cola.noEnviadas().length);
}
