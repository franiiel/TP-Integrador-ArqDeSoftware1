# Build context: repository root (pnpm workspace with a single lockfile).
FROM node:24-alpine
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY simulador-soap/package.json simulador-soap/
RUN pnpm install --frozen-lockfile --filter backend

# main.ts serves docs/openapi.yaml as the Swagger page.
COPY docs docs
COPY backend backend
WORKDIR /app/backend
RUN pnpm build

EXPOSE 3000
# Migrations and seed on every start: both skip what is already done.
CMD ["sh", "-c", "pnpm exec typeorm migration:run -d dist/data-source.js && node dist/seed.js && node dist/main.js"]
