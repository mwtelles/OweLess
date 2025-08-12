# ---------- deps ----------
FROM oven/bun:1.1.26-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---------- build ----------
FROM deps AS build
WORKDIR /app
COPY . .
RUN bun run build

# ---------- runtime ----------
FROM oven/bun:1.1.26-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=1313

# TLS certs para DB serverless (Neon/Supabase)
RUN apk add --no-cache ca-certificates

# Copiamos só o necessário para rodar
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/drizzle ./drizzle

EXPOSE 1313
# chama o bundle diretamente
CMD ["bun", "dist/index.js"]