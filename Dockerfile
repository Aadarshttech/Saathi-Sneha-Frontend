# syntax=docker/dockerfile:1

# ── deps: install once, cached as long as package.json is unchanged ───────────
# no package-lock.json is committed for this workspace, so npm install (not ci)
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

# ── builder: full node_modules + prisma CLI, used both to build the app and to
#    run one-off `prisma db push` from deploy.sh (see infra/aws/docker-compose.yml)
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# several pages statically prerender at build time and query the DB directly,
# so a *real*, reachable DATABASE_URL is required here — not just a stub —
# plus a couple of modules throw at import time if the secrets below are unset.
# infra/aws/docker-compose.yml passes the real values from apps/web/.env as
# build args; these ARG defaults only cover ad-hoc `docker build` runs.
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/db"
ARG STRIPE_SECRET_KEY="sk_test_build_placeholder"
ARG STRIPE_WEBHOOK_SECRET="whsec_build_placeholder"
ARG KHALTI_SECRET_KEY="build_placeholder"
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ARG NEXT_PUBLIC_ORG_ID="default-org"
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV DATABASE_URL=$DATABASE_URL
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
ENV KHALTI_SECRET_KEY=$KHALTI_SECRET_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_ORG_ID=$NEXT_PUBLIC_ORG_ID
RUN npm run build

# ── runner: minimal runtime image, only the traced standalone output ──────────
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# next's file tracing sometimes misses Prisma's query engine binary — copy explicitly
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
