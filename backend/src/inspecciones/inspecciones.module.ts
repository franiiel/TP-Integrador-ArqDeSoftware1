import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expediente } from './expediente.entity.js';
import { InspeccionesController } from './inspecciones.controller.js';
import { Inspeccion } from './inspeccion.entity.js';
import { InspeccionesService } from './inspecciones.service.js';
import { Obra } from './obra.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Inspeccion, Obra, Expediente])],
  controllers: [InspeccionesController],
  providers: [InspeccionesService],
  exports: [InspeccionesService],
})
export class InspeccionesModule {}
