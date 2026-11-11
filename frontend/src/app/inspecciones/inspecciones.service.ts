import { Injectable, inject, signal } from '@angular/core';
import { ApiClient, esFallaDeConexion, mensajeDeError } from '../api-client/api-client';
import { Inspeccion } from '../api-client/modelos';
import { STORE_CACHE, guardar, leer } from '../almacenamiento/base-local';

const CLAVE_LISTA = 'inspecciones';

interface ListaGuardada {
  lista: Inspeccion[];
  guardadaEn: string;
}

/** Inspecciones asignadas al inspector. La última lista recibida queda guardada en el celular. */
@Injectable({ providedIn: 'root' })
export class InspeccionesService {
  private readonly api = inject(ApiClient);

  readonly lista = signal<Inspeccion[]>([]);
  readonly guardadaEn = signal<string | null>(null);
  readonly actualizando = signal(false);
  readonly error = signal<string | null>(null);

  /** Carga la lista guardada en el celular (se usa al arrancar, funciona sin señal). */
  async cargarGuardada(): Promise<void> {
    const guardada = await leer<ListaGuardada>(STORE_CACHE, CLAVE_LISTA);
    if (guardada) {
      this.lista.set(guardada.lista);
      this.guardadaEn.set(guardada.guardadaEn);
    }
  }

  /** Pide la lista al backend y la guarda. Si no hay señal, queda la guardada. */
  async actualizar(): Promise<void> {
    if (this.actualizando()) {
      return;
    }
    this.actualizando.set(true);
    this.error.set(null);
    try {
      const lista = await this.api.listarInspecciones();
      await this.guardarLista(lista);
    } catch (e) {
      this.error.set(
        esFallaDeConexion(e)
          ? 'Sin señal: se muestra la lista guardada en el celular.'
          : `No se pudo actualizar la lista: ${mensajeDeError(e)}`,
      );
    } finally {
      this.actualizando.set(false);
    }
  }

  buscar(id: string): Inspeccion | undefined {
    return this.lista().find((i) => i.id === id);
  }

  /** Cuando el servidor recibe un acta, la lista guardada lo refleja aunque no se haya vuelto a pedir. */
  async marcarActaEmitida(inspeccionId: string, actaId: string): Promise<void> {
    const lista = this.lista().map((i) => (i.id === inspeccionId ? { ...i, actaId } : i));
    await this.guardarLista(lista, this.guardadaEn() ?? new Date().toISOString());
  }

  private async guardarLista(lista: Inspeccion[], guardadaEn = new Date().toISOString()): Promise<void> {
    this.lista.set(lista);
    this.guardadaEn.set(guardadaEn);
    await guardar<ListaGuardada>(STORE_CACHE, { lista, guardadaEn }, CLAVE_LISTA);
  }
}
