import { DatePipe } from '@angular/common';
import { Component, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ActaNueva, MEDIDAS, TipoMedida } from '../api-client/modelos';
import { Camara } from '../camara/camara';
import { ActaLocal, ColaOfflineService } from '../cola-offline/cola-offline.service';
import { GeolocalizacionService } from '../geolocalizacion/geolocalizacion.service';
import { situacionDe } from '../inspecciones/estado-inspeccion';
import { InspeccionesService } from '../inspecciones/inspecciones.service';
import { SincronizacionService } from '../sincronizacion/sincronizacion.service';

export const MIN_FOTOS = 0;
export const MAX_FOTOS = 10;

interface Foto {
  blob: Blob;
  url: string;
}

type EstadoUbicacion = 'SIN_PEDIR' | 'BUSCANDO' | 'OBTENIDA' | 'NO_DISPONIBLE';

/** Pantalla `/inspecciones/:id/acta`: formulario del acta (componente `acta`). */
@Component({
  selector: 'app-emitir-acta',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, Camara],
  templateUrl: './emitir-acta.html',
})
export class EmitirActa implements OnDestroy {
  private readonly inspecciones = inject(InspeccionesService);
  private readonly cola = inject(ColaOfflineService);
  private readonly sincronizacion = inject(SincronizacionService);
  private readonly geolocalizacion = inject(GeolocalizacionService);
  private readonly router = inject(Router);

  /** Parámetro `:id` de la ruta (id de la inspección). */
  readonly id = input.required<string>();

  protected readonly medidas = MEDIDAS;
  protected readonly maxFotos = MAX_FOTOS;

  protected readonly inspeccion = computed(() => this.inspecciones.buscar(this.id()));
  protected readonly situacion = computed(() => {
    const inspeccion = this.inspeccion();
    return inspeccion ? situacionDe(inspeccion, this.cola.buscarPorInspeccion(inspeccion.id)) : null;
  });
  /** Se puede emitir si no hay acta, o si la que había fue rechazada por el servidor. */
  protected readonly sePuedeEmitir = computed(() => {
    const estado = this.situacion()?.estado;
    return estado === 'FALTA_ACTA' || estado === 'RECHAZADA';
  });

  protected readonly fotos = signal<Foto[]>([]);
  protected readonly ubicacion = signal<string | null>(null);
  protected readonly estadoUbicacion = signal<EstadoUbicacion>('SIN_PEDIR');
  protected readonly guardando = signal(false);
  protected readonly intentoConfirmar = signal(false);
  protected readonly errorGuardado = signal<string | null>(null);

  protected readonly faltanFotos = computed(() => this.fotos().length < MIN_FOTOS);

  protected readonly form = new FormGroup({
    observaciones: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipoMedida: new FormControl<TipoMedida>('NINGUNA', { nonNullable: true, validators: [Validators.required] }),
    notificacion: new FormGroup({
      fechaEmision: new FormControl(hoyLocal(), { nonNullable: true, validators: [Validators.required] }),
      destinatario: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      medio: new FormControl('En mano', { nonNullable: true, validators: [Validators.required] }),
    }),
  });

  protected agregarFoto(blob: Blob): void {
    if (this.fotos().length >= MAX_FOTOS) {
      return;
    }
    this.fotos.update((lista) => [...lista, { blob, url: URL.createObjectURL(blob) }]);
  }

  protected quitarFoto(foto: Foto): void {
    URL.revokeObjectURL(foto.url);
    this.fotos.update((lista) => lista.filter((f) => f !== foto));
  }

  protected async obtenerUbicacion(): Promise<void> {
    this.estadoUbicacion.set('BUSCANDO');
    const ubicacion = await this.geolocalizacion.obtener();
    this.ubicacion.set(ubicacion);
    this.estadoUbicacion.set(ubicacion ? 'OBTENIDA' : 'NO_DISPONIBLE');
  }

  protected quitarUbicacion(): void {
    this.ubicacion.set(null);
    this.estadoUbicacion.set('SIN_PEDIR');
  }

  protected campoInvalido(ruta: string): boolean {
    const control = this.form.get(ruta);
    return !!control && control.invalid && (control.touched || this.intentoConfirmar());
  }

  /** Guarda el acta en el celular con su UUID y la pone en la cola de envío. */
  protected async confirmar(): Promise<void> {
    this.intentoConfirmar.set(true);
    this.form.markAllAsTouched();
    const inspeccion = this.inspeccion();
    if (!inspeccion || !this.sePuedeEmitir() || this.form.invalid || this.faltanFotos() || this.guardando()) {
      return;
    }
    if (!confirm('Una vez confirmada, el acta no se puede modificar. ¿Confirmás el acta?')) {
      return;
    }

    this.guardando.set(true);
    this.errorGuardado.set(null);
    const valores = this.form.getRawValue();
    const acta: ActaNueva = {
      id: nuevoUuid(),
      inspeccionId: inspeccion.id,
      fechaEmision: new Date().toISOString(),
      ubicacion: this.ubicacion(),
      observaciones: valores.observaciones.trim(),
      tipoMedida: valores.tipoMedida,
      notificacion: {
        fechaEmision: valores.notificacion.fechaEmision,
        destinatario: valores.notificacion.destinatario.trim(),
        medio: valores.notificacion.medio.trim(),
      },
    };
    const local: ActaLocal = {
      id: acta.id,
      acta,
      fotos: this.fotos().map((f) => f.blob),
      cantidadFotos: this.fotos().length,
      estadoLocal: 'PENDIENTE',
      intentos: 0,
      ultimoIntento: null,
      ultimoError: null,
      motivoRechazo: null,
      emitida: null,
      obraDireccion: inspeccion.obra.direccion,
      expediente: inspeccion.expediente.identificadorExterno,
    };

    try {
      await this.cola.guardar(local);
    } catch {
      this.guardando.set(false);
      this.errorGuardado.set('No se pudo guardar el acta en el celular. Revisá el espacio disponible y probá de nuevo.');
      return;
    }
    // Ya quedó guardada en el celular: el envío se intenta sin esperar.
    void this.sincronizacion.enviarPendientes();
    await this.router.navigate(['/actas', acta.id], { replaceUrl: true });
  }

  ngOnDestroy(): void {
    this.fotos().forEach((f) => URL.revokeObjectURL(f.url));
  }
}

function hoyLocal(): string {
  const hoy = new Date();
  const dosDigitos = (n: number) => String(n).padStart(2, '0');
  return `${hoy.getFullYear()}-${dosDigitos(hoy.getMonth() + 1)}-${dosDigitos(hoy.getDate())}`;
}

/** UUID v4. `crypto.randomUUID` falta en algunos Safari viejos. */
function nuevoUuid(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
