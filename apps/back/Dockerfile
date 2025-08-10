# ---------- deps ----------
FROM oven/bun:1.1.26-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---------- build ----------
FROM deps AS build
WORKDIR /app
COPY . .
RUN bun run build    # <-- dispara postbuild -> drizzle-kit generate

# ---------- runtime ----------
FROM oven/bun:1.1.26-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts

EXPOSE 1313

CMD ["bun", "run", "start"]
