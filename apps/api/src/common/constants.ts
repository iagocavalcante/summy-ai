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

export type RequestStatusType =
  (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];

export function isValidRequestStatus(
  status: string,
): status is RequestStatusType {
  return Object.values(REQUEST_STATUS).includes(status as RequestStatusType);
}

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  // Summarization endpoint
  SUMMARIZATION: {
    MAX: 5, // requests
    WINDOW_MS: 3600000, // 1 hour in milliseconds
    KEY_PREFIX: 'summarization',
  },
  // Default for other endpoints
  DEFAULT: {
    MAX: 100,
    WINDOW_MS: 60000, // 1 minute
    KEY_PREFIX: 'ratelimit',
  },
  // Strict rate limit for expensive operations
  STRICT: {
    MAX: 10,
    WINDOW_MS: 3600000, // 1 hour
    KEY_PREFIX: 'strict',
  },
} as const;
