import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { JWKS, ROLES_CLAIM } from '../src/auth/auth.constants.js';
import { Inspeccion } from '../src/inspecciones/inspeccion.entity.js';
import { Expediente } from '../src/obras/expediente.entity.js';
import { Obra } from '../src/obras/obra.entity.js';
import { Rol, Usuario } from '../src/usuarios/usuario.entity.js';
import { TEST_DB } from './test-env.js';

describe('Caso de uso mínimo (e2e)', () => {
  let app: INestApplication;
  let firmar: (sub: string, roles: Rol[], issuer?: string) => Promise<string>;
  let inspector: Usuario;
  let otroInspector: Usuario;
  let supervisor: Usuario;
  let inspeccionPropia: Inspeccion;
  let inspeccionPropia2: Inspeccion;
  let inspeccionAjena: Inspeccion;

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

    const db = app.get(DataSource);
    if (db.options.database !== TEST_DB) {
      throw new Error(
        `La app de test apunta a "${String(db.options.database)}"`,
      );
    }
    [inspector, otroInspector, supervisor] = await db
      .getRepository(Usuario)
      .save([
        {
          auth0Id: 'google-oauth2|inspector',
          nombre: 'Ana Inspectora',
          email: 'ana@example.com',
          rol: Rol.INSPECTOR,
          cargo: 'Inspectora',
          legajo: '1001',
        },
        {
          auth0Id: 'google-oauth2|otro',
          nombre: 'Otro Inspector',
          email: 'otro@example.com',
          rol: Rol.INSPECTOR,
          cargo: 'Inspector',
          legajo: '1002',
        },
        {
          auth0Id: 'google-oauth2|supervisor',
          nombre: 'Sara Supervisora',
          email: 'sara@example.com',
          rol: Rol.SUPERVISOR,
          cargo: 'Supervisora',
          legajo: '2001',
        },
      ]);

    const obras = await db.getRepository(Obra).save(
      [1, 2, 3].map((n) => ({
        direccion: `Calle ${n}`,
        propietario: `Propietario ${n}`,
        responsable: `Responsable ${n}`,
      })),
    );
    await db
      .getRepository(Expediente)
      .save(
        obras.map((obra, i) => ({
          identificadorExterno: 1001 + i,
          obraId: obra.id,
        })),
      );
    [inspeccionPropia, inspeccionPropia2, inspeccionAjena] = await db
      .getRepository(Inspeccion)
      .save(
        [inspector, inspector, otroInspector].map((asignado, i) => ({
          obraId: obras[i].id,
          inspectorId: asignado.id,
          supervisorId: supervisor.id,
          fecha: `2026-11-0${i + 1}`,
          ubicacion: null,
        })),
      );
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

  describe('GET /api/inspecciones', () => {
    it('devuelve solo las inspecciones asignadas al inspector', async () => {
      const res = await get(
        '/api/inspecciones',
        await firmar(inspector.auth0Id, [Rol.INSPECTOR]),
      ).expect(200);
      expect(res.body).toEqual([
        {
          id: inspeccionPropia.id,
          fecha: '2026-11-01',
          ubicacion: null,
          obra: {
            direccion: 'Calle 1',
            propietario: 'Propietario 1',
            responsable: 'Responsable 1',
          },
          expediente: { identificadorExterno: 1001 },
        },
        {
          id: inspeccionPropia2.id,
          fecha: '2026-11-02',
          ubicacion: null,
          obra: {
            direccion: 'Calle 2',
            propietario: 'Propietario 2',
            responsable: 'Responsable 2',
          },
          expediente: { identificadorExterno: 1002 },
        },
      ]);
      expect(res.body).not.toContainEqual(
        expect.objectContaining({ id: inspeccionAjena.id }),
      );
    });

    it('rechaza a un usuario sin rol INSPECTOR con 403', async () =>
      get(
        '/api/inspecciones',
        await firmar(supervisor.auth0Id, [Rol.SUPERVISOR]),
      ).expect(403));
  });
});
