# Dockerfile for BuildSeason
# Uses Bun runtime with multi-stage build for smaller image

# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy root package files first (for workspace resolution)
COPY package.json bun.lockb* ./

# Copy workspace package.json files
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy all source code
COPY . .

# Build the frontend
RUN bun run --filter @buildseason/web build

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy node_modules and package files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Copy API source
COPY --from=builder /app/apps/api/src ./apps/api/src

# Copy built frontend
COPY --from=builder /app/dist/web ./dist/web

# Copy drizzle migrations
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/apps/api/drizzle.config.ts ./apps/api/

# Set working directory to API app
WORKDIR /app/apps/api

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the app
CMD ["bun", "run", "src/index.tsx"]
