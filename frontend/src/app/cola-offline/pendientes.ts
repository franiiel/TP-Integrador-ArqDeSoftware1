import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { INTERVALO_REINTENTO_MS, SincronizacionService } from '../sincronizacion/sincronizacion.service';
import { ColaOfflineService } from './cola-offline.service';

/** Pantalla `/pendientes`: actas guardadas en el celular que todavía no llegaron al servidor. */
@Component({
  selector: 'app-pendientes',
  imports: [RouterLink, DatePipe],
  template: `
    <section class="pagina">
      <header class="pagina-encabezado">
        <h1>Pendientes</h1>
        <button
          type="button"
          class="boton boton-secundario"
          (click)="reintentar()"
          [disabled]="enviando() || paraEnviar() === 0"
        >
          {{ enviando() ? 'Enviando…' : 'Reintentar ahora' }}
        </button>
      </header>

      <p class="texto-tenue">
        El envío se reintenta solo al volver la señal, al abrir la app y cada {{ segundos }} segundos.
        @if (ultimaRevision(); as fecha) {
          Último intento: {{ fecha | date: 'HH:mm:ss' }}.
        }
      </p>
      @if (!enLinea()) {
        <p class="aviso aviso-alerta" role="status">Sin señal. Las actas quedan guardadas en el celular.</p>
      }

      @for (a of actas(); track a.id) {
        <a class="tarjeta tarjeta-enlace" [routerLink]="['/actas', a.id]">
          <div class="tarjeta-fila">
            <h2 class="tarjeta-titulo">{{ a.obraDireccion }}</h2>
            <span class="etiqueta" [attr.data-estado]="a.estadoLocal">
              {{ a.estadoLocal === 'RECHAZADA' ? 'Rechazada' : 'Pendiente' }}
            </span>
          </div>
          <p class="texto-tenue">
            Expediente N.º {{ a.expediente }} · emitida {{ a.acta.fechaEmision | date: 'dd/MM HH:mm' }} ·
            {{ a.cantidadFotos }} {{ a.cantidadFotos === 1 ? 'foto' : 'fotos' }}
          </p>
          @if (a.estadoLocal === 'RECHAZADA') {
            <p class="motivo"><strong>Motivo:</strong> {{ a.motivoRechazo }}</p>
          } @else if (a.intentos > 0) {
            <p class="texto-tenue">
              {{ a.intentos }} {{ a.intentos === 1 ? 'intento' : 'intentos' }}
              @if (a.ultimoError) {
                · {{ a.ultimoError }}
              }
            </p>
          }
        </a>
      } @empty {
        <p class="vacio">No hay actas pendientes: todas llegaron al servidor.</p>
      }
    </section>
  `,
})
export class Pendientes {
  private readonly cola = inject(ColaOfflineService);
  private readonly sincronizacion = inject(SincronizacionService);

  protected readonly segundos = INTERVALO_REINTENTO_MS / 1000;
  protected readonly actas = this.cola.noEnviadas;
  protected readonly paraEnviar = computed(() => this.cola.paraEnviar().length);
  protected readonly enviando = this.sincronizacion.enviando;
  protected readonly enLinea = this.sincronizacion.enLinea;
  protected readonly ultimaRevision = this.sincronizacion.ultimaRevision;

  protected reintentar(): void {
    void this.sincronizacion.enviarPendientes();
  }
}
