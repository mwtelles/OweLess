# ---------- deps ----------
FROM oven/bun:1.1.26-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---------- build ----------
FROM deps AS build
WORKDIR /app
COPY . .
RUN bun run build  # gera /dist
RUN bunx drizzle-kit generate --config=drizzle.config.ts  # gera migrations

# ---------- runtime ----------
FROM oven/bun:1.1.26-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle

EXPOSE 1313
CMD ["bun", "run", "dist/index.js"]
