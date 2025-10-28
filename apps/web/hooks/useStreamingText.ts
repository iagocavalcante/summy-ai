'use client';

import { useState, useEffect, useRef } from 'react';

interface UseStreamingTextOptions {
  /**

   * Delay between word chunks in milliseconds

   * @default 50

   */

  chunkDelay?: number;

  /**

   * Number of words to display per chunk

   * @default 3

   */

  wordsPerChunk?: number;

  /**

   * Whether to respect reduced motion preferences

   * @default true

   */

  respectReducedMotion?: boolean;
}

/**

 * Custom hook for streaming text with natural word-by-word appearance

 * Ideal for displaying AI-generated content that arrives in chunks

 */

export function useStreamingText(
  fullText: string,

  options: UseStreamingTextOptions = {},
) {
  const {
    chunkDelay = 50,

    wordsPerChunk = 3,

    respectReducedMotion = true,
  } = options;

  const [displayedText, setDisplayedText] = useState('');

  const [isStreaming, setIsStreaming] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const wordIndexRef = useRef(0);

  const previousTextRef = useRef('');

  useEffect(() => {
    // Check for reduced motion preference

    if (respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayedText(fullText);

      setIsStreaming(false);

      return;
    }

    // Only process new text additions

    if (fullText === previousTextRef.current) {
      return;
    }

    // If text got shorter (reset), start over

    if (fullText.length < previousTextRef.current.length) {
      setDisplayedText('');

      wordIndexRef.current = 0;

      previousTextRef.current = '';
    }

    setIsStreaming(true);

    // Split text into words

    const words = fullText.split(' ');

    // Clear any existing timeout

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Show words chunk by chunk

    const showNextChunk = () => {
      if (wordIndexRef.current < words.length) {
        const endIndex = Math.min(wordIndexRef.current + wordsPerChunk, words.length);

        const chunk = words.slice(0, endIndex).join(' ');

        setDisplayedText(chunk);

        wordIndexRef.current = endIndex;

        timeoutRef.current = setTimeout(showNextChunk, chunkDelay);
      } else {
        setIsStreaming(false);

        previousTextRef.current = fullText;
      }
    };

    // Start from current position if text is growing

    if (fullText.startsWith(previousTextRef.current)) {
      wordIndexRef.current = previousTextRef.current.split(' ').filter((w) => w).length;
    }

    showNextChunk();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fullText, chunkDelay, wordsPerChunk, respectReducedMotion]);

  return {
    displayedText,

    isStreaming,
  };
}
