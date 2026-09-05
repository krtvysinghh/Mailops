# Multi-stage build for Standalone Self-Hosted Mailops
FROM node:20-alpine AS builder

WORKDIR /app

# Copy API & Web packages
COPY api/package*.json ./api/
COPY web/package*.json ./web/

# Install dependencies
RUN cd api && npm install --ignore-scripts
RUN cd web && npm install --ignore-scripts

# Copy source
COPY api ./api
COPY web ./web

# Build frontend
RUN cd web && npm run build

# Production runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/api ./api
COPY --from=builder /app/web/dist ./web/dist

EXPOSE 3000

CMD ["node", "api/dist/server.js"]
