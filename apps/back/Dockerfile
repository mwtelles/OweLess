# ---------- deps ----------
FROM oven/bun:1.1.26-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---------- build ----------
FROM deps AS build
WORKDIR /app
COPY . .

ENV NODE_ENV=development

RUN set -ex \
    && bun --version \
    && bun x drizzle-kit --version \
    && echo "NODE_ENV=$NODE_ENV" \
    && echo "Has DATABASE_URL? " && [ -z "$DATABASE_URL" ] && echo "no" || echo "yes"

RUN bun x drizzle-kit generate --config=drizzle.config.ts

RUN bun run build

# ---------- runtime ----------
FROM oven/bun:1.1.26-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle

EXPOSE 1313
CMD ["bun", "run", "dist/index.js"]
