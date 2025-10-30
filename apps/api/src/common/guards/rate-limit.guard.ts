import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import {
  RateLimiterService,
  RateLimitConfig,
} from '../services/rate-limiter.service';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions extends Partial<RateLimitConfig> {
  identifierFn?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

/**
 * Decorator to apply rate limiting to routes
 *
 * @example
 * @RateLimit({ max: 10, windowMs: 60000 }) // 10 requests per minute
 * @Post('create')
 * async create() { ... }
 *
 * @example
 * @RateLimit({
 *   max: 5,
 *   windowMs: 3600000, // 1 hour
 *   identifierFn: (req) => req.user?.id || req.ip
 * })
 * @Post('premium-feature')
 * async premiumFeature() { ... }
 */
export const RateLimit = (options?: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options || {});

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rateLimiter: RateLimiterService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    // If no rate limit decorator, allow request
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Get identifier (default to IP address)
    const identifier = options.identifierFn
      ? options.identifierFn(request)
      : this.getClientIdentifier(request);

    // Check rate limit
    const rateLimitInfo = await this.rateLimiter.checkLimit(identifier, {
      max: options.max,
      windowMs: options.windowMs,
      keyPrefix: options.keyPrefix,
    });

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', rateLimitInfo.limit);
    response.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining);
    response.setHeader(
      'X-RateLimit-Reset',
      rateLimitInfo.resetAt.toISOString(),
    );

    if (!rateLimitInfo.allowed) {
      if (rateLimitInfo.retryAfter) {
        response.setHeader('Retry-After', rateLimitInfo.retryAfter);
      }

      const message =
        options.message ||
        `Rate limit exceeded. Please try again in ${rateLimitInfo.retryAfter || 60} seconds.`;

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message,
          error: 'Too Many Requests',
          retryAfter: rateLimitInfo.retryAfter,
          resetAt: rateLimitInfo.resetAt.toISOString(),
          limit: rateLimitInfo.limit,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getClientIdentifier(request: Request): string {
    // Try to get real IP from various headers (for proxied requests)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0];
      return ips.trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return request.ip || 'unknown';
  }
}
