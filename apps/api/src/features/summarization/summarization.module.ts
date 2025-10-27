import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SummarizationController } from './summarization.controller';
import { SummarizationService } from './summarization.service';
import { SummarizationProcessor } from './summarization.processor';
import { LLMModule } from '../llm/llm.module';
import { AnalyticsUpdaterService } from '../../common/services/analytics-updater.service';

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
  ],
})
export class SummarizationModule {}
