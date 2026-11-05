import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspeccionesModule } from '../inspecciones/inspecciones.module.js';
import { ObrasModule } from '../obras/obras.module.js';
import { Acta } from './acta.entity.js';
import { ActasController } from './actas.controller.js';
import { ActasService } from './actas.service.js';
import { Fotografia } from './fotografia.entity.js';
import { Notificacion } from './notificacion.entity.js';
import { NumeradorActa } from './numerador-acta.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Acta, Fotografia, Notificacion, NumeradorActa]),
    InspeccionesModule,
    ObrasModule,
  ],
  controllers: [ActasController],
  providers: [ActasService],
})
export class ActasModule {}
