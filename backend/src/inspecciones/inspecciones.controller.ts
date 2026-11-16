import { Controller, Get } from '@nestjs/common';
import { Roles, UsuarioActual } from '../auth/auth.constants.js';
import { Rol, Usuario } from '../usuarios/usuario.entity.js';
import { InspeccionesService } from './inspecciones.service.js';

@Controller('inspecciones')
export class InspeccionesController {
  constructor(private readonly inspeccionesService: InspeccionesService) {}

  @Get()
  @Roles([Rol.INSPECTOR])
  listarInspeccionesAsignadas(@UsuarioActual() usuario: Usuario) {
    return this.inspeccionesService.listarAsignadas(usuario.id);
  }
}
