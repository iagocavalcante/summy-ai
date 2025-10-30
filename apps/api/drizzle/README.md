# Database Migrations

This directory contains database migrations for the Summ AI API.

## Migration Files

### 0000_flowery_marten_broadcloak.sql
Initial database schema with:
- `request_status` enum (PENDING, PROCESSING, COMPLETED, FAILED)
- `analytics` table for tracking usage metrics
- `summarization_requests` table for storing summarization jobs

### 0001_aberrant_richard_fisk.sql
**Rate limiting feature migration** - Adds support for tracking request IPs and counts:
- Adds `request_ip` column to `summarization_requests` (text, nullable)
- Adds `count_requests` column to `summarization_requests` (integer, default 0, not null)

These fields are used by the Redis-based rate limiter to provide additional tracking capabilities.

## Running Migrations in Production

### Prerequisites
- Ensure `DATABASE_URL` environment variable is set
- Ensure the database is accessible
- Backup your production database before running migrations

### Option 1: Using npm scripts (Recommended)

```bash
# Navigate to the API directory
cd apps/api

# Run all pending migrations
npm run migration:run
```

### Option 2: Using drizzle-kit directly

```bash
# Navigate to the API directory
cd apps/api

# Push schema changes to database
npm run migration:push
```

### Option 3: Manual SQL execution

If you prefer to run migrations manually:

```bash
# Connect to your production database
psql $DATABASE_URL

# Run the migration SQL
\i drizzle/0001_aberrant_richard_fisk.sql
```

## Rollback Instructions

If you need to rollback the rate limiting migration (0001):

```sql
-- Connect to your database
ALTER TABLE "summarization_requests" DROP COLUMN IF EXISTS "request_ip";
ALTER TABLE "summarization_requests" DROP COLUMN IF EXISTS "count_requests";
```

**Note:** This rollback is safe as these columns are nullable/have defaults, and the rate limiting logic will fall back to Redis-only tracking if they don't exist.

## Migration Safety

✅ **0001 Migration is safe for production:**
- Adds nullable column (`request_ip`) - no data loss
- Adds column with default value (`count_requests`) - all existing rows will get 0
- Non-blocking ALTER TABLE operations
- No data transformation required
- No downtime needed
- Can be rolled back safely if needed

## Generating New Migrations

When you make schema changes:

```bash
cd apps/api

# Generate a new migration based on schema.ts changes
npm run migration:generate

# Review the generated SQL in drizzle/ directory

# Test locally first
npm run migration:run

# Commit the migration files
git add drizzle/
git commit -m "feat: add new database migration"
```

## Environment Variables

Make sure these are set before running migrations:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

For Fly.io deployments, the DATABASE_URL is automatically injected by the platform.

## Migration Status

To check which migrations have been applied:

```bash
cd apps/api
npx drizzle-kit studio
```

This opens a web UI where you can see:
- Applied migrations
- Current schema state
- Database data
