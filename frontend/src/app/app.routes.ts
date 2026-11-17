import { Routes } from '@angular/router';
import { DetalleActa } from './acta/detalle-acta';
import { EmitirActa } from './acta/emitir-acta';
import { soloInspector } from './auth/guards';
import { Ingresar } from './auth/ingresar';
import { SinPermiso } from './auth/sin-permiso';
import { Pendientes } from './cola-offline/pendientes';
import { MisInspecciones } from './inspecciones/mis-inspecciones';

// Las pantallas se cargan junto con la app (sin lazy loading) para que estén disponibles sin señal.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inspecciones' },
  { path: 'ingresar', component: Ingresar, title: 'Ingresar' },
  { path: 'sin-permiso', component: SinPermiso, title: 'Bienvenida' },
  { path: 'inspecciones', component: MisInspecciones, title: 'Mis inspecciones', canActivate: [soloInspector] },
  { path: 'inspecciones/:id/acta', component: EmitirActa, title: 'Emitir acta', canActivate: [soloInspector] },
  { path: 'pendientes', component: Pendientes, title: 'Pendientes', canActivate: [soloInspector] },
  { path: 'actas/:id', component: DetalleActa, title: 'Acta', canActivate: [soloInspector] },
  { path: '**', redirectTo: 'inspecciones' },
];
