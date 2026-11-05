import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { jwtVerify, type JWTVerifyGetKey } from 'jose';
import { Rol, Usuario } from '../usuarios/usuario.entity.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { JWKS, ROLES_CLAIM, Roles } from './auth.constants.js';

export type RequestAutenticado = Request & { usuario: Usuario };

// Applied to every route: there are no public endpoints in the API.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(JWKS) private readonly jwks: JWTVerifyGetKey,
    private readonly reflector: Reflector,
    private readonly usuariosService: UsuariosService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestAutenticado>();
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Falta el token de acceso');
    }

    let payload;
    try {
      ({ payload } = await jwtVerify(token, this.jwks, {
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        audience: process.env.AUTH0_AUDIENCE,
      }));
    } catch {
      throw new UnauthorizedException('Token de acceso inválido');
    }

    const permitidos = this.reflector.getAllAndOverride(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);
    const rolesToken = (payload[ROLES_CLAIM] ?? []) as Rol[];
    if (permitidos && !permitidos.some((rol) => rolesToken.includes(rol))) {
      throw new ForbiddenException(
        'El rol del usuario no permite la operación',
      );
    }

    const usuario = payload.sub
      ? await this.usuariosService.buscarPorAuth0Id(payload.sub)
      : null;
    if (!usuario) {
      throw new ForbiddenException(
        'El usuario no está registrado en el sistema',
      );
    }
    request.usuario = usuario;
    return true;
  }
}
