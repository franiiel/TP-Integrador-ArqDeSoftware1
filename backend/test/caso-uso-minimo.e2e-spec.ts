import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { JWKS, ROLES_CLAIM } from '../src/auth/auth.constants.js';
import { Rol, Usuario } from '../src/usuarios/usuario.entity.js';

describe('Caso de uso mínimo (e2e)', () => {
  let app: INestApplication;
  let firmar: (sub: string, roles: Rol[], issuer?: string) => Promise<string>;
  let inspector: Usuario;

  beforeAll(async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    const jwk = { ...(await exportJWK(publicKey)), alg: 'RS256' };
    firmar = (sub, roles, issuer = `https://${process.env.AUTH0_DOMAIN}/`) =>
      new SignJWT({ [ROLES_CLAIM]: roles })
        .setProtectedHeader({ alg: 'RS256' })
        .setSubject(sub)
        .setIssuer(issuer)
        .setAudience(process.env.AUTH0_AUDIENCE!)
        .setExpirationTime('5m')
        .sign(privateKey);

    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(JWKS)
      .useValue(createLocalJWKSet({ keys: [jwk] }))
      .compile();
    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    inspector = await app.get(DataSource).getRepository(Usuario).save({
      auth0Id: 'google-oauth2|inspector',
      nombre: 'Ana Inspectora',
      email: 'ana@example.com',
      rol: Rol.INSPECTOR,
      cargo: 'Inspectora',
      legajo: '1001',
    });
  });

  afterAll(() => app.close());

  const get = (ruta: string, token?: string) => {
    const req = request(app.getHttpServer()).get(ruta);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  describe('autenticación', () => {
    it('rechaza un pedido sin token con 401', () => get('/api/me').expect(401));

    it('rechaza un token de otro emisor con 401', async () =>
      get(
        '/api/me',
        await firmar(inspector.auth0Id, [Rol.INSPECTOR], 'https://otro/'),
      ).expect(401));

    it('rechaza un usuario que no está registrado con 403', async () =>
      get(
        '/api/me',
        await firmar('google-oauth2|nadie', [Rol.INSPECTOR]),
      ).expect(403));

    it('GET /api/me devuelve los datos del usuario autenticado', async () => {
      const res = await get(
        '/api/me',
        await firmar(inspector.auth0Id, [Rol.INSPECTOR]),
      ).expect(200);
      expect(res.body).toEqual({
        id: inspector.id,
        nombre: 'Ana Inspectora',
        email: 'ana@example.com',
        rol: 'INSPECTOR',
        cargo: 'Inspectora',
        legajo: '1001',
      });
    });
  });
});
