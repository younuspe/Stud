# syntax=docker/dockerfile:1

# ── Build stage: install deps and compile the Vite bundle ────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Runtime stage: only production deps + built assets ───────────────────────
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server.ts server.providers.ts server.ratelimit.ts ./
# tsx runs the TypeScript server directly; no separate compile step needed.
RUN npm install -g tsx@4

EXPOSE 3000
ENV PORT=3000 SUPRU_HOST=0.0.0.0
# /api/health is unauthenticated and cheap, so it works as a container probe.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["tsx", "server.ts"]
