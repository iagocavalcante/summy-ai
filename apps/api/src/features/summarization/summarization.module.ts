import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SummarizationController } from './summarization.controller';
import { SummarizationService } from './summarization.service';
import { SummarizationProcessor } from './summarization.processor';
import { LLMModule } from '../llm/llm.module';
import { AnalyticsUpdaterService } from '../../common/services/analytics-updater.service';
import { RateLimiterService } from '../../common/services/rate-limiter.service';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'summarization',
    }),
    LLMModule,
  ],
  controllers: [SummarizationController],
  providers: [
    SummarizationService,
    SummarizationProcessor,
    AnalyticsUpdaterService,
    RateLimiterService,
    RateLimitGuard,
  ],
})
export class SummarizationModule {}
