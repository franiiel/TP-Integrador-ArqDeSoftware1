import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { InspeccionesService } from '../inspecciones/inspecciones.service.js';
import { Rol, Usuario } from '../usuarios/usuario.entity.js';
import { Acta, TipoActa } from './acta.entity.js';
import { ActaNueva } from './acta-nueva.js';
import { Fotografia } from './fotografia.entity.js';

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
    const expediente = await this.inspeccionesService.buscarExpedienteDeObra(
      inspeccion.obraId,
    );

    // Files first: if the transaction fails they are removed; if they were
    // written after the commit, a failure would leave an acta without photos.
    const carpeta = join(fotosDir(), nueva.id);
    await mkdir(carpeta, { recursive: true });
    const archivos = await Promise.all(
      fotos.map(async (foto, i) => {
        const refArchivo = join(carpeta, `${i + 1}.${TIPOS_FOTO[foto.mimetype]}`);
        await writeFile(refArchivo, foto.buffer);
        const hashSha256 = createHash('sha256').update(foto.buffer).digest('hex');
        return { refArchivo, hashSha256 };
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
        // The year's lock lasts until commit: two actas can't take the same number.
        // The zero-padded number makes the text max the numeric max.
        await manager.query('SELECT pg_advisory_xact_lock($1)', [anio]);
        const [{ ultimo }] = (await manager.query(
          `SELECT max(numero) AS ultimo FROM actas WHERE numero LIKE $1`,
          [`${anio}-%`],
        )) as [{ ultimo: string | null }];
        const siguiente = ultimo ? Number(ultimo.split('-')[1]) + 1 : 1;

        const acta = await manager.save(Acta, {
          id: nueva.id,
          numero: `${anio}-${String(siguiente).padStart(5, '0')}`,
          tipoActa: TipoActa.ORIGINAL,
          inspeccionId: inspeccion.id,
          expedienteId: expediente.id,
          fechaEmision: nueva.fechaEmision,
          observaciones: nueva.observaciones,
          tipoMedida: nueva.tipoMedida,
        });
        await manager.save(
          Fotografia,
          archivos.map((archivo) => ({ actaId: acta.id, ...archivo })),
        );
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
    // The supervisor reviews every acta; an inspector only sees their own.
    if (usuario.rol !== Rol.SUPERVISOR) {
      await this.verificarAsignacion(usuario, acta.inspeccionId!);
    }
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
