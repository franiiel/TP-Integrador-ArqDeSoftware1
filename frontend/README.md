# frontend

PWA en Angular usada por inspectores, supervisor y administrativo (ADR-02).

Generado con Angular CLI 22 (sin SSR, zoneless, CSS) y `@angular/pwa`.

```bash
pnpm start   # servidor de desarrollo en http://localhost:4200
pnpm build   # build de producción en dist/ (incluye el service worker)
```

El service worker solo se activa en el build de producción, no con `pnpm start`.

Componentes previstos (ver `docs/diagramas/c4-componentes-frontend.mmd`):
`auth`, `inspecciones`, `acta`, `camara`, `geolocalizacion`, `cola-offline`, `sincronizacion`, `api-client`, `consulta` y el service worker.
