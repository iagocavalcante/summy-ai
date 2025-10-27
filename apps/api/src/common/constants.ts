// Token estimation (rough estimate: 1 token ≈ 4 chars)
export const CHARS_PER_TOKEN = 4;

// LLM Provider pricing (per million tokens)
export const LLM_PRICING = {
  gemini: {
    input: 0.075,
    output: 0.3,
  },
  openai: {
    input: 0.15,
    output: 0.6,
  },
} as const;

// Request status
export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

// LLM Providers
export const LLM_PROVIDERS = {
  GEMINI: 'gemini',
  OPENAI: 'openai',
  UNKNOWN: 'unknown',
} as const;

export type LLMProviderType =
  (typeof LLM_PROVIDERS)[keyof typeof LLM_PROVIDERS];
