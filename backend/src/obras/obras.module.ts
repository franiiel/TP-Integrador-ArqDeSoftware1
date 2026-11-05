import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expediente } from './expediente.entity.js';
import { Obra } from './obra.entity.js';
import { ObrasService } from './obras.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Obra, Expediente])],
  providers: [ObrasService],
  exports: [ObrasService],
})
export class ObrasModule {}
