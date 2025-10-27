import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { DbService } from '../../db/db.service';
import { summarizationRequests } from '../../db/schema';
import { LLMService } from '../llm/llm.service';
import { CostCalculator } from '../../common/utils/cost-calculator';
import { AnalyticsUpdaterService } from '../../common/services/analytics-updater.service';
import { REQUEST_STATUS, LLM_PROVIDERS } from '../../common/constants';

export interface SummarizationJob {
  requestId: string;
  text: string;
}

@Processor('summarization')
export class SummarizationProcessor extends WorkerHost {
  private readonly logger = new Logger(SummarizationProcessor.name);

  constructor(
    private dbService: DbService,
    private llmService: LLMService,
    private analyticsUpdater: AnalyticsUpdaterService,
  ) {
    super();
  }

  async process(job: Job<SummarizationJob>): Promise<void> {
    const { requestId, text } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing summarization request ${requestId}`, {
      jobId: job.id,
      attempt: job.attemptsMade + 1,
    });

    try {
      // Update status to PROCESSING
      await this.dbService.db
        .update(summarizationRequests)
        .set({ status: REQUEST_STATUS.PROCESSING })
        .where(eq(summarizationRequests.id, requestId));

      // Get summary from LLM
      const result = await this.llmService.summarize(text);
      const duration = Date.now() - startTime;

      // Calculate cost estimate
      const costEstimate = CostCalculator.calculate(
        result.provider as any,
        result.tokensInput || 0,
        result.tokensOutput || 0,
      );

      // Update request with results
      await this.dbService.db
        .update(summarizationRequests)
        .set({
          summary: result.text,
          status: REQUEST_STATUS.COMPLETED,
          llmProvider: result.provider,
          tokensInput: result.tokensInput,
          tokensOutput: result.tokensOutput,
          costEstimate,
          duration,
        })
        .where(eq(summarizationRequests.id, requestId));

      // Update analytics
      await this.analyticsUpdater.updateAnalytics({
        provider: result.provider as any,
        success: true,
        inputTokens: result.tokensInput || 0,
        outputTokens: result.tokensOutput || 0,
        cost: costEstimate,
        duration,
      });

      this.logger.log(`Completed summarization request ${requestId}`, {
        provider: result.provider,
        duration,
        tokensUsed: (result.tokensInput || 0) + (result.tokensOutput || 0),
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Failed to process summarization request ${requestId}`,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
        },
      );

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
        duration,
      });

      // Re-throw to trigger retry mechanism
      throw error;
    }
  }
}
