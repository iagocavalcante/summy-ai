import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface RateLimitConfig {
  max: number;
  windowMs: number;
  keyPrefix?: string;
}

export interface RateLimitInfo {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // seconds until next request allowed
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly redis: Redis;
  private readonly defaultConfig: RateLimitConfig;

  constructor(private configService: ConfigService) {
    // Initialize Redis connection
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected for rate limiting');
    });

    // Connect to Redis
    this.redis.connect().catch((error) => {
      this.logger.error('Failed to connect to Redis:', error);
    });

    // Default rate limit configuration
    this.defaultConfig = {
      max: this.configService.get('RATE_LIMIT_MAX', 5),
      windowMs: this.configService.get('RATE_LIMIT_TTL', 60) * 1000, // Convert to ms
      keyPrefix: 'ratelimit',
    };
  }

  /**
   * Check if a request is allowed based on rate limiting rules
   * Uses sliding window algorithm with Redis
   */
  async checkLimit(
    identifier: string,
    config?: Partial<RateLimitConfig>,
  ): Promise<RateLimitInfo> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const key = `${finalConfig.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - finalConfig.windowMs;

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();

      // Remove old entries outside the window
      pipeline.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      pipeline.zcard(key);

      // Add current request timestamp
      pipeline.zadd(key, now, `${now}`);

      // Set expiry on the key
      pipeline.expire(key, Math.ceil(finalConfig.windowMs / 1000));

      // Get TTL to calculate reset time
      pipeline.ttl(key);

      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Redis pipeline execution failed');
      }

      // Extract count (before adding current request)
      const count = (results[1][1] as number) || 0;
      const ttl = (results[4][1] as number) || 0;

      const allowed = count < finalConfig.max;
      const remaining = Math.max(0, finalConfig.max - count - 1);
      const resetAt = new Date(now + ttl * 1000);

      let retryAfter: number | undefined;
      if (!allowed) {
        // Calculate when the oldest request will expire
        const oldestTimestamps = await this.redis.zrange(
          key,
          0,
          0,
          'WITHSCORES',
        );
        if (oldestTimestamps && oldestTimestamps.length > 1) {
          const oldestTime = parseInt(oldestTimestamps[1], 10);
          retryAfter = Math.ceil(
            (oldestTime + finalConfig.windowMs - now) / 1000,
          );
        } else {
          retryAfter = Math.ceil(finalConfig.windowMs / 1000);
        }
      }

      this.logger.debug(`Rate limit check for ${identifier}:`, {
        count,
        allowed,
        remaining,
        resetAt,
        retryAfter,
      });

      return {
        allowed,
        limit: finalConfig.max,
        remaining: allowed ? remaining : 0,
        resetAt,
        retryAfter,
      };
    } catch (error) {
      this.logger.error('Rate limit check failed:', error);
      // On error, allow the request but log the issue
      // This ensures Redis failures don't block all traffic
      return {
        allowed: true,
        limit: finalConfig.max,
        remaining: finalConfig.max,
        resetAt: new Date(now + finalConfig.windowMs),
      };
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async resetLimit(identifier: string, keyPrefix?: string): Promise<void> {
    const prefix = keyPrefix || this.defaultConfig.keyPrefix;
    const key = `${prefix}:${identifier}`;

    try {
      await this.redis.del(key);
      this.logger.log(`Rate limit reset for ${identifier}`);
    } catch (error) {
      this.logger.error(`Failed to reset rate limit for ${identifier}:`, error);
      throw error;
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getLimitStatus(
    identifier: string,
    config?: Partial<RateLimitConfig>,
  ): Promise<RateLimitInfo> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const key = `${finalConfig.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - finalConfig.windowMs;

    try {
      const pipeline = this.redis.pipeline();

      // Remove old entries
      pipeline.zremrangebyscore(key, 0, windowStart);

      // Count current requests
      pipeline.zcard(key);

      // Get TTL
      pipeline.ttl(key);

      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Redis pipeline execution failed');
      }

      const count = (results[1][1] as number) || 0;
      const ttl = (results[2][1] as number) || 0;

      const remaining = Math.max(0, finalConfig.max - count);
      const resetAt = new Date(now + ttl * 1000);

      return {
        allowed: count < finalConfig.max,
        limit: finalConfig.max,
        remaining,
        resetAt,
      };
    } catch (error) {
      this.logger.error('Failed to get rate limit status:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
