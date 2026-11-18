# ADR-04: Estilo arquitectónico de monolito modular

**Estado:** Aceptada

## Contexto

El sistema es mantenido por un único desarrollador, se despliega en un único servidor municipal y tiene una escala reducida (4 inspectores, ~15 inspecciones diarias). Los atributos prioritarios son mantenibilidad y simplicidad. Además, la integración con el sistema de expedientes (SOAP) es una fuente de cambios y fallas que conviene aislar del resto.

**Atributos y restricción que pesan:** Mantenibilidad y Simplicidad (atributos estrella) e Interoperabilidad. Restricción: un único servidor municipal y un único desarrollador.

## Decisión

El backend se construye como un monolito modular en NestJS: una única aplicación, un único proceso y una única base de datos, organizada en módulos por área de negocio (ver diagrama de componentes). Reglas de organización:

- Cada módulo expone hacia los demás solo sus servicios públicos; no se accede a la lógica interna de otro módulo.
- Cada módulo es dueño de sus tablas: otro módulo no las consulta directamente, sino a través del servicio del módulo dueño.
- La integración SOAP vive en un único módulo adaptador. Ningún otro módulo conoce SOAP.

Esta decisión se refiere al backend. El frontend es una aplicación Angular independiente (ver ADR-02) que se comunica con el backend a través de su API.

## Alternativas consideradas

Se evaluaron mediante una matriz de Pugh (ver sección Matriz de decisión Pugh del documento de arquitectura):

| Alternativa | Puntaje | Motivo de descarte |
|---|---|---|
| Monolito en capas (base) | 0 | Despliegue simple, pero las capas no separan áreas de negocio; sin límites entre módulos, el código tiende a acoplarse con el tiempo. |
| Microservicios | -8 | Comunicación entre servicios, múltiples despliegues y bases de datos, y operación distribuida que no se justifican para la escala ni para un solo desarrollador. |
| Monolito modular | +6 | Elegida por ofrecer una separación clara de responsabilidades manteniendo la simplicidad de despliegue y operación. |

## Consecuencias negativas

- Las reglas entre módulos dependen de la disciplina del desarrollador: nada impide técnicamente que un módulo acceda a las tablas de otro. Se mitiga documentando las reglas y revisándolas en el código.
- **Escalado conjunto:** no se puede escalar un módulo por separado. Para la escala del escenario no es necesario.
- Una falla grave afecta a todo el sistema. Se acepta, dado que el sistema se usa en horario laboral y el inspector puede seguir cargando actas sin conexión.

## Confirmación

Un script de análisis de dependencias (dependency-cruiser) se ejecuta junto con el lint y falla si un módulo importa la lógica interna de otro o si `integracion-expedientes` (la capa anticorrupción frente al SOAP) depende de otro módulo (ver NFR Mantenibilidad y [la evidencia](../evidencias/nfr-mantenibilidad.md)).
