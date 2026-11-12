import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Pantallas del inspector: hace falta haber ingresado y tener el rol `INSPECTOR`.
 * El backend vuelve a controlar el rol en cada llamada; esto solo ordena la navegación.
 */
export const soloInspector: CanActivateFn = async (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.iniciar();

  const usuario = auth.usuario();
  if (!auth.autenticado() || !usuario) {
    return router.createUrlTree(['/ingresar'], { queryParams: { destino: estado.url } });
  }
  return usuario.rol === 'INSPECTOR' ? true : router.createUrlTree(['/sin-permiso']);
};
