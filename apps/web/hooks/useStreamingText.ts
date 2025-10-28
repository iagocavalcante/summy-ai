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
  options: UseStreamingTextOptions = {}
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

    // Split text into words while preserving whitespace/newlines
    // Match words and whitespace separately to reconstruct exactly
    const tokens = fullText.match(/\S+|\s+/g) || [];
    const words = tokens.filter(token => /\S/.test(token)); // Only count non-whitespace as words

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Show words chunk by chunk
    const showNextChunk = () => {
      if (wordIndexRef.current < words.length) {
        const endIndex = Math.min(wordIndexRef.current + wordsPerChunk, words.length);

        // Reconstruct text up to endIndex, preserving all whitespace
        let chunk = '';
        let wordCount = 0;
        for (const token of tokens) {
          if (/\S/.test(token)) {
            wordCount++;
            if (wordCount > endIndex) break;
          }
          chunk += token;
        }

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
      const prevTokens = previousTextRef.current.match(/\S+|\s+/g) || [];
      wordIndexRef.current = prevTokens.filter(token => /\S/.test(token)).length;
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
