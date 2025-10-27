import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { eq, desc } from 'drizzle-orm';
import { DbService } from '../../db/db.service';
import { summarizationRequests } from '../../db/schema';
import { LLMService } from '../llm/llm.service';
import { CreateSummarizationDto } from './dto/create-summarization.dto';
import { SummarizationJob } from './summarization.processor';
import { CostCalculator } from '../../common/utils/cost-calculator';
import { AnalyticsUpdaterService } from '../../common/services/analytics-updater.service';
import { REQUEST_STATUS, LLM_PROVIDERS } from '../../common/constants';

@Injectable()
export class SummarizationService {
  private readonly logger = new Logger(SummarizationService.name);

  constructor(
    private dbService: DbService,
    private llmService: LLMService,
    private analyticsUpdater: AnalyticsUpdaterService,
    @InjectQueue('summarization') private summarizationQueue: Queue,
  ) {}

  async create(createDto: CreateSummarizationDto) {
    try {
      // Create request record
      const [request] = await this.dbService.db
        .insert(summarizationRequests)
        .values({
          originalText: createDto.text,
          status: REQUEST_STATUS.PENDING,
          llmProvider: 'pending',
          userId: createDto.userId,
        })
        .returning();

      // Add job to queue with priority based on text length
      const priority = this.calculatePriority(createDto.text.length);
      await this.summarizationQueue.add(
        'summarize',
        {
          requestId: request.id,
          text: createDto.text,
        } as SummarizationJob,
        {
          priority,
          jobId: request.id, // Use request ID as job ID for idempotency
        },
      );

      this.logger.log(
        `Created summarization request ${request.id} with priority ${priority}`,
      );

      return {
        id: request.id,
        status: request.status,
        createdAt: request.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to create summarization request', {
        error,
        userId: createDto.userId,
      });
      throw new BadRequestException('Failed to create summarization request');
    }
  }

  private calculatePriority(textLength: number): number {
    // Shorter texts get higher priority (lower number = higher priority)
    if (textLength < 1000) return 1;
    if (textLength < 5000) return 2;
    return 3;
  }

  async *streamSummary(requestId: string) {
    // Validate request ID
    if (!requestId || typeof requestId !== 'string') {
      throw new BadRequestException('Invalid request ID');
    }

    // Check if request exists
    const [request] = await this.dbService.db
      .select()
      .from(summarizationRequests)
      .where(eq(summarizationRequests.id, requestId));

    if (!request) {
      throw new NotFoundException(
        `Summarization request ${requestId} not found`,
      );
    }

    // If already completed, return the cached result
    if (request.status === REQUEST_STATUS.COMPLETED && request.summary) {
      this.logger.log(`Serving cached summary for request ${requestId}`);
      yield {
        text: request.summary,
        done: true,
        provider: request.llmProvider,
      };
      return;
    }

    // If failed, throw error
    if (request.status === REQUEST_STATUS.FAILED) {
      const errorMsg = request.errorMessage || 'Summarization failed';
      this.logger.warn(`Request ${requestId} previously failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Stream from LLM
    const startTime = Date.now();
    let fullText = '';
    let provider = '';

    try {
      for await (const chunk of this.llmService.summarizeStream(
        request.originalText,
      )) {
        if (chunk.provider) {
          provider = chunk.provider;
        }
        if (chunk.text) {
          fullText += chunk.text;
        }
        yield chunk;
      }

      const duration = Date.now() - startTime;

      // Estimate tokens
      const tokensInput = CostCalculator.estimateTokens(request.originalText);
      const tokensOutput = CostCalculator.estimateTokens(fullText);

      // Calculate cost
      const costEstimate = CostCalculator.calculate(
        provider as any,
        tokensInput,
        tokensOutput,
      );

      // Update request with results
      await this.dbService.db
        .update(summarizationRequests)
        .set({
          summary: fullText,
          status: REQUEST_STATUS.COMPLETED,
          llmProvider: provider,
          tokensInput,
          tokensOutput,
          costEstimate,
          duration,
        })
        .where(eq(summarizationRequests.id, requestId));

      // Update analytics
      await this.analyticsUpdater.updateAnalytics({
        provider: provider as any,
        success: true,
        inputTokens: tokensInput,
        outputTokens: tokensOutput,
        cost: costEstimate,
        duration,
      });

      this.logger.log(`Completed streaming for request ${requestId}`, {
        provider,
        duration,
        tokensInput,
        tokensOutput,
      });
    } catch (error) {
      this.logger.error(`Error streaming summary for ${requestId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await this.dbService.db
        .update(summarizationRequests)
        .set({
          status: REQUEST_STATUS.FAILED,
          errorMessage,
        })
        .where(eq(summarizationRequests.id, requestId));

      await this.analyticsUpdater.updateAnalytics({
        provider: LLM_PROVIDERS.UNKNOWN as any,
        success: false,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        duration: Date.now() - startTime,
      });

      throw error;
    }
  }

  async findOne(id: string) {
    if (!id || typeof id !== 'string') {
      throw new BadRequestException('Invalid request ID');
    }

    try {
      const [request] = await this.dbService.db
        .select()
        .from(summarizationRequests)
        .where(eq(summarizationRequests.id, id));

      if (!request) {
        throw new NotFoundException(`Summarization request ${id} not found`);
      }

      return request;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Error fetching request ${id}`, error);
      throw new BadRequestException('Failed to fetch summarization request');
    }
  }

  async findAll(
    limit: number = 10,
    status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
  ) {
    try {
      // Validate and sanitize limit
      const sanitizedLimit = Math.min(Math.max(1, limit), 100);

      const query = this.dbService.db
        .select()
        .from(summarizationRequests)
        .orderBy(desc(summarizationRequests.createdAt))
        .limit(sanitizedLimit);

      if (status) {
        return query.where(eq(summarizationRequests.status, status));
      }

      return query;
    } catch (error) {
      this.logger.error('Error fetching summarization requests', error);
      throw new BadRequestException('Failed to fetch summarization requests');
    }
  }
}
