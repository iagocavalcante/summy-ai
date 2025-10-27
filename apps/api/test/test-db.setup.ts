import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';

export class TestDatabase {
  private client: postgres.Sql | null = null;
  private db: ReturnType<typeof drizzle> | null = null;

  async connect() {
    const connectionString =
      process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('TEST_DATABASE_URL or DATABASE_URL is not defined');
    }

    this.client = postgres(connectionString);
    this.db = drizzle(this.client, { schema });
  }

  async cleanup() {
    if (!this.db) return;

    // Clean up all tables
    await this.db.delete(schema.summarizationRequests);
    await this.db.delete(schema.analytics);
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      this.client = null;
      this.db = null;
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }
}
