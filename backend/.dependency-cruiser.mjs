// Module boundaries of the modular monolith (ADR-04), checked by `pnpm lint:deps`.
/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    {
      name: 'solo-api-publica',
      comment:
        'Un módulo solo usa de otro su API pública: el módulo Nest, sus servicios, ' +
        'sus entidades (relaciones de TypeORM) y los decoradores de auth.',
      severity: 'error',
      from: { path: '^src/([^/]+)/' },
      to: {
        path: '^src/[^/]+/',
        pathNot: [
          '^src/$1/',
          '\\.(module|service|entity)\\.ts$',
          '^src/auth/auth\\.constants\\.ts$',
        ],
      },
    },
    {
      name: 'acl-aislada',
      comment:
        'integracion-expedientes es la capa anticorrupción: traduce entre el ' +
        'dominio y SOAP sin depender de ningún otro módulo.',
      severity: 'error',
      from: { path: '^src/integracion-expedientes/' },
      to: { path: '^src/', pathNot: '^src/integracion-expedientes/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    // Type-only imports count too: they couple modules just the same.
    tsPreCompilationDeps: true,
  },
};
