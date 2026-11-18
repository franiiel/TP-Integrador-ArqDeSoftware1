# ADR-05: Backend con NestJS, PostgreSQL y TypeORM

**Estado:** Aceptada

## Contexto

El backend debe implementar la lógica del sistema, gestionar las actas y sus relaciones, validar las operaciones y comunicarse con el sistema municipal de expedientes.

El sistema será mantenido por un único desarrollador y debe poder desplegarse en la infraestructura municipal disponible.

**Atributos y restricción que pesan:** Integridad (las restricciones de la base protegen datos con valor legal), Mantenibilidad y Simplicidad. Restricción: un único desarrollador y la infraestructura propia del municipio, sin costo de licencias.

## Decisión

- **Framework:** NestJS. Su organización en módulos se corresponde directamente con el monolito modular, y usa TypeScript, el mismo lenguaje que el frontend.
- **Base de datos:** PostgreSQL, una base relacional de código abierto.
- **Acceso a datos:** TypeORM, con entidades definidas como clases.
- **Cambios en el esquema:** mediante migraciones versionadas en el repositorio. Se deshabilita la sincronización automática del esquema (`synchronize`).

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Express (en lugar de NestJS) | No impone una estructura: los módulos, la inyección de dependencias y la validación habría que armarlos a mano, y la organización del código quedaría a criterio de cada desarrollador. |
| MongoDB (en lugar de PostgreSQL) | Su ventaja principal es el escalado horizontal, que el escenario no necesita. El dominio es relacional y requiere integridad estricta, y la licencia de MongoDB Community (SSPL) no es una licencia de código abierto reconocida. |
| Prisma (en lugar de TypeORM) | Menos difundido que TypeORM en proyectos NestJS. TypeORM modela las entidades como clases, un enfoque orientado a objetos más familiar para un desarrollador nuevo que tome el proyecto. |

## Consecuencias negativas

- NestJS agrega conceptos propios (decoradores, inyección de dependencias) que un desarrollador nuevo tiene que aprender. Se mitiga con la documentación oficial, que es amplia, y con el `AGENTS.md` del repositorio.
- Las migraciones requieren disciplina: cada cambio en una entidad necesita su migración. Se acepta como costo para proteger datos con valor legal.
- Las fotos quedan fuera de la base de datos: el backup debe incluir tanto la base como la carpeta de fotos. Se mitiga guardándolas en un volumen dedicado.

## Confirmación

La base se crea desde cero solo con las migraciones versionadas (`synchronize` desactivado), y un test verifica que la base rechaza un acta sin inspección asociada o con un tipo de medida fuera de NINGUNA, INTIMACIÓN o CLAUSURA (ver NFR Integridad).
