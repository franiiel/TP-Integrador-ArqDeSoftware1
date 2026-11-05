import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { Acta } from '../src/actas/acta.entity.js';
import { Fotografia } from '../src/actas/fotografia.entity.js';
import { Notificacion } from '../src/actas/notificacion.entity.js';
import { JWKS, ROLES_CLAIM } from '../src/auth/auth.constants.js';
import { Inspeccion } from '../src/inspecciones/inspeccion.entity.js';
import { Expediente } from '../src/obras/expediente.entity.js';
import { Obra } from '../src/obras/obra.entity.js';
import { Rol, Usuario } from '../src/usuarios/usuario.entity.js';
import { TEST_DB, TEST_FOTOS_DIR } from './test-env.js';

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
    await db.getRepository(Expediente).save(
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

  describe('POST /api/actas', () => {
    const anio = new Date().getFullYear();
    const foto = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const actaNueva = (inspeccionId: string, id = randomUUID()) => ({
      id,
      inspeccionId,
      fechaEmision: '2026-11-01T10:30:00.000Z',
      ubicacion: '-34.6037,-58.3816',
      observaciones: 'Obra sin cartel reglamentario',
      tipoMedida: 'INTIMACION',
      notificacion: {
        fechaEmision: '2026-11-01',
        destinatario: 'Juan Pérez',
        medio: 'En mano',
      },
    });

    const tokens: Record<string, string> = {};
    beforeAll(async () => {
      for (const { auth0Id } of [inspector, otroInspector]) {
        tokens[auth0Id] = await firmar(auth0Id, [Rol.INSPECTOR]);
      }
    });

    const enviar = (acta: object, fotos = 2, sub = inspector.auth0Id) => {
      const req = request(app.getHttpServer())
        .post('/api/actas')
        .set('Authorization', `Bearer ${tokens[sub]}`)
        .field('acta', JSON.stringify(acta));
      for (let i = 0; i < fotos; i++) {
        req.attach('fotos', foto, {
          filename: `foto${i}.jpg`,
          contentType: 'image/jpeg',
        });
      }
      return req;
    };

    let primera: ReturnType<typeof actaNueva>;

    it('emite el acta con número correlativo y la deja pendiente de asociación', async () => {
      primera = actaNueva(inspeccionPropia.id);
      const res = await enviar(primera).expect(201);
      expect(res.body).toEqual({
        id: primera.id,
        numero: `${anio}-00001`,
        estado: 'PENDIENTE_ASOCIACION',
        fechaEmision: primera.fechaEmision,
        fechaHoraRecepcion: expect.any(String),
      });

      const db = app.get(DataSource);
      const fotos = await db
        .getRepository(Fotografia)
        .findBy({ actaId: primera.id });
      expect(fotos).toHaveLength(2);
      for (const { rutaArchivo } of fotos) {
        expect(rutaArchivo.startsWith(TEST_FOTOS_DIR)).toBe(true);
        expect(await readFile(rutaArchivo)).toEqual(foto);
      }
      expect(
        await db.getRepository(Notificacion).findOneBy({ actaId: primera.id }),
      ).toMatchObject(primera.notificacion);
      expect(
        await db
          .getRepository(Inspeccion)
          .findOneBy({ id: inspeccionPropia.id }),
      ).toMatchObject({ ubicacion: '-34.6037,-58.3816' });
    });

    it('un reenvío del mismo id responde 200 con la misma acta, sin duplicarla', async () => {
      const res = await enviar(primera).expect(200);
      expect(res.body).toMatchObject({
        id: primera.id,
        numero: `${anio}-00001`,
      });
      expect(await app.get(DataSource).getRepository(Acta).count()).toBe(1);
    });

    it('la siguiente acta recibe el número siguiente del año', async () => {
      const res = await enviar(actaNueva(inspeccionPropia2.id)).expect(201);
      expect(res.body.numero).toBe(`${anio}-00002`);
    });

    it('rechaza otra acta para una inspección que ya tiene una con 409', () =>
      enviar(actaNueva(inspeccionPropia.id)).expect(409));

    it('rechaza el acta de una inspección asignada a otro inspector con 403', () =>
      enviar(actaNueva(inspeccionAjena.id)).expect(403));

    it('rechaza un acta sin fotos con 400', () =>
      enviar(actaNueva(inspeccionAjena.id), 0, otroInspector.auth0Id).expect(
        400,
      ));

    it('rechaza un acta con datos inválidos con 400', () =>
      enviar(
        { ...actaNueva(inspeccionAjena.id), tipoMedida: 'MULTA' },
        1,
        otroInspector.auth0Id,
      ).expect(400));

    it('acepta un acta sin ubicación', async () => {
      await enviar(
        { ...actaNueva(inspeccionAjena.id), ubicacion: null },
        1,
        otroInspector.auth0Id,
      ).expect(201);
    });
  });

  describe('GET /api/actas/:id', () => {
    it('devuelve número y estado de un acta propia', async () => {
      const [acta] = await app
        .get(DataSource)
        .getRepository(Acta)
        .findBy({ inspeccionId: inspeccionPropia.id });
      const res = await get(
        `/api/actas/${acta.id}`,
        await firmar(inspector.auth0Id, [Rol.INSPECTOR]),
      ).expect(200);
      expect(res.body).toMatchObject({
        id: acta.id,
        numero: acta.numero,
        estado: 'PENDIENTE_ASOCIACION',
      });
    });

    it('rechaza consultar el acta de otro inspector con 403', async () => {
      const [acta] = await app
        .get(DataSource)
        .getRepository(Acta)
        .findBy({ inspeccionId: inspeccionPropia.id });
      await get(
        `/api/actas/${acta.id}`,
        await firmar(otroInspector.auth0Id, [Rol.INSPECTOR]),
      ).expect(403);
    });

    it('responde 404 si el acta no existe', async () =>
      get(
        `/api/actas/${randomUUID()}`,
        await firmar(inspector.auth0Id, [Rol.INSPECTOR]),
      ).expect(404));
  });
});
