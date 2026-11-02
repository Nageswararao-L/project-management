# Builds both apps. Used by docker-compose.yml through the `api` and `web` targets.

# ---- build: install dependencies and build api + web --------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NX_DAEMON=false \
    NX_NO_CLOUD=true \
    NX_SKIP_NX_CACHE=true \
    CI=true

# Manifests first so the dependency layer is cached between code changes.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY libs/shared/package.json libs/shared/
RUN npm ci --no-audit --no-fund

COPY . .
RUN npx nx run-many -t build -p api web
# Keep only runtime dependencies for the api image.
RUN npm prune --omit=dev --no-audit --no-fund

# ---- api: NestJS server -------------------------------------------------------
FROM node:22-bookworm-slim AS api
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/libs/shared/package.json ./libs/shared/package.json
COPY --from=build /app/libs/shared/dist ./libs/shared/dist
COPY --from=build /app/apps/api/dist ./apps/api/dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=6 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/api/dist/main.js"]

# ---- web: static React build served by nginx (also proxies /api) ---------------
FROM nginx:1.27-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
