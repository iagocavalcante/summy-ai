import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { eq, gte, desc, sum, avg } from 'drizzle-orm';
import { DbService } from '../../db/db.service';
import { summarizationRequests, analytics } from '../../db/schema';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private dbService: DbService) {}

  async getAnalytics(days: number = 7) {
    try {
      // Validate and sanitize days parameter
      const sanitizedDays = Math.min(Math.max(1, days), 365);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - sanitizedDays);
      startDate.setHours(0, 0, 0, 0);

      const analyticsData = await this.dbService.db
        .select()
        .from(analytics)
        .where(gte(analytics.date, startDate))
        .orderBy(desc(analytics.date));

      return analyticsData;
    } catch (error) {
      this.logger.error('Error fetching analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        days,
      });
      throw new BadRequestException('Failed to fetch analytics');
    }
  }

  async getSummary() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Execute all queries in parallel for better performance
      const [
        todayAnalyticsResult,
        recentRequestsResult,
        allTimeAnalyticsResult,
      ] = await Promise.all([
        // Get today's analytics
        this.dbService.db
          .select()
          .from(analytics)
          .where(eq(analytics.date, today))
          .limit(1),

        // Get recent requests
        this.dbService.db
          .select({
            id: summarizationRequests.id,
            status: summarizationRequests.status,
            llmProvider: summarizationRequests.llmProvider,
            duration: summarizationRequests.duration,
            createdAt: summarizationRequests.createdAt,
          })
          .from(summarizationRequests)
          .orderBy(desc(summarizationRequests.createdAt))
          .limit(10),

        // Get all-time analytics aggregation
        this.dbService.db
          .select({
            totalRequests: sum(analytics.totalRequests),
            successfulRequests: sum(analytics.successfulRequests),
            failedRequests: sum(analytics.failedRequests),
            totalTokensUsed: sum(analytics.totalTokensUsed),
            totalCost: sum(analytics.totalCost),
            avgDuration: avg(analytics.avgDuration),
            geminiRequests: sum(analytics.geminiRequests),
            openaiRequests: sum(analytics.openaiRequests),
          })
          .from(analytics)
          .limit(1),
      ]);

      const todayAnalytics = todayAnalyticsResult[0];
      const recentRequests = recentRequestsResult;
      const allTimeAnalytics = allTimeAnalyticsResult[0];

      return {
        allTime: {
          totalRequests: Number(allTimeAnalytics?.totalRequests) || 0,
          successfulRequests: Number(allTimeAnalytics?.successfulRequests) || 0,
          failedRequests: Number(allTimeAnalytics?.failedRequests) || 0,
          totalTokensUsed: Number(allTimeAnalytics?.totalTokensUsed) || 0,
          totalCost: Number(allTimeAnalytics?.totalCost) || 0,
          avgDuration: Number(allTimeAnalytics?.avgDuration) || 0,
          geminiRequests: Number(allTimeAnalytics?.geminiRequests) || 0,
          openaiRequests: Number(allTimeAnalytics?.openaiRequests) || 0,
        },
        today: todayAnalytics || {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalTokensUsed: 0,
          totalCost: 0,
          avgDuration: 0,
          geminiRequests: 0,
          openaiRequests: 0,
        },
        recentRequests,
      };
    } catch (error) {
      this.logger.error('Error fetching analytics summary', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new BadRequestException('Failed to fetch analytics summary');
    }
  }
}
