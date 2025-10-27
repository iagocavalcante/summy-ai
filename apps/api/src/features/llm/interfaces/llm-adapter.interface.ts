export interface LLMResponse {
  text: string;
  tokensInput?: number;
  tokensOutput?: number;
  model: string;
  provider: string;
}

export interface LLMStreamChunk {
  text: string;
  done: boolean;
}

export interface LLMAdapter {
  summarize(text: string): Promise<LLMResponse>;
  summarizeStream(text: string): AsyncGenerator<LLMStreamChunk>;
  isAvailable(): boolean;
  getProviderName(): string;
}
