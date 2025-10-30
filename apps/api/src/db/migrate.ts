import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Remove Prisma-specific parameters from DATABASE_URL
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  // Remove ?schema=public or any other query parameters that postgres driver doesn't support
  return url.split('?')[0];
};

async function runMigrations() {
  console.log('Starting database migrations...');

  const databaseUrl = getDatabaseUrl();
  console.log('Connecting to database...');

  // Create a connection for migrations
  const migrationConnection = postgres(databaseUrl, { max: 1 });

  try {
    const db = drizzle(migrationConnection);

    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await migrationConnection.end();
  }
}

runMigrations();
