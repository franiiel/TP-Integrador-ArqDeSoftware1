import { Component, ElementRef, OnDestroy, effect, input, output, signal, viewChild } from '@angular/core';

/** Lado mayor de la foto guardada, para que el acta no pese de más al enviarse con poca señal. */
const LADO_MAXIMO_PX = 1600;
const CALIDAD_JPEG = 0.8;

/**
 * Captura de fotos con la cámara dentro de la app (componente `camara`, ADR-02).
 * No hay selector de archivos: las fotos no se pueden elegir de la galería.
 * El navegador solo da acceso a la cámara en HTTPS (o localhost).
 */
@Component({
  selector: 'app-camara',
  template: `
    @if (abierta()) {
      <div class="camara">
        <video #video class="camara-video" autoplay muted playsinline></video>
        <div class="camara-acciones">
          <button type="button" class="boton boton-secundario" (click)="cerrar()">Cerrar cámara</button>
          <button type="button" class="boton" (click)="sacarFoto()" [disabled]="deshabilitada() || capturando()">
            Sacar foto
          </button>
        </div>
      </div>
    } @else {
      <button type="button" class="boton boton-secundario" (click)="abrir()" [disabled]="deshabilitada()">
        Abrir cámara
      </button>
    }
    @if (error(); as mensaje) {
      <p class="aviso aviso-error" role="alert">{{ mensaje }}</p>
    }
  `,
})
export class Camara implements OnDestroy {
  /** Por ejemplo, cuando ya hay 10 fotos. */
  readonly deshabilitada = input(false);
  readonly fotoCapturada = output<Blob>();

  protected readonly abierta = signal(false);
  protected readonly capturando = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  private stream: MediaStream | null = null;

  constructor() {
    // Cuando el <video> aparece en pantalla, se le conecta la cámara.
    effect(() => {
      const video = this.video()?.nativeElement;
      if (video && this.stream && video.srcObject !== this.stream) {
        video.srcObject = this.stream;
        void video.play().catch(() => undefined);
      }
    });
  }

  protected async abrir(): Promise<void> {
    this.error.set(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      this.error.set('Este navegador no permite usar la cámara (hace falta abrir la app con HTTPS).');
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      this.abierta.set(true);
    } catch (e) {
      this.detener();
      const nombre = e instanceof DOMException ? e.name : '';
      this.error.set(
        nombre === 'NotAllowedError'
          ? 'No diste permiso para usar la cámara. Habilitalo en la configuración del navegador.'
          : 'No se pudo abrir la cámara.',
      );
    }
  }

  protected cerrar(): void {
    this.detener();
  }

  protected async sacarFoto(): Promise<void> {
    const video = this.video()?.nativeElement;
    if (!video || video.videoWidth === 0) {
      return;
    }
    this.capturando.set(true);
    try {
      const escala = Math.min(1, LADO_MAXIMO_PX / Math.max(video.videoWidth, video.videoHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(video.videoWidth * escala);
      canvas.height = Math.round(video.videoHeight * escala);
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const foto = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', CALIDAD_JPEG),
      );
      if (foto) {
        this.fotoCapturada.emit(foto);
      } else {
        this.error.set('No se pudo guardar la foto. Probá de nuevo.');
      }
    } finally {
      this.capturando.set(false);
    }
  }

  ngOnDestroy(): void {
    this.detener();
  }

  private detener(): void {
    this.stream?.getTracks().forEach((pista) => pista.stop());
    this.stream = null;
    this.abierta.set(false);
  }
}
