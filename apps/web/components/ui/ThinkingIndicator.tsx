'use client';

import { useEffect, useState } from 'react';

interface ThinkingIndicatorProps {
  /**
   * Array of messages to rotate through
   */
  messages?: string[];
  /**
   * Interval to rotate messages in milliseconds
   * @default 3000
   */
  rotationInterval?: number;
  /**
   * Custom className for styling
   */
  className?: string;
}

const defaultMessages = [
  "Reading your text carefully...",
  "Understanding the key points...",
  "Identifying the main ideas...",
  "Crafting your summary...",
  "Almost there...",
];

/**
 * ThinkingIndicator component
 * Shows an animated "AI is thinking" indicator with rotating messages
 */
export function ThinkingIndicator({
  messages = defaultMessages,
  rotationInterval = 3000,
  className = '',
}: ThinkingIndicatorProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [messages.length, rotationInterval]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-1.5">
        <div
          className="w-2 h-2 bg-primary rounded-full animate-pulse"
          style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
        />
        <div
          className="w-2 h-2 bg-primary rounded-full animate-pulse"
          style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
        />
        <div
          className="w-2 h-2 bg-primary rounded-full animate-pulse"
          style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
        />
      </div>
      <p className="text-sm text-muted-foreground font-medium transition-all duration-300">
        {messages[currentMessageIndex]}
      </p>
    </div>
  );
}
