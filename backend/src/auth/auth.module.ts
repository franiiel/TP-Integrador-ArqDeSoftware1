import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { createRemoteJWKSet } from 'jose';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { JWKS } from './auth.constants.js';
import { AuthGuard } from './auth.guard.js';

@Module({
  imports: [UsuariosModule],
  providers: [
    {
      provide: JWKS,
      useFactory: () =>
        createRemoteJWKSet(
          new URL(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`),
        ),
    },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
