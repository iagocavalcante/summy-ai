import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DbService } from '../../db/db.service';
import { analytics } from '../../db/schema';
import { LLMProviderType, LLM_PROVIDERS } from '../constants';

export interface AnalyticsUpdate {
  provider: LLMProviderType;
  success: boolean;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  duration: number;
}

@Injectable()
export class AnalyticsUpdaterService {
  private readonly logger = new Logger(AnalyticsUpdaterService.name);

  constructor(private dbService: DbService) {}

  /**
   * Update analytics for a completed or failed request
   */
  async updateAnalytics(update: AnalyticsUpdate): Promise<void> {
    const today = this.getStartOfDay(new Date());
    const totalTokens = update.inputTokens + update.outputTokens;

    try {
      const [existing] = await this.dbService.db
        .select()
        .from(analytics)
        .where(eq(analytics.date, today));

      if (existing) {
        await this.updateExistingAnalytics(existing, update, totalTokens);
      } else {
        await this.createNewAnalytics(today, update, totalTokens);
      }
    } catch (error) {
      this.logger.error('Failed to update analytics', {
        error,
        update,
      });
      // Don't throw - analytics update failure shouldn't break the main flow
    }
  }

  private async updateExistingAnalytics(
    existing: any,
    update: AnalyticsUpdate,
    totalTokens: number,
  ): Promise<void> {
    const newTotalRequests = existing.totalRequests + 1;
    const newAvgDuration =
      ((existing.avgDuration || 0) * existing.totalRequests + update.duration) /
      newTotalRequests;

    await this.dbService.db
      .update(analytics)
      .set({
        totalRequests: newTotalRequests,
        successfulRequests: update.success
          ? existing.successfulRequests + 1
          : existing.successfulRequests,
        failedRequests: update.success
          ? existing.failedRequests
          : existing.failedRequests + 1,
        totalTokensUsed: existing.totalTokensUsed + totalTokens,
        totalCost: existing.totalCost + update.cost,
        avgDuration: newAvgDuration,
        geminiRequests:
          update.provider === LLM_PROVIDERS.GEMINI
            ? existing.geminiRequests + 1
            : existing.geminiRequests,
        openaiRequests:
          update.provider === LLM_PROVIDERS.OPENAI
            ? existing.openaiRequests + 1
            : existing.openaiRequests,
      })
      .where(eq(analytics.date, existing.date));
  }

  private async createNewAnalytics(
    date: Date,
    update: AnalyticsUpdate,
    totalTokens: number,
  ): Promise<void> {
    await this.dbService.db.insert(analytics).values({
      date,
      totalRequests: 1,
      successfulRequests: update.success ? 1 : 0,
      failedRequests: update.success ? 0 : 1,
      totalTokensUsed: totalTokens,
      totalCost: update.cost,
      avgDuration: update.duration,
      geminiRequests: update.provider === LLM_PROVIDERS.GEMINI ? 1 : 0,
      openaiRequests: update.provider === LLM_PROVIDERS.OPENAI ? 1 : 0,
    });
  }

  private getStartOfDay(date: Date): Date {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  }
}
