# Etapa 1: Compilación de TypeScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# Etapa 2: Imagen final de producción
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

# Puerto donde escucha Cloud Run
EXPOSE 8080
CMD ["node", "dist/index.js"]