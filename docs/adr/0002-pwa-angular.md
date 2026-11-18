# ADR-02: Aplicación web progresiva (PWA) con Angular

**Estado:** Aceptada

## Contexto

Los inspectores usan sus propios celulares, de cualquier marca y sistema operativo, que el municipio no administra. El sistema es mantenido por un único desarrollador. La carga de actas se hace en la calle y requiere cámara, ubicación y tolerancia a cortes de señal breves.

**Atributos y restricción que pesan:** Portabilidad y Mantenibilidad. Restricción determinante: celulares personales de cualquier marca y sistema operativo, que el municipio no administra.

## Decisión

El frontend se desarrolla como una aplicación web progresiva (PWA) con Angular, una única base de código para todos los usuarios y dispositivos.

- Se elige Angular junto con TypeScript para mantener una estructura organizada del frontend y utilizar el mismo lenguaje que en el backend, reduciendo la diversidad tecnológica que debe mantener un único desarrollador.
- Se puede instalar en la pantalla de inicio del celular, que es la forma recomendada, pero también puede utilizarse desde el navegador, sin necesidad de instalación. Las funcionalidades disponibles pueden variar según el navegador y el sistema operativo.
- Las fotografías se capturan mediante la cámara del dispositivo desde la aplicación. Se prioriza la captura directa durante la inspección para respaldar las observaciones registradas.
- La ubicación se obtiene mediante la API de geolocalización del navegador.
- Un service worker permite gestionar los recursos necesarios para utilizar la aplicación sin conexión.
- Los datos y las fotografías de las actas se almacenan temporalmente en el dispositivo cuando no hay conexión. Para ello se utiliza almacenamiento local, como IndexedDB. Cuando se recupera la conectividad, la aplicación permite reintentar el envío al servidor y visualizar qué actas todavía están pendientes de sincronización.
- La comunicación entre el dispositivo y el servidor se realiza mediante HTTPS.
- El acceso a la aplicación requiere autenticación. Se recomienda que los dispositivos cuenten con bloqueo de pantalla y cifrado de almacenamiento.
- Los datos locales se conservan únicamente mientras existan actas pendientes.
- El almacenamiento local no se considera un respaldo permanente de las actas, sino un mecanismo temporal para tolerar cortes de conectividad.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Aplicación nativa por plataforma (Android e iOS) | Exige mantener dos desarrollos diferentes, con distintas tecnologías y procesos de distribución. Esto aumenta el esfuerzo para un único desarrollador. |
| Aplicación web tradicional sin capacidades PWA | Depende de la conexión para utilizar las funcionalidades del sistema y no contempla adecuadamente la tolerancia a cortes breves de señal. |

## Consecuencias negativas

- **Limitaciones en iOS:** Safari no garantiza la sincronización en segundo plano con la aplicación cerrada. Se mitiga reintentando el envío cuando la aplicación está abierta o vuelve a abrirse, y mostrando al inspector qué actas están pendientes de envío.
- **Requiere HTTPS:** la cámara, la geolocalización y el service worker requieren un contexto seguro. El servidor municipal debe contar con un certificado HTTPS válido.
- **Permisos del navegador:** el inspector debe aceptar el acceso a la cámara y a la ubicación para utilizar esas funcionalidades.
- **Variedad de navegadores:** es necesario probar la aplicación en los navegadores más utilizados, especialmente Chrome en Android y Safari en iOS, para verificar el funcionamiento de la cámara, geolocalización, almacenamiento local y sincronización.

## Confirmación

La PWA se instala y completa el caso de uso mínimo (acta con foto y ubicación) en Chrome para Android y en Safari para iOS, con capturas en ambos dispositivos y el reporte de Lighthouse (ver NFR Portabilidad).
