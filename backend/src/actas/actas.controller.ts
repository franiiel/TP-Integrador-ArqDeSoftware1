import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Roles, UsuarioActual } from '../auth/auth.constants.js';
import { Rol, Usuario } from '../usuarios/usuario.entity.js';
import { Acta } from './acta.entity.js';
import { parsearActaNueva } from './acta-nueva.js';
import { ActasService, type Foto } from './actas.service.js';

const actaEmitida = ({
  id,
  numero,
  estado,
  fechaEmision,
  fechaHoraRecepcion,
}: Acta) => ({ id, numero, estado, fechaEmision, fechaHoraRecepcion });

@Controller('actas')
@Roles([Rol.INSPECTOR])
export class ActasController {
  constructor(private readonly actasService: ActasService) {}

  @Post()
  // One more than allowed so the service can reject 11 photos with a clear message.
  @UseInterceptors(
    FilesInterceptor('fotos', 11, { limits: { fileSize: 10_000_000 } }),
  )
  async recibirActa(
    @UsuarioActual() usuario: Usuario,
    @Body('acta') acta: unknown,
    @UploadedFiles() fotos: Foto[] | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { acta: emitida, creada } = await this.actasService.recibir(
      usuario,
      parsearActaNueva(acta),
      fotos ?? [],
    );
    res.status(creada ? HttpStatus.CREATED : HttpStatus.OK);
    return actaEmitida(emitida);
  }

  @Get(':id')
  async obtenerActa(
    @UsuarioActual() usuario: Usuario,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
  ) {
    return actaEmitida(await this.actasService.obtener(usuario, id));
  }
}
