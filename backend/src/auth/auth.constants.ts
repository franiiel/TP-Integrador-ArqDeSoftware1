import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Rol } from '../usuarios/usuario.entity.js';
import type { RequestAutenticado } from './auth.guard.js';

// Injection token for the key set that verifies tokens; tests swap it for a local one.
export const JWKS = Symbol('JWKS');

// Custom claim added by the Auth0 login Action.
export const ROLES_CLAIM = 'https://inspecciones-obra/roles';

export const Roles = Reflector.createDecorator<Rol[]>();

export const UsuarioActual = createParamDecorator(
  (_: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<RequestAutenticado>().usuario,
);
