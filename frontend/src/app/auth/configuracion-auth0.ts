/**
 * Datos de la aplicación registrada en Auth0. No son secretos: una SPA los expone igual en el navegador.
 * Se completan con los valores del panel de Auth0 (ver frontend/README.md).
 * Mientras tengan "COMPLETAR", en desarrollo se usa una sesión de prueba sin Auth0.
 */
export const CONFIGURACION_AUTH0 = {
  /** Applications → la SPA → Domain. Ejemplo: `inspecciones-obra.us.auth0.com`. */
  domain: 'COMPLETAR.us.auth0.com',
  /** Applications → la SPA → Client ID. */
  clientId: 'COMPLETAR',
  /** APIs → la API del backend → Identifier. El backend valida esta misma audiencia. */
  audience: 'COMPLETAR',
};

/** Conexión de Auth0 para ingresar con la cuenta de Google (ADR-01). */
export const CONEXION_GOOGLE = 'google-oauth2';
