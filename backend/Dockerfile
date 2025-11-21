# Etapa de construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar código fuente
COPY src ./src

# Etapa final
FROM node:20-alpine

WORKDIR /app

# Copiar desde builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY package*.json ./

# Variables de entorno (se sobreescriben con fly secrets)
ENV NODE_ENV=production
ENV PORT=3000

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/healthz', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Ejecutar servidor
CMD ["node", "src/servidor.js"]
