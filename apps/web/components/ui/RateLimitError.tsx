import { useEffect, useState } from 'react';
import type { RateLimitInfo } from '@/lib/api';

interface RateLimitErrorProps {
  message: string;
  rateLimitInfo: RateLimitInfo;
  onDismiss?: () => void;
}

/**
 * Formats seconds into a human-readable time string
 */
function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours !== 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
}

/**
 * Formats a date string into a localized time
 */
function formatResetTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'soon';
  }
}

export function RateLimitError({
  message,
  rateLimitInfo,
  onDismiss,
}: RateLimitErrorProps) {
  const [countdown, setCountdown] = useState(rateLimitInfo.retryAfter || 0);

  useEffect(() => {
    if (!rateLimitInfo.retryAfter || rateLimitInfo.retryAfter <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitInfo.retryAfter]);

  return (
    <div className="mt-6 p-6 bg-gradient-to-br from-warning-50 via-warning-100/50 to-orange-50 border-2 border-warning-300 rounded-xl shadow-lg animate-slide-in-from-top">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-12 h-12 bg-warning-500 rounded-full flex items-center justify-center shadow-md">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div>
            <h4 className="text-warning-900 font-bold text-lg mb-1">
              Rate Limit Reached
            </h4>
            <p className="text-warning-800 text-base leading-relaxed">
              {message}
            </p>
          </div>

          {/* Rate limit details */}
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-warning-200 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-warning-700 uppercase tracking-wide">
                  Requests Allowed
                </p>
                <p className="text-2xl font-bold text-warning-900">
                  {rateLimitInfo.limit}
                  <span className="text-sm font-normal text-warning-600 ml-1">
                    per hour
                  </span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-warning-700 uppercase tracking-wide">
                  Remaining
                </p>
                <p className="text-2xl font-bold text-warning-900">
                  {rateLimitInfo.remaining}
                </p>
              </div>
            </div>

            {/* Countdown timer */}
            {countdown > 0 && (
              <div className="pt-3 border-t border-warning-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-warning-700 uppercase tracking-wide">
                    Try Again In
                  </p>
                  <p className="text-xs text-warning-600">
                    Resets at {formatResetTime(rateLimitInfo.reset)}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-warning-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-warning-500 to-orange-500 transition-all duration-1000 ease-linear"
                        style={{
                          width: `${((rateLimitInfo.retryAfter || 0) - countdown) / (rateLimitInfo.retryAfter || 1) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2 min-w-fit">
                      <svg
                        className="w-4 h-4 text-warning-600 animate-pulse"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm font-bold text-warning-900 tabular-nums">
                        {formatTimeRemaining(countdown)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Helpful tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-800 mb-1">
                  💡 Pro Tips
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Your limit resets every hour automatically</li>
                  <li>• You can use {rateLimitInfo.limit} summarizations per hour</li>
                  <li>• Come back after the countdown to try again</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-warning-400 hover:text-warning-600 transition-colors"
            aria-label="Dismiss"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
