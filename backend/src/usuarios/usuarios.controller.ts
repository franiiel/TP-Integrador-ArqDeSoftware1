import { Controller, Get } from '@nestjs/common';
import { UsuarioActual } from '../auth/auth.constants.js';
import { Usuario } from './usuario.entity.js';

@Controller('me')
export class UsuariosController {
  @Get()
  obtenerUsuarioActual(@UsuarioActual() usuario: Usuario) {
    const { id, nombre, email, rol, cargo, legajo } = usuario;
    return { id, nombre, email, rol, cargo, legajo };
  }
}
