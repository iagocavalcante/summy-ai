# Build stage
FROM node:20-alpine AS builder

# Install pnpm - use specific version
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all workspace package.json files
COPY apps/api/package.json ./apps/api/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY packages ./packages

# Build the application
WORKDIR /app/apps/api
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/drizzle ./drizzle
COPY --from=builder /app/apps/api/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/apps/api/package.json ./package.json

# Copy workspace files for pnpm deploy
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Use pnpm deploy to install production dependencies without symlinks
# This creates a proper node_modules with all dependencies copied, not linked
RUN pnpm deploy --prod --filter=api /tmp/deploy && \
    mv /tmp/deploy/node_modules ./node_modules && \
    rm -rf /tmp/deploy

# Expose port
EXPOSE 3000

ENV PORT=3000

# Start the application
CMD ["node", "dist/src/main.js"]
