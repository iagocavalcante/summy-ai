import { LLM_PRICING, LLMProviderType, LLM_PROVIDERS } from '../constants';

export class CostCalculator {
  /**
   * Calculate the cost estimate for LLM usage
   * @param provider - The LLM provider name
   * @param inputTokens - Number of input tokens
   * @param outputTokens - Number of output tokens
   * @returns Cost in USD
   */
  static calculate(
    provider: LLMProviderType,
    inputTokens: number,
    outputTokens: number,
  ): number {
    // Default to OpenAI pricing if provider not recognized
    const providerKey = provider === LLM_PROVIDERS.GEMINI ? 'gemini' : 'openai';
    const costs = LLM_PRICING[providerKey];

    return (
      (inputTokens * costs.input) / 1_000_000 +
      (outputTokens * costs.output) / 1_000_000
    );
  }

  /**
   * Estimate token count from text
   * @param text - The text to estimate tokens for
   * @returns Estimated token count
   */
  static estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }
}
