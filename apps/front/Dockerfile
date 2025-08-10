# ---------- build ----------
# Debian-based Bun image (oficial Nuxt example)
FROM oven/bun:1 AS build
WORKDIR /app

# Use your lockfile name
COPY package.json bun.lock ./

# Avoid building native optional deps during install (e.g. better-sqlite3)
# Also disable OXC to avoid native binding during prepare
ENV NUXT_NO_OXC=1
RUN bun install --frozen-lockfile --ignore-scripts

# Copy project
COPY . .

# Ensure Nitro targets Bun; keep OXC disabled for build
ENV NITRO_PRESET=bun
ENV NUXT_NO_OXC=1

# Build (Nuxt 4) using Bun
RUN bun --bun run build

# ---------- runtime ----------
FROM oven/bun:1 AS production
WORKDIR /app
ENV NODE_ENV=production

# Only .output is required to run Nitro
COPY --from=build /app/.output /app

# Railway/containers expose 3000
EXPOSE 3000/tcp

# Run Nitro server
ENTRYPOINT ["bun", "--bun", "run", "/app/server/index.mjs"]
