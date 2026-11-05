import { Module } from '@nestjs/common';
import { IntegracionExpedientesService } from './integracion-expedientes.service.js';

@Module({
  providers: [IntegracionExpedientesService],
  exports: [IntegracionExpedientesService],
})
export class IntegracionExpedientesModule {}
