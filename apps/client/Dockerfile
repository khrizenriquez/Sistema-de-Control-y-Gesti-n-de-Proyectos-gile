FROM node:22-alpine AS build
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm run build

FROM node:22-alpine AS production
WORKDIR /app

COPY --from=build /app/dist ./dist
EXPOSE 3000

RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]
