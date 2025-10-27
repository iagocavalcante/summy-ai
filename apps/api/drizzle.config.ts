import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

// Remove Prisma-specific parameters from DATABASE_URL
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL!;
  // Remove ?schema=public or any other query parameters that postgres driver doesn't support
  return url.split('?')[0];
};

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
  schemaFilter: ['public'], // Specify the schema to use
});
