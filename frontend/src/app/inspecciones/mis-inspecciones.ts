import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColaOfflineService } from '../cola-offline/cola-offline.service';
import { TEXTO_ESTADO, situacionDe } from './estado-inspeccion';
import { InspeccionesService } from './inspecciones.service';

/** Pantalla `/inspecciones`: inspecciones asignadas, con el estado de su acta. */
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

  protected readonly items = computed(() =>
    [...this.servicio.lista()]
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((inspeccion) => ({
        inspeccion,
        situacion: situacionDe(inspeccion, this.cola.buscarPorInspeccion(inspeccion.id)),
      })),
  );

  ngOnInit(): void {
    void this.servicio.actualizar();
  }

  protected actualizar(): void {
    void this.servicio.actualizar();
  }
}
