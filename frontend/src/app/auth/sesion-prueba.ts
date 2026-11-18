import { Rol } from '../api-client/modelos';

/**
 * Sesión de prueba (solo en desarrollo, cuando Auth0 no está configurado).
 * Guarda en el navegador con qué rol se ingresó, para que el backend simulado
 * devuelva ese usuario en `GET /api/me`. Con Auth0 el rol lo decide el backend real.
 */
const CLAVE_SESION_PRUEBA = 'sesion-prueba';

const ROLES: Rol[] = ['INSPECTOR', 'SUPERVISOR', 'ADMINISTRATIVO'];

/** Rol con el que se ingresó en la sesión de prueba, o `null` si no hay sesión. */
export function leerRolDePrueba(): Rol | null {
  try {
    const valor = localStorage.getItem(CLAVE_SESION_PRUEBA);
    if (valor === '1') {
      return 'INSPECTOR'; // sesiones guardadas antes de poder elegir el rol
    }
    return ROLES.find((rol) => rol === valor) ?? null;
  } catch {
    return null;
  }
}

export function guardarRolDePrueba(rol: Rol): void {
  try {
    localStorage.setItem(CLAVE_SESION_PRUEBA, rol);
  } catch {
    // Sin localStorage, la sesión de prueba dura hasta recargar.
  }
}

export function borrarSesionDePrueba(): void {
  try {
    localStorage.removeItem(CLAVE_SESION_PRUEBA);
  } catch {
    // Nada que borrar.
  }
}
