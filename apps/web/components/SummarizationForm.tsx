'use client';

import { useState } from 'react';
import { createSummarization, streamSummary } from '@/lib/api';
import { ThinkingIndicator } from '@/components/ui/ThinkingIndicator';
import { SuccessAnimation } from '@/components/ui/SuccessAnimation';
import { EmptyState } from '@/components/ui/EmptyState';
import { MarkdownContent } from '@/components/ui/MarkdownContent';
import { useStreamingText } from '@/hooks/useStreamingText';

interface Props {
  onSummaryComplete?: () => void;
}

type StreamingPhase = 'idle' | 'submitting' | 'streaming' | 'complete';

/**
 * Friendly error messages with helpful suggestions
 */
const getErrorMessage = (error: string): { title: string; message: string; suggestion: string } => {
  if (error.includes('Unable to connect')) {
    return {
      title: 'Connection Issue',
      message: 'I couldn\'t reach the server right now.',
      suggestion: 'Make sure the API server is running and try again in a moment.',
    };
  }

  if (error.includes('Failed to create')) {
    return {
      title: 'Oops, Something Went Wrong',
      message: 'I had trouble processing your request.',
      suggestion: 'Please try again. If the problem persists, try with a shorter text.',
    };
  }

  if (error.includes('Connection error')) {
    return {
      title: 'Lost Connection',
      message: 'The connection was interrupted while I was working.',
      suggestion: 'Don\'t worry, your text is safe. Just click "Generate Summary" again.',
    };
  }

  return {
    title: 'Unexpected Error',
    message: 'Something unexpected happened.',
    suggestion: 'Please try again. If this keeps happening, try refreshing the page.',
  };
};

export default function SummarizationForm({ onSummaryComplete }: Props) {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [phase, setPhase] = useState<StreamingPhase>('idle');
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Use streaming text hook for natural word-by-word appearance
  const { displayedText: displayedSummary } = useStreamingText(summary, {
    chunkDelay: 40,
    wordsPerChunk: 2,
  });

  const isLoading = phase === 'submitting' || phase === 'streaming';
  const hasContent = summary.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSummary('');
    setProvider('');
    setShowSuccess(false);
    setPhase('submitting');

    try {
      // Create summarization request
      const request = await createSummarization(text);
      setPhase('streaming');

      // Stream the summary
      let fullSummary = '';

      streamSummary(
        request.id,
        (chunk) => {
          if (chunk.text) {
            fullSummary += chunk.text;
            setSummary(fullSummary);
          }
          if (chunk.provider) {
            setProvider(chunk.provider);
          }
        },
        (err) => {
          setError(err.message);
          setPhase('idle');
        },
        () => {
          setPhase('complete');
          setShowSuccess(true);
          if (onSummaryComplete) {
            onSummaryComplete();
          }
          // Auto-transition back to idle after success animation
          setTimeout(() => setPhase('idle'), 3000);
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setPhase('idle');
    }
  };

  const handleClear = () => {
    setText('');
    setSummary('');
    setError('');
    setProvider('');
    setPhase('idle');
    setShowSuccess(false);
  };

  const handleCopy = async () => {
    if (summary) {
      await navigator.clipboard.writeText(summary);
      // Could add a toast notification here
    }
  };

  const characterCount = text.length;
  const characterPercentage = (characterCount / 50000) * 100;
  const isNearLimit = characterPercentage > 80;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="text"
              className="block text-sm font-medium text-foreground"
            >
              What would you like me to summarize?
            </label>
            {text.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="relative">
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-64 px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent resize-none bg-card text-card-foreground placeholder:text-muted-foreground shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Paste your article, email, research paper, or any text you'd like summarized here...&#10;&#10;I work best with at least 50 characters, and I can handle up to 50,000!"
              disabled={isLoading}
              required
              minLength={50}
              maxLength={50000}
            />

            {/* Character counter with visual feedback */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <div className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
                <span className={isNearLimit ? 'text-warning-600 font-medium' : ''}>
                  {characterCount.toLocaleString()}
                </span>
                <span className="text-muted-foreground"> / 50,000</span>
              </div>
            </div>
          </div>

          {/* Progress bar for character limit */}
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isNearLimit ? 'bg-warning-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(characterPercentage, 100)}%` }}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {characterCount < 50 && (
              <>
                Just {50 - characterCount} more character{50 - characterCount !== 1 ? 's' : ''} to reach the minimum.
              </>
            )}
            {characterCount >= 50 && characterCount < 100 && (
              <>Perfect! I&apos;m ready to help you summarize this.</>
            )}
            {characterCount >= 100 && !isNearLimit && (
              <>Great! This looks like a good amount of text to summarize.</>
            )}
            {isNearLimit && (
              <>You&apos;re approaching the character limit. Still plenty of room though!</>
            )}
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || text.length < 50}
          className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {phase === 'submitting' && (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Starting up...</span>
              </>
            )}
            {phase === 'streaming' && (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Working on it...</span>
              </>
            )}
            {phase !== 'submitting' && phase !== 'streaming' && (
              <>
                <svg
                  className="w-5 h-5 transition-transform group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Generate Summary</span>
              </>
            )}
          </span>
          {/* Animated gradient background on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </form>

      {/* Thinking Indicator */}
      {phase === 'streaming' && (
        <div className="mt-6">
          <ThinkingIndicator
            messages={[
              "Reading your text carefully...",
              "Understanding the key points...",
              "Identifying the main ideas...",
              "Extracting the essence...",
              "Crafting your summary...",
              "Polishing the details...",
              "Almost there...",
            ]}
            rotationInterval={2500}
          />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-6 p-5 bg-error-50 border border-error-200 rounded-lg shadow-sm animate-slide-in-from-top">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-error-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-error-700 font-semibold mb-1">
                {getErrorMessage(error).title}
              </h4>
              <p className="text-error-600 text-sm mb-2">
                {getErrorMessage(error).message}
              </p>
              <p className="text-error-600/80 text-xs">
                {getErrorMessage(error).suggestion}
              </p>
            </div>
            <button
              onClick={() => setError('')}
              className="flex-shrink-0 text-error-400 hover:text-error-600 transition-colors"
              aria-label="Dismiss error"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Summary Result */}
      {hasContent && (
        <div className="mt-6 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-foreground text-lg font-semibold">Your Summary</h3>
              {provider && (
                <span className="text-xs text-muted-foreground px-2.5 py-1 bg-muted rounded-full border border-border">
                  via <span className="font-medium text-foreground">{provider}</span>
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-muted"
                title="Copy to clipboard"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
            </div>
          </div>

          {/* Summary content */}
          <div className="relative group">
            <div className="p-6 bg-card border border-border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <MarkdownContent content={displayedSummary} />
              {phase === 'streaming' && (
                <span className="inline-block w-0.5 h-5 bg-primary ml-1 animate-pulse" />
              )}
            </div>

            {/* Subtle gradient overlay on the border when streaming */}
            {phase === 'streaming' && (
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 animate-pulse pointer-events-none" />
            )}
          </div>

          {/* Success animation */}
          {showSuccess && (
            <SuccessAnimation
              message="Summary complete! Looking good."
              autoHideDuration={3000}
              onComplete={() => setShowSuccess(false)}
            />
          )}

          {/* Word count stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>
                Original: {text.split(/\s+/).filter(w => w).length} words
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>
                Summary: {summary.split(/\s+/).filter(w => w).length} words
              </span>
            </div>
            {text.split(/\s+/).filter(w => w).length > 0 && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="font-medium">
                  {Math.round((1 - (summary.split(/\s+/).filter(w => w).length / text.split(/\s+/).filter(w => w).length)) * 100)}% shorter
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasContent && !isLoading && !error && (
        <EmptyState
          title="Ready when you are!"
          description="Paste your text above and I'll create a concise, easy-to-read summary in seconds."
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      )}
    </div>
  );
}
