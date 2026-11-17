import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Expediente } from './expediente.entity.js';
import { Inspeccion } from './inspeccion.entity.js';

@Injectable()
export class InspeccionesService {
  constructor(
    @InjectRepository(Inspeccion)
    private readonly inspecciones: Repository<Inspeccion>,
    @InjectRepository(Expediente)
    private readonly expedientes: Repository<Expediente>,
  ) {}

  async listarAsignadas(inspectorId: string) {
    const inspecciones = await this.inspecciones.find({
      where: { inspectorId },
      order: { fecha: 'ASC' },
    });
    if (inspecciones.length === 0) return [];
    const expedientes = await this.buscarExpedientesDeObras(
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

  // Each obra has exactly one expediente, which carries the obra itself.
  buscarExpedientesDeObras(obraIds: string[]) {
    return this.expedientes.find({
      where: { obraId: In(obraIds) },
      relations: { obra: true },
    });
  }

  buscarExpedientes(ids: string[]) {
    return this.expedientes.findBy({ id: In(ids) });
  }

  buscarExpedienteDeObra(obraId: string) {
    return this.expedientes.findOneByOrFail({ obraId });
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
