import { Controller, Get, Logger } from '@nestjs/common';
import { DbService } from '../../db/db.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly dbService: DbService) {}

  @Get()
  async check() {
    const startTime = Date.now();

    try {
      // Check database connection
      const dbHealthy = await this.dbService.healthCheck();
      const responseTime = Date.now() - startTime;

      const health = {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime,
        checks: {
          database: dbHealthy ? 'up' : 'down',
          memory: {
            rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
          },
        },
      };

      if (!dbHealthy) {
        this.logger.warn('Health check failed: Database is down');
        return health;
      }

      return health;
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('ready')
  async ready() {
    try {
      const dbHealthy = await this.dbService.healthCheck();

      if (dbHealthy) {
        return { status: 'ready' };
      }

      return { status: 'not ready', reason: 'Database not available' };
    } catch (error) {
      this.logger.error('Readiness check failed', error);
      return {
        status: 'not ready',
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('live')
  live() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }
}
