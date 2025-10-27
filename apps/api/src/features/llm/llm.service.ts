import { Injectable, Logger } from '@nestjs/common';
import { GeminiAdapter } from './adapters/gemini.adapter';
import { OpenAIAdapter } from './adapters/openai.adapter';
import {
  LLMAdapter,
  LLMResponse,
  LLMStreamChunk,
} from './interfaces/llm-adapter.interface';

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private adapters: LLMAdapter[];

  constructor(
    private geminiAdapter: GeminiAdapter,
    private openaiAdapter: OpenAIAdapter,
  ) {
    // Priority order: Gemini first, then OpenAI as fallback
    this.adapters = [this.geminiAdapter, this.openaiAdapter];
  }

  private getAvailableAdapter(): LLMAdapter | null {
    for (const adapter of this.adapters) {
      const isAvailable = adapter.isAvailable();
      if (isAvailable) {
        this.logger.log(`Using ${adapter.getProviderName()} adapter`);
        return adapter;
      }
    }
    this.logger.error('No LLM adapters available');
    return null;
  }

  async summarize(text: string): Promise<LLMResponse> {
    const adapter = this.getAvailableAdapter();
    if (!adapter) {
      throw new Error('No LLM provider available');
    }

    try {
      return await adapter.summarize(text);
    } catch (error) {
      this.logger.error(
        `Error with ${adapter.getProviderName()}, trying fallback`,
        error,
      );

      // Try next adapter as fallback
      const fallbackAdapter = this.adapters.find(
        (a) => a !== adapter && a.isAvailable(),
      );
      if (fallbackAdapter) {
        this.logger.log(`Falling back to ${fallbackAdapter.getProviderName()}`);
        return await fallbackAdapter.summarize(text);
      }

      throw error;
    }
  }

  async *summarizeStream(
    text: string,
  ): AsyncGenerator<LLMStreamChunk & { provider?: string }> {
    const adapter = this.getAvailableAdapter();
    if (!adapter) {
      throw new Error('No LLM provider available');
    }

    try {
      for await (const chunk of adapter.summarizeStream(text)) {
        yield {
          ...chunk,
          provider: adapter.getProviderName(),
        };
      }
    } catch (error) {
      this.logger.error(
        `Error with ${adapter.getProviderName()} stream, trying fallback`,
        error,
      );

      // Try next adapter as fallback
      const fallbackAdapter = this.adapters.find(
        (a) => a !== adapter && a.isAvailable(),
      );
      if (fallbackAdapter) {
        this.logger.log(
          `Falling back to ${fallbackAdapter.getProviderName()} for streaming`,
        );
        for await (const chunk of fallbackAdapter.summarizeStream(text)) {
          yield {
            ...chunk,
            provider: fallbackAdapter.getProviderName(),
          };
        }
        return;
      }

      throw error;
    }
  }
}
