# syntax=docker/dockerfile:1.7

# ============================================================
# Stage 1a: Full deps (für Build)
# ============================================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Nutze pnpm via corepack (schlanker als globales Install)
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prefer-offline

# ============================================================
# Stage 1b: Production-only deps (für Migrator-Script im Runner)
# Pnpm + Next standalone trackt nicht alle Submodule sauber, deshalb
# brauchen drizzle-orm/postgres-js/migrator und postgres separat.
# ============================================================
FROM node:20-alpine AS deps-prod
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile --prefer-offline --shamefully-hoist

# ============================================================
# Stage 2: Builder
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js build (output: standalone in next.config.mjs)
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy DATABASE_URL nur fürs Modul-Loading zur Build-Zeit — postgres-js
# connected lazy, deshalb läuft's durch. Wert wird zur Laufzeit von Sliplane
# überschrieben.
ENV DATABASE_URL=postgres://build:build@localhost:5432/build_placeholder
RUN pnpm build

# ============================================================
# Stage 3: Runner (production image)
# ============================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
# PORT wird in Production von Sliplane gesetzt (Range 8080-65535).
# Default 3000 nur für lokalen Container-Test.
ENV PORT=3000

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone-Output kopieren
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Migrations-Setup für Container-Start. Das Migrator-Script lebt in einem
# eigenen Unterordner mit eigenen node_modules — sonst findet ESM die
# Submodule von drizzle-orm nicht (pnpm + Next-Standalone sind hier zickig).
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.mjs ./migrator/migrate.mjs
COPY --from=deps-prod --chown=nextjs:nodejs /app/node_modules ./migrator/node_modules

USER nextjs

EXPOSE 3000

# Sliplane prüft selbst, dass der Container hochgekommen ist; ein interner
# Healthcheck hilft zusätzlich beim lokalen `docker run`-Test.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --quiet --tries=1 --spider "http://localhost:${PORT}/api/health" || exit 1

# Beim Start: erst Migrationen einspielen, dann Server starten.
# Schlägt der Migrate-Schritt fehl, beendet sich der Container — Sliplane
# meldet dann automatisch "service nicht hochgekommen".
CMD ["sh", "-c", "node ./migrator/migrate.mjs && node server.js"]
