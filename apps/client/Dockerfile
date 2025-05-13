FROM node:22-alpine AS build
WORKDIR /app

RUN npm install -g pnpm

# Copiar configuración primero para aprovechar la caché
COPY package.json pnpm-lock.yaml tsconfig*.json vite.config.* ./
COPY tailwind.config.js postcss.config.js ./

RUN pnpm install

# Copiar código fuente
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Copiar variables de entorno si existen
COPY .env* ./

# Construir la aplicación
RUN pnpm run build

FROM node:22-alpine AS production
WORKDIR /app

COPY --from=build /app/dist ./dist
EXPOSE 3000

RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]
