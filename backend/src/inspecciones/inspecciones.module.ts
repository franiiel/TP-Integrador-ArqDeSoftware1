import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObrasModule } from '../obras/obras.module.js';
import { InspeccionesController } from './inspecciones.controller.js';
import { Inspeccion } from './inspeccion.entity.js';
import { InspeccionesService } from './inspecciones.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Inspeccion]), ObrasModule],
  controllers: [InspeccionesController],
  providers: [InspeccionesService],
  exports: [InspeccionesService],
})
export class InspeccionesModule {}
