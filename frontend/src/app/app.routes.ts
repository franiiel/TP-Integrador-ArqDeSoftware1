import { Routes } from '@angular/router';
import { DetalleActa } from './acta/detalle-acta';
import { EmitirActa } from './acta/emitir-acta';
import { Pendientes } from './cola-offline/pendientes';
import { MisInspecciones } from './inspecciones/mis-inspecciones';

// Las pantallas se cargan junto con la app (sin lazy loading) para que estén disponibles sin señal.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inspecciones' },
  { path: 'inspecciones', component: MisInspecciones, title: 'Mis inspecciones' },
  { path: 'inspecciones/:id/acta', component: EmitirActa, title: 'Emitir acta' },
  { path: 'pendientes', component: Pendientes, title: 'Pendientes' },
  { path: 'actas/:id', component: DetalleActa, title: 'Acta' },
  { path: '**', redirectTo: 'inspecciones' },
];
