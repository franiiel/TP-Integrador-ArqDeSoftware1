import { Injectable, computed, signal } from '@angular/core';
import { ActaEmitida, ActaNueva } from '../api-client/modelos';
import { STORE_ACTAS, guardar, leerTodos } from '../almacenamiento/base-local';

/**
 * - `PENDIENTE`: guardada en el celular, todavía no llegó al servidor.
 * - `RECHAZADA`: el servidor la rechazó (por ejemplo, la inspección ya tenía otra acta); no se reintenta.
 * - `ENVIADA`: el servidor la recibió y le asignó número.
 */
export type EstadoLocal = 'PENDIENTE' | 'RECHAZADA' | 'ENVIADA';

/** Acta guardada en el celular (IndexedDB), con sus fotos mientras no se envíe. */
export interface ActaLocal {
  /** Igual a `acta.id`. */
  id: string;
  acta: ActaNueva;
  /** Se vacía cuando el servidor recibe el acta, para no ocupar espacio. */
  fotos: Blob[];
  cantidadFotos: number;
  estadoLocal: EstadoLocal;
  intentos: number;
  ultimoIntento: string | null;
  /** Último error transitorio (sin señal, servidor caído). */
  ultimoError: string | null;
  /** Motivo por el que el servidor rechazó el acta. */
  motivoRechazo: string | null;
  /** Respuesta del servidor al recibirla. */
  emitida: ActaEmitida | null;
  /** Datos de la inspección copiados para mostrarlos sin señal. */
  obraDireccion: string;
  expediente: number;
}

/** Cola local de actas (componente `cola-offline`). Toda escritura queda en IndexedDB antes de seguir. */
@Injectable({ providedIn: 'root' })
export class ColaOfflineService {
  private readonly actas = signal<ActaLocal[]>([]);

  readonly todas = this.actas.asReadonly();

  /** Actas que todavía no llegaron al servidor (pendientes y rechazadas), más viejas primero. */
  readonly noEnviadas = computed(() =>
    this.actas()
      .filter((a) => a.estadoLocal !== 'ENVIADA')
      .sort((a, b) => a.acta.fechaEmision.localeCompare(b.acta.fechaEmision)),
  );

  readonly paraEnviar = computed(() => this.noEnviadas().filter((a) => a.estadoLocal === 'PENDIENTE'));

  /** No se permite cerrar sesión con actas pendientes de envío (ADR-03). */
  readonly hayPendientesDeEnvio = computed(() => this.paraEnviar().length > 0);

  async cargar(): Promise<void> {
    this.actas.set(await leerTodos<ActaLocal>(STORE_ACTAS));
  }

  buscar(id: string): ActaLocal | undefined {
    return this.actas().find((a) => a.id === id);
  }

  /** El acta de una inspección; si hubo una rechazada y otra posterior, prioriza la que no fue rechazada. */
  buscarPorInspeccion(inspeccionId: string): ActaLocal | undefined {
    const deLaInspeccion = this.actas().filter((a) => a.acta.inspeccionId === inspeccionId);
    return deLaInspeccion.find((a) => a.estadoLocal !== 'RECHAZADA') ?? deLaInspeccion.at(-1);
  }

  /** Agrega o actualiza un acta. Primero se escribe en el celular y después se refleja en pantalla. */
  async guardar(acta: ActaLocal): Promise<void> {
    await guardar(STORE_ACTAS, acta);
    this.actas.update((lista) => {
      const sinEsta = lista.filter((a) => a.id !== acta.id);
      return [...sinEsta, acta];
    });
  }
}
