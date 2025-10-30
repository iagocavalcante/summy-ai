import {
  Controller,
  Post,
  Body,
  Sse,
  MessageEvent,
  Get,
  Param,
  Query,
  ValidationPipe,
  BadRequestException,
  Logger,
  Ip,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { SummarizationService } from './summarization.service';
import { CreateSummarizationDto } from './dto/create-summarization.dto';
import { RateLimiterService } from '../../common/services/rate-limiter.service';
import {
  REQUEST_STATUS,
  RequestStatusType,
  isValidRequestStatus,
  RATE_LIMIT_CONFIG,
} from '../../common/constants';

@Controller('summarization')
export class SummarizationController {
  private readonly logger = new Logger(SummarizationController.name);

  constructor(
    private readonly summarizationService: SummarizationService,
    private readonly rateLimiter: RateLimiterService,
  ) {}

  @Post()
  async create(
    @Body(ValidationPipe) createDto: CreateSummarizationDto,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userIp = ip;
    this.logger.log('Creating summarization request', {
      textLength: createDto.text.length,
      userId: createDto.userId,
    });

    // Get rate limit status before creating (for response headers)
    const rateLimitStatus = await this.rateLimiter.getLimitStatus(userIp, {
      max: RATE_LIMIT_CONFIG.SUMMARIZATION.MAX,
      windowMs: RATE_LIMIT_CONFIG.SUMMARIZATION.WINDOW_MS,
      keyPrefix: RATE_LIMIT_CONFIG.SUMMARIZATION.KEY_PREFIX,
    });

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', rateLimitStatus.limit);
    res.setHeader('X-RateLimit-Remaining', rateLimitStatus.remaining);
    res.setHeader('X-RateLimit-Reset', rateLimitStatus.resetAt.toISOString());

    const result = await this.summarizationService.create(createDto, userIp);

    // Update headers after creating (remaining count changed)
    const updatedStatus = await this.rateLimiter.getLimitStatus(userIp, {
      max: RATE_LIMIT_CONFIG.SUMMARIZATION.MAX,
      windowMs: RATE_LIMIT_CONFIG.SUMMARIZATION.WINDOW_MS,
      keyPrefix: RATE_LIMIT_CONFIG.SUMMARIZATION.KEY_PREFIX,
    });

    res.setHeader('X-RateLimit-Remaining', updatedStatus.remaining);

    return result;
  }

  @Sse('stream/:id')
  stream(@Param('id') id: string): Observable<MessageEvent> {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('Invalid request ID format');
    }

    const stream = this.summarizationService.streamSummary(id);

    return new Observable((observer) => {
      void (async () => {
        try {
          for await (const chunk of stream) {
            observer.next({
              data: JSON.stringify(chunk),
            } as MessageEvent);

            if (chunk.done) {
              observer.complete();
              break;
            }
          }
        } catch (error) {
          this.logger.error(`Error streaming for request ${id}`, error);
          observer.error(error);
        }
      })();
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('Invalid request ID format');
    }

    return this.summarizationService.findOne(id);
  }

  @Get()
  async getAll(
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    // Validate limit
    let parsedLimit = 10;
    if (limit) {
      parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        throw new BadRequestException('Limit must be between 1 and 100');
      }
    }

    // Validate status
    if (status && !isValidRequestStatus(status)) {
      const validStatuses = Object.values(REQUEST_STATUS).join(', ');
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses}`,
      );
    }

    return this.summarizationService.findAll(
      parsedLimit,
      status as RequestStatusType | undefined,
    );
  }
}
