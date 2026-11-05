import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IntegracionExpedientesService,
  RechazoExpedientes,
} from '../integracion-expedientes/integracion-expedientes.service.js';
import { ObrasService } from '../obras/obras.service.js';
import { Acta, EstadoActa } from './acta.entity.js';

// Associates pending actas with their expediente in the background (ADR: no
// queues). Whatever fails stays PENDIENTE_ASOCIACION and is retried next round.
@Injectable()
export class AsociacionActasService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(AsociacionActasService.name);
  private intervalo?: NodeJS.Timeout;
  private enCurso = false;

  constructor(
    @InjectRepository(Acta) private readonly actas: Repository<Acta>,
    private readonly obrasService: ObrasService,
    private readonly integracion: IntegracionExpedientesService,
  ) {}

  onApplicationBootstrap() {
    // 0 turns it off (the tests run each round by hand).
    const ms = Number(process.env.ASOCIACION_INTERVALO_MS ?? 60_000);
    if (ms > 0)
      this.intervalo = setInterval(() => void this.asociarPendientes(), ms);
  }

  onModuleDestroy() {
    clearInterval(this.intervalo);
  }

  async asociarPendientes() {
    if (this.enCurso) return; // the previous round is still waiting on SOAP
    this.enCurso = true;
    try {
      const pendientes = await this.actas.find({
        where: { estado: EstadoActa.PENDIENTE_ASOCIACION },
        order: { numero: 'ASC' },
      });
      if (pendientes.length === 0) return;
      const expedientes = await this.obrasService.buscarExpedientes(
        pendientes.map((acta) => acta.expedienteId),
      );

      for (const acta of pendientes) {
        const expediente = expedientes.find((e) => e.id === acta.expedienteId)!;
        try {
          await this.integracion.asociarActa({
            identificadorExpediente: expediente.identificadorExterno,
            numeroActa: acta.numero,
            fechaEmision: acta.fechaEmision,
            tipoMedida: acta.tipoMedida,
          });
          // The only change an emitted acta allows: its estado.
          await this.actas.update(acta.id, { estado: EstadoActa.ASOCIADA });
        } catch (error) {
          if (error instanceof RechazoExpedientes) {
            this.logger.warn(`Acta ${acta.numero} rechazada: ${error.message}`);
          } else {
            this.logger.error(
              `Acta ${acta.numero} sin asociar: ${String(error)}`,
            );
          }
        }
      }
    } finally {
      this.enCurso = false;
    }
  }
}
