import dataSource from './data-source.js';
import { Inspeccion } from './inspecciones/inspeccion.entity.js';
import { Expediente } from './inspecciones/expediente.entity.js';
import { Obra } from './inspecciones/obra.entity.js';
import { Rol, Usuario } from './usuarios/usuario.entity.js';

// Test data for the minimal use case. Run once, after the migrations.
const inspectorAuth0Id = process.env.SEED_INSPECTOR_AUTH0_ID;
const supervisorAuth0Id = process.env.SEED_SUPERVISOR_AUTH0_ID;
const administrativoAuth0Id = process.env.SEED_ADMINISTRATIVO_AUTH0_ID;
if (!inspectorAuth0Id || !supervisorAuth0Id || !administrativoAuth0Id) {
  throw new Error(
    'Faltan SEED_INSPECTOR_AUTH0_ID, SEED_SUPERVISOR_AUTH0_ID o SEED_ADMINISTRATIVO_AUTH0_ID en el .env',
  );
}

await dataSource.initialize();
await dataSource.transaction(async (em) => {
  if (await em.exists(Usuario)) {
    console.log('Los datos semilla ya estaban cargados.');
    return;
  }

  const [inspector, supervisor] = await em.save(Usuario, [
    {
      auth0Id: inspectorAuth0Id,
      nombre: 'Inspector de prueba',
      email: 'inspector.demo@inspecciones.test',
      rol: Rol.INSPECTOR,
      cargo: 'Inspector de obras',
      legajo: '1001',
    },
    {
      auth0Id: supervisorAuth0Id,
      nombre: 'Supervisor de prueba',
      email: 'supervisor.demo@inspecciones.test',
      rol: Rol.SUPERVISOR,
      cargo: 'Supervisor de obras',
      legajo: '2001',
    },
    {
      auth0Id: administrativoAuth0Id,
      nombre: 'Administrativo de prueba',
      email: 'administrativo.demo@inspecciones.test',
      rol: Rol.ADMINISTRATIVO,
      cargo: 'Administrativo de obras',
      legajo: '3001',
    },
  ]);

  const obras = await em.save(Obra, [
    {
      direccion: 'Av. Vergara 2222, Hurlingham',
      propietario: 'Juan Pérez',
      responsable: 'Arq. Ana Gómez',
    },
    {
      direccion: 'Tte. Origone 151, Hurlingham',
      propietario: 'María López',
      responsable: 'Ing. Carlos Díaz',
    },
  ]);

  await em.save(Expediente, [
    { identificadorExterno: 1001, obraId: obras[0].id },
    { identificadorExterno: 1002, obraId: obras[1].id },
  ]);

  const hoy = new Date().toISOString().slice(0, 10);
  await em.save(
    Inspeccion,
    obras.map((obra) => ({
      obraId: obra.id,
      inspectorId: inspector.id,
      supervisorId: supervisor.id,
      fecha: hoy,
      ubicacion: null,
    })),
  );
  console.log('Datos semilla cargados.');
});
await dataSource.destroy();
