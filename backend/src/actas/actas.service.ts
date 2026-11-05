import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { InspeccionesService } from '../inspecciones/inspecciones.service.js';
import { ObrasService } from '../obras/obras.service.js';
import { Usuario } from '../usuarios/usuario.entity.js';
import { Acta } from './acta.entity.js';
import { ActaNueva } from './acta-nueva.js';
import { Fotografia } from './fotografia.entity.js';
import { Notificacion } from './notificacion.entity.js';

// The parts of an uploaded file this service uses.
export type Foto = { buffer: Buffer; mimetype: string };

const TIPOS_FOTO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

const fotosDir = () =>
  process.env.FOTOS_DIR ?? join(import.meta.dirname, '../../../uploads/fotos');

@Injectable()
export class ActasService {
  constructor(
    @InjectRepository(Acta) private readonly actas: Repository<Acta>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly inspeccionesService: InspeccionesService,
    private readonly obrasService: ObrasService,
  ) {}

  // Returns the acta and whether it was created now (false = a resend of the same id).
  async recibir(
    usuario: Usuario,
    nueva: ActaNueva,
    fotos: Foto[],
  ): Promise<{ acta: Acta; creada: boolean }> {
    const existente = await this.actas.findOneBy({ id: nueva.id });
    if (existente) {
      await this.verificarAsignacion(usuario, existente.inspeccionId!);
      return { acta: existente, creada: false };
    }

    const inspeccion = await this.verificarAsignacion(
      usuario,
      nueva.inspeccionId,
    );
    if (fotos.length < 1 || fotos.length > 10) {
      throw new BadRequestException('El acta debe tener entre 1 y 10 fotos');
    }
    if (fotos.some((foto) => !TIPOS_FOTO[foto.mimetype])) {
      throw new BadRequestException('Las fotos deben ser JPEG o PNG');
    }
    if (await this.actas.existsBy({ inspeccionId: inspeccion.id })) {
      throw new ConflictException('La inspección ya tiene otra acta emitida');
    }
    const expediente = await this.obrasService.buscarExpedienteDeObra(
      inspeccion.obraId,
    );

    // Files first: if the transaction fails they are removed; if they were
    // written after the commit, a failure would leave an acta without photos.
    const carpeta = join(fotosDir(), nueva.id);
    await mkdir(carpeta, { recursive: true });
    const rutas = await Promise.all(
      fotos.map(async (foto, i) => {
        const ruta = join(carpeta, `${i + 1}.${TIPOS_FOTO[foto.mimetype]}`);
        await writeFile(ruta, foto.buffer);
        return ruta;
      }),
    );

    try {
      const acta = await this.dataSource.transaction(async (manager) => {
        // The number belongs to the year of the legal date, in the municipality's
        // time zone: an acta drawn up on Dec 31 at 23:30 is numbered in that year.
        const anio = Number(
          new Intl.DateTimeFormat('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            year: 'numeric',
          }).format(nueva.fechaEmision),
        );
        // The upsert locks the year's row until commit: numbers can't repeat or skip.
        const [{ ultimo_numero }] = (await manager.query(
          `INSERT INTO numeradores_acta (anio, ultimo_numero) VALUES ($1, 1)
           ON CONFLICT (anio) DO UPDATE SET ultimo_numero = numeradores_acta.ultimo_numero + 1
           RETURNING ultimo_numero`,
          [anio],
        )) as [{ ultimo_numero: number }];

        const acta = await manager.save(Acta, {
          id: nueva.id,
          numero: `${anio}-${String(ultimo_numero).padStart(5, '0')}`,
          inspeccionId: inspeccion.id,
          expedienteId: expediente.id,
          fechaEmision: nueva.fechaEmision,
          observaciones: nueva.observaciones,
          tipoMedida: nueva.tipoMedida,
        });
        await manager.save(
          Fotografia,
          rutas.map((rutaArchivo) => ({ actaId: acta.id, rutaArchivo })),
        );
        await manager.save(Notificacion, {
          actaId: acta.id,
          ...nueva.notificacion,
        });
        await this.inspeccionesService.registrarUbicacion(
          manager,
          inspeccion.id,
          nueva.ubicacion,
        );
        return manager.findOneByOrFail(Acta, { id: acta.id });
      });
      return { acta, creada: true };
    } catch (error) {
      // Two simultaneous sends of the same acta: the one that lost the race
      // answers with the acta the other one saved.
      const reenvio =
        error instanceof QueryFailedError &&
        (await this.actas.findOneBy({ id: nueva.id }));
      if (reenvio) return { acta: reenvio, creada: false };
      await rm(carpeta, { recursive: true, force: true });
      throw error;
    }
  }

  async obtener(usuario: Usuario, id: string) {
    const acta = await this.actas.findOneBy({ id });
    if (!acta) throw new NotFoundException('El acta no existe');
    await this.verificarAsignacion(usuario, acta.inspeccionId!);
    return acta;
  }

  private async verificarAsignacion(usuario: Usuario, inspeccionId: string) {
    const inspeccion = await this.inspeccionesService.buscarPorId(inspeccionId);
    if (!inspeccion) throw new NotFoundException('La inspección no existe');
    if (inspeccion.inspectorId !== usuario.id) {
      throw new ForbiddenException('La inspección no está asignada al usuario');
    }
    return inspeccion;
  }
}
