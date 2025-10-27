import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DbService.name);
  private client: postgres.Sql;
  public db: PostgresJsDatabase<typeof schema>;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const connectionString = this.configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      this.logger.error('DATABASE_URL environment variable is not defined');
      throw new Error('DATABASE_URL is not defined');
    }

    // Remove Prisma-specific parameters (like ?schema=public) that postgres driver doesn't support
    const cleanConnectionString = connectionString.split('?')[0];

    try {
      // Configure connection with proper pooling and timeouts
      this.client = postgres(cleanConnectionString, {
        max: this.configService.get<number>('DATABASE_POOL_SIZE', 10),
        idle_timeout: 20,
        connect_timeout: 10,
        max_lifetime: 60 * 30, // 30 minutes
        onnotice: () => {}, // Suppress notices in production
        prepare: false, // Disable prepared statements for better compatibility
      });

      this.db = drizzle(this.client, { schema });
      this.logger.log('Database connection initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database connection', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log('Closing database connections');
      await this.client.end({ timeout: 5 });
      this.logger.log('Database connections closed successfully');
    } catch (error) {
      this.logger.error('Error closing database connections', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }
}
