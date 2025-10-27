import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { GeminiAdapter } from './adapters/gemini.adapter';
import { OpenAIAdapter } from './adapters/openai.adapter';

@Module({
  providers: [LLMService, GeminiAdapter, OpenAIAdapter],
  exports: [LLMService],
})
export class LLMModule {}
