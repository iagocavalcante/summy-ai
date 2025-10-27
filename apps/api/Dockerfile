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

# Install pnpm - use specific version
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and node_modules
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/drizzle ./drizzle
COPY --from=builder /app/apps/api/drizzle.config.ts ./

# Expose port
EXPOSE 3000

ENV PORT=3000

# Start the application
CMD ["node", "dist/src/main.js"]
