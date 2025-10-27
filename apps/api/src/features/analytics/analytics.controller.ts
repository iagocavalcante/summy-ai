import {
  Controller,
  Get,
  Query,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async getAnalytics(@Query('days') days?: string) {
    let daysCount = 7;

    if (days) {
      daysCount = parseInt(days, 10);
      if (isNaN(daysCount) || daysCount < 1 || daysCount > 365) {
        throw new BadRequestException('Days must be between 1 and 365');
      }
    }

    this.logger.log(`Fetching analytics for ${daysCount} days`);
    return this.analyticsService.getAnalytics(daysCount);
  }

  @Get('summary')
  async getSummary() {
    this.logger.log('Fetching analytics summary');
    return this.analyticsService.getSummary();
  }
}
