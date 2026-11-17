# Build context: repository root (pnpm workspace with a single lockfile).
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY simulador-soap/package.json simulador-soap/
RUN pnpm install --frozen-lockfile --filter frontend

COPY frontend frontend
RUN pnpm --filter frontend build

FROM nginx:1.29-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist/frontend/browser /usr/share/nginx/html
