import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Expediente } from './expediente.entity.js';

@Injectable()
export class ObrasService {
  constructor(
    @InjectRepository(Expediente)
    private readonly expedientes: Repository<Expediente>,
  ) {}

  // Each obra has exactly one expediente, which carries the obra itself.
  buscarExpedientesDeObras(obraIds: string[]) {
    return this.expedientes.find({
      where: { obraId: In(obraIds) },
      relations: { obra: true },
    });
  }

  buscarExpedienteDeObra(obraId: string) {
    return this.expedientes.findOneByOrFail({ obraId });
  }
}
