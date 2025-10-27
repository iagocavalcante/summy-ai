'use client';

import { useState, useEffect, useRef } from 'react';

interface UseTypewriterOptions {
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
   * Whether to respect reduced motion preferences
   * @default true
   */
  respectReducedMotion?: boolean;
}

/**
 * Custom hook for typewriter effect
 * Displays text character-by-character with natural timing
 */
export function useTypewriter(
  text: string,
  options: UseTypewriterOptions = {}
) {
  const {
    speed = 30,
    delay = 0,
    onComplete,
    respectReducedMotion = true,
  } = options;

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const indexRef = useRef(0);

  useEffect(() => {
    // Check for reduced motion preference
    if (respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayedText(text);
      setIsTyping(false);
      onComplete?.();
      return;
    }

    // Reset when text changes
    setDisplayedText('');
    indexRef.current = 0;
    setIsTyping(true);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't type empty text
    if (!text) {
      setIsTyping(false);
      return;
    }

    // Type character by character
    const typeNextChar = () => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1));
        indexRef.current += 1;

        // Add slight randomness to typing speed for more natural feel
        const variance = Math.random() * 10 - 5; // -5 to +5ms
        const nextDelay = Math.max(speed + variance, 10);

        timeoutRef.current = setTimeout(typeNextChar, nextDelay);
      } else {
        setIsTyping(false);
        onComplete?.();
      }
    };

    // Start typing after delay
    timeoutRef.current = setTimeout(typeNextChar, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, delay, onComplete, respectReducedMotion]);

  return {
    displayedText,
    isTyping,
  };
}
