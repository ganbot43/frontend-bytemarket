# Node 26: es la versión con la que se generó el package-lock (npm 11).
# Con Node 22 (npm 10) el lock se interpreta distinto y `npm ci` falla por
# las copias anidadas de unplugin.
# ── Etapa de construcción ──
FROM node:26-alpine AS build
WORKDIR /app

# Las dependencias se copian solas primero: así Docker reutiliza la capa
# del npm ci mientras no cambie el package-lock, que es lo que más tarda.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Etapa de ejecución ──
# Solo .output: ni node_modules ni código fuente. Nitro empaqueta dentro
# lo que necesita.
FROM node:26-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
# Sin HOST=0.0.0.0 el servidor escucha solo dentro del contenedor y el
# puerto publicado no responde desde fuera.
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
