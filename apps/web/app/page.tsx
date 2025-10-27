'use client';

import { useRef } from 'react';
import SummarizationForm from '@/components/SummarizationForm';
import Analytics from '@/components/Analytics';

export default function Home() {
  const analyticsRef = useRef<{ refreshAnalytics: () => void }>(null);

  const handleSummaryComplete = () => {
    // Refresh analytics when summarization completes
    analyticsRef.current?.refreshAnalytics();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-50/30 to-accent-50/20">
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 bg-clip-text text-transparent">
            Summ AI
          </h1>
          <p className="text-xl text-foreground/90 mb-2 font-medium">
            AI-Powered Text Summarization
          </p>
          <p className="text-sm text-muted-foreground">
            Using Gemini and OpenAI with intelligent fallback
          </p>
        </div>

        <div className="space-y-12">
          <SummarizationForm onSummaryComplete={handleSummaryComplete} />
          <Analytics ref={analyticsRef} />
        </div>
      </main>

      <footer className="mt-16 py-8 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="font-medium">Powered by Next.js, NestJS, Redis, and BullMQ</p>
          <p className="mt-2">Features: Server-Side Streaming • LLM Adapter Pattern • Analytics Tracking</p>
        </div>
      </footer>
    </div>
  );
}
