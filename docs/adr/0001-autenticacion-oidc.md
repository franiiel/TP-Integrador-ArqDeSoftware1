# ADR-01: Autenticación mediante OpenID Connect

**Estado:** Aceptada

## Contexto

El sistema requiere autenticar a inspectores, supervisores y administrativos, además de controlar las operaciones permitidas para cada perfil.

Los inspectores utilizan sus propios dispositivos móviles, que no son administrados por el municipio. Por otra parte, el sistema debe poder mantenerse con una infraestructura reducida y un único desarrollador.

**Atributos y restricción que pesan:** Seguridad/Autentificación y Mantenibilidad (un único desarrollador no debería mantener un sistema propio de credenciales). Restricción: dispositivos personales que el municipio no administra.

## Decisión

Se utiliza OpenID Connect (OIDC) mediante un proveedor externo de identidad.

El proveedor se encarga de la autenticación de los usuarios. El backend utiliza el identificador de identidad recibido para reconocer al usuario en su propia base de datos y obtener el rol correspondiente. A partir de ese rol, determina qué operaciones puede realizar.

El sistema no gestiona directamente las credenciales de los usuarios, sino que conserva los datos propios del dominio necesarios para su funcionamiento y vinculación con la identidad autenticada.

## Alternativas consideradas

La consigna fija el uso de un proveedor de identidad externo. Igualmente se compararon estas opciones:

| Alternativa | Motivo de descarte |
|---|---|
| Autenticación propia en NestJS (usuario y contraseña con JWT) | Obliga al único desarrollador a mantener el almacenamiento seguro de contraseñas, la recuperación de cuentas y el bloqueo por intentos fallidos, y aumenta la superficie de ataque del servidor municipal. |
| Keycloak autohospedado en el servidor municipal | Usa el mismo estándar OIDC, pero suma un servicio más para instalar, actualizar y respaldar en el único servidor, a cargo de un solo desarrollador. |

## Consecuencias negativas

- El sistema depende de la disponibilidad del proveedor externo para autenticar nuevas sesiones.
- Es necesario validar correctamente los tokens y administrar su vencimiento.
- Se requiere configurar adecuadamente los permisos y roles de los usuarios.

## Confirmación

Un test e2e verifica que una petición sin token o con token vencido a `/api/v1/actas` devuelve 401, y que un usuario con un rol sin permiso recibe 403.
