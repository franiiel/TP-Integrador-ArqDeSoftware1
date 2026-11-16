FROM node:24-alpine
WORKDIR /app
COPY simulador-soap/package.json simulador-soap/simulador.ts ./
EXPOSE 8080
CMD ["node", "simulador.ts"]
