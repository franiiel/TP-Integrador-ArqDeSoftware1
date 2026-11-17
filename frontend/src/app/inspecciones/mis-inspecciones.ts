import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Inspeccion } from '../api-client/modelos';
import { ColaOfflineService } from '../cola-offline/cola-offline.service';
import { SituacionInspeccion, TEXTO_ESTADO, situacionDe } from './estado-inspeccion';
import { InspeccionesService } from './inspecciones.service';

type ClaveGrupo = 'ANTERIORES' | 'HOY' | 'MANANA' | 'PROXIMAS';

interface ItemInspeccion {
  inspeccion: Inspeccion;
  situacion: SituacionInspeccion;
}

interface GrupoInspecciones {
  clave: ClaveGrupo;
  titulo: string;
  /** Fecha que se muestra junto al título (solo hoy y mañana). */
  fecha: string | null;
  items: ItemInspeccion[];
}

const TITULO_GRUPO: Record<ClaveGrupo, string> = {
  ANTERIORES: 'Días anteriores',
  HOY: 'Hoy',
  MANANA: 'Mañana',
  PROXIMAS: 'Próximas',
};

const ORDEN_GRUPOS: ClaveGrupo[] = ['ANTERIORES', 'HOY', 'MANANA', 'PROXIMAS'];

/** Fecha local del celular en formato `AAAA-MM-DD` (el mismo de `Inspeccion.fecha`), corrida `dias` días. */
function fechaLocal(dias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Pantalla `/inspecciones`: inspecciones asignadas agrupadas por día, con el estado de su acta. */
@Component({
  selector: 'app-mis-inspecciones',
  imports: [RouterLink, DatePipe],
  templateUrl: './mis-inspecciones.html',
})
export class MisInspecciones implements OnInit {
  private readonly servicio = inject(InspeccionesService);
  private readonly cola = inject(ColaOfflineService);

  protected readonly textoEstado = TEXTO_ESTADO;
  protected readonly actualizando = this.servicio.actualizando;
  protected readonly error = this.servicio.error;
  protected readonly guardadaEn = this.servicio.guardadaEn;

  protected readonly items = computed<ItemInspeccion[]>(() =>
    [...this.servicio.lista()]
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((inspeccion) => ({
        inspeccion,
        situacion: situacionDe(inspeccion, this.cola.buscarPorInspeccion(inspeccion.id)),
      })),
  );

  /** Las inspecciones separadas en días anteriores, hoy, mañana y próximas (sin grupos vacíos). */
  protected readonly grupos = computed<GrupoInspecciones[]>(() => {
    const hoy = fechaLocal(0);
    const manana = fechaLocal(1);
    const porGrupo: Record<ClaveGrupo, ItemInspeccion[]> = { ANTERIORES: [], HOY: [], MANANA: [], PROXIMAS: [] };

    for (const item of this.items()) {
      const fecha = item.inspeccion.fecha;
      const clave: ClaveGrupo =
        fecha < hoy ? 'ANTERIORES' : fecha === hoy ? 'HOY' : fecha === manana ? 'MANANA' : 'PROXIMAS';
      porGrupo[clave].push(item);
    }

    return ORDEN_GRUPOS.filter((clave) => porGrupo[clave].length > 0).map((clave) => ({
      clave,
      titulo: TITULO_GRUPO[clave],
      fecha: clave === 'HOY' ? hoy : clave === 'MANANA' ? manana : null,
      items: porGrupo[clave],
    }));
  });

  /** Números del resumen de arriba de la lista. */
  protected readonly resumen = computed(() => {
    const hoy = fechaLocal(0);
    const items = this.items();
    return {
      hoy: items.filter((item) => item.inspeccion.fecha === hoy).length,
      sinActa: items.filter((item) => item.situacion.estado === 'FALTA_ACTA' || item.situacion.estado === 'RECHAZADA')
        .length,
      sinEnviar: items.filter((item) => item.situacion.estado === 'PENDIENTE').length,
    };
  });

  ngOnInit(): void {
    void this.servicio.actualizar();
  }

  protected actualizar(): void {
    void this.servicio.actualizar();
  }
}
