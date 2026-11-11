import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiClient, esFallaDeConexion, mensajeDeError } from '../api-client/api-client';
import { ActaEmitida, textoMedida } from '../api-client/modelos';
import { ColaOfflineService } from '../cola-offline/cola-offline.service';
import { SincronizacionService } from '../sincronizacion/sincronizacion.service';

/**
 * Pantalla `/actas/:id`. Mientras el acta está en el celular indica que está pendiente;
 * cuando llega al servidor muestra el número asignado y si ya quedó asociada al expediente.
 */
@Component({
  selector: 'app-detalle-acta',
  imports: [RouterLink, DatePipe],
  templateUrl: './detalle-acta.html',
})
export class DetalleActa {
  private readonly api = inject(ApiClient);
  private readonly cola = inject(ColaOfflineService);
  private readonly sincronizacion = inject(SincronizacionService);

  /** Parámetro `:id` de la ruta (UUID del acta). */
  readonly id = input.required<string>();

  protected readonly textoMedida = textoMedida;
  protected readonly enviando = this.sincronizacion.enviando;

  /** El acta guardada en este celular, si fue emitida acá. */
  protected readonly local = computed(() => this.cola.buscar(this.id()));
  private readonly estadoLocal = computed(() => this.local()?.estadoLocal ?? null);

  /** Lo que respondió el servidor al consultarla ahora. */
  private readonly remota = signal<ActaEmitida | null>(null);
  protected readonly consultando = signal(false);
  protected readonly errorConsulta = signal<string | null>(null);

  /** Datos del servidor: la consulta más reciente o, sin señal, lo que respondió al recibirla. */
  protected readonly emitida = computed(() => this.remota() ?? this.local()?.emitida ?? null);

  constructor() {
    // Se consulta al servidor cuando el acta ya llegó (o no está en este celular),
    // incluso si llega mientras esta pantalla está abierta.
    effect(() => {
      const estado = this.estadoLocal();
      this.id();
      if (estado === null || estado === 'ENVIADA') {
        untracked(() => void this.consultar());
      }
    });
  }

  protected async consultar(): Promise<void> {
    this.consultando.set(true);
    this.errorConsulta.set(null);
    try {
      this.remota.set(await this.api.obtenerActa(this.id()));
    } catch (e) {
      this.errorConsulta.set(
        esFallaDeConexion(e)
          ? 'Sin señal: no se pudo consultar el estado actual del acta.'
          : `No se pudo consultar el acta: ${mensajeDeError(e)}`,
      );
    } finally {
      this.consultando.set(false);
    }
  }

  protected reintentarEnvio(): void {
    void this.sincronizacion.enviarPendientes();
  }
}
