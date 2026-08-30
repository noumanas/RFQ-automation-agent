# Build context must be the repo root (this is a pnpm workspace):
#   docker build -f apps/api/Dockerfile -t rfqly-api .

FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --filter api...

FROM deps AS build
COPY apps/api apps/api
RUN pnpm --filter api build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api ./apps/api
WORKDIR /repo/apps/api

EXPOSE 8080
CMD ["node", "dist/index.js"]
