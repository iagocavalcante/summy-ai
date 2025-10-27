'use client';

import { useTypewriter } from '@/hooks/useTypewriter';

interface TypewriterTextProps {
  /**
   * Text to display with typewriter effect
   */
  text: string;
  /**
   * Speed in milliseconds per character
   * @default 30
   */
  speed?: number;
  /**
   * Delay before starting to type
   * @default 0
   */
  delay?: number;
  /**
   * Callback when typing is complete
   */
  onComplete?: () => void;
  /**
   * Custom className for styling
   */
  className?: string;
  /**
   * Show blinking cursor while typing
   * @default true
   */
  showCursor?: boolean;
}

/**
 * TypewriterText component
 * Displays text with a typewriter effect
 */
export function TypewriterText({
  text,
  speed = 30,
  delay = 0,
  onComplete,
  className = '',
  showCursor = true,
}: TypewriterTextProps) {
  const { displayedText, isTyping } = useTypewriter(text, {
    speed,
    delay,
    onComplete,
  });

  return (
    <span className={className}>
      {displayedText}
      {showCursor && isTyping && (
        <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-pulse" />
      )}
    </span>
  );
}
