import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ObrasService } from '../obras/obras.service.js';
import { Inspeccion } from './inspeccion.entity.js';

@Injectable()
export class InspeccionesService {
  constructor(
    @InjectRepository(Inspeccion)
    private readonly inspecciones: Repository<Inspeccion>,
    private readonly obrasService: ObrasService,
  ) {}

  async listarAsignadas(inspectorId: string) {
    const inspecciones = await this.inspecciones.find({
      where: { inspectorId },
      order: { fecha: 'ASC' },
    });
    if (inspecciones.length === 0) return [];
    const expedientes = await this.obrasService.buscarExpedientesDeObras(
      inspecciones.map((i) => i.obraId),
    );
    return inspecciones.map(({ id, fecha, ubicacion, obraId }) => {
      const { obra, identificadorExterno } = expedientes.find(
        (e) => e.obraId === obraId,
      )!;
      const { direccion, propietario, responsable } = obra;
      return {
        id,
        fecha,
        ubicacion,
        obra: { direccion, propietario, responsable },
        expediente: { identificadorExterno },
      };
    });
  }

  buscarPorId(id: string) {
    return this.inspecciones.findOneBy({ id });
  }

  // Runs inside the caller's transaction, so the acta and its location are saved together.
  registrarUbicacion(
    manager: EntityManager,
    id: string,
    ubicacion: string | null,
  ) {
    return manager.update(Inspeccion, id, { ubicacion });
  }
}
