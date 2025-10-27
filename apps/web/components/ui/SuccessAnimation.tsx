'use client';

import { useEffect, useState } from 'react';

interface SuccessAnimationProps {
  /**
   * Message to display
   */
  message?: string;
  /**
   * Custom className for styling
   */
  className?: string;
  /**
   * Auto-hide after duration in milliseconds (0 = don't hide)
   * @default 3000
   */
  autoHideDuration?: number;
  /**
   * Callback when animation completes
   */
  onComplete?: () => void;
}

/**
 * SuccessAnimation component
 * Shows a celebratory animation when a task completes successfully
 */
export function SuccessAnimation({
  message = 'Summary complete!',
  className = '',
  autoHideDuration = 3000,
  onComplete,
}: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 bg-success-50 border border-success-200 rounded-lg shadow-sm animate-slide-in-from-bottom ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Checkmark icon with animation */}
        <svg
          className="w-5 h-5 text-success-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
            className="animate-draw-checkmark"
          />
        </svg>
        {/* Outer ring animation */}
        <div className="absolute inset-0 rounded-full border-2 border-success-600 animate-ping opacity-75" />
      </div>
      <span className="text-sm font-medium text-success-700">{message}</span>
    </div>
  );
}
