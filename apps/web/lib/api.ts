const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface SummarizationRequest {
  id: string;
  status: string;
  createdAt: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: string;
  retryAfter?: number;
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public rateLimitInfo: RateLimitInfo,
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export interface SummarizationResult {
  id: string;
  originalText: string;
  summary: string | null;
  status: string;
  llmProvider: string;
  tokensInput: number | null;
  tokensOutput: number | null;
  costEstimate: number | null;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function createSummarization(
  text: string,
): Promise<SummarizationRequest> {
  try {
    const response = await fetch(`${API_URL}/summarization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      // Handle rate limit errors specially
      if (response.status === 429) {
        const errorData = await response.json();
        const rateLimitInfo: RateLimitInfo = {
          limit: errorData.limit || parseInt(response.headers.get('X-RateLimit-Limit') || '5'),
          remaining: errorData.remaining || parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
          reset: errorData.resetAt || response.headers.get('X-RateLimit-Reset') || new Date().toISOString(),
          retryAfter: errorData.retryAfter || parseInt(response.headers.get('Retry-After') || '3600'),
        };
        throw new RateLimitError(
          errorData.message || 'Rate limit exceeded. Please try again later.',
          rateLimitInfo,
        );
      }

      const errorText = await response.text();
      throw new Error(
        `Failed to create summarization: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Unable to connect to API at ${API_URL}. Make sure the API server is running.`,
      );
    }
    throw error;
  }
}

export function streamSummary(
  id: string,
  onChunk: (chunk: { text: string; done: boolean; provider?: string }) => void,
  onError: (error: Error) => void,
  onComplete: () => void,
) {
  const eventSource = new EventSource(
    `${API_URL}/summarization/stream/${id}`,
  );

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onChunk(data);

      if (data.done) {
        eventSource.close();
        onComplete();
      }
    } catch (error) {
      console.error('Error parsing SSE data:', error);
      eventSource.close();
      onError(error as Error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE Error:', error);
    eventSource.close();
    onError(new Error('Connection error'));
  };

  return eventSource;
}

export async function getSummarization(
  id: string,
): Promise<SummarizationResult> {
  try {
    const response = await fetch(`${API_URL}/summarization/${id}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch summarization: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Unable to connect to API at ${API_URL}. Make sure the API server is running.`,
      );
    }
    throw error;
  }
}

export async function getRecentSummarizations(
  limit: number = 10,
): Promise<SummarizationResult[]> {
  try {
    const response = await fetch(`${API_URL}/summarization?limit=${limit}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch summarizations: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Unable to connect to API at ${API_URL}. Make sure the API server is running.`,
      );
    }
    throw error;
  }
}

export async function getAnalytics() {
  try {
    const response = await fetch(`${API_URL}/analytics/summary`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch analytics: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Unable to connect to API at ${API_URL}. Make sure the API server is running.`,
      );
    }
    throw error;
  }
}
