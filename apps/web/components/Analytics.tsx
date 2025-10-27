'use client';

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { getAnalytics } from '@/lib/api';

export interface AnalyticsRef {
  refreshAnalytics: () => void;
}

const Analytics = forwardRef<AnalyticsRef>((props, ref) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Expose refreshAnalytics method to parent component
  useImperativeHandle(ref, () => ({
    refreshAnalytics: fetchAnalytics,
  }));

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { allTime, today } = analytics;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-card border border-border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-base">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Today</h3>
          <div className="space-y-3">
            <MetricRow
              label="Total Requests"
              value={today.totalRequests}
            />
            <MetricRow
              label="Successful"
              value={today.successfulRequests}
              color="text-success-600"
            />
            <MetricRow
              label="Failed"
              value={today.failedRequests}
              color="text-error-600"
            />
            <MetricRow
              label="Tokens Used"
              value={today.totalTokensUsed.toLocaleString()}
            />
            <MetricRow
              label="Total Cost"
              value={`$${today.totalCost.toFixed(4)}`}
            />
            <MetricRow
              label="Avg Duration"
              value={`${(today.avgDuration || 0).toFixed(0)}ms`}
            />
          </div>
        </div>

        <div className="p-6 bg-card border border-border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-base">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">All Time</h3>
          <div className="space-y-3">
            <MetricRow
              label="Total Requests"
              value={allTime.totalRequests}
            />
            <MetricRow
              label="Successful"
              value={allTime.successfulRequests}
              color="text-success-600"
            />
            <MetricRow
              label="Failed"
              value={allTime.failedRequests}
              color="text-error-600"
            />
            <MetricRow
              label="Tokens Used"
              value={allTime.totalTokensUsed.toLocaleString()}
            />
            <MetricRow
              label="Total Cost"
              value={`$${allTime.totalCost.toFixed(4)}`}
            />
          </div>
        </div>
      </div>

      <div className="p-6 bg-card border border-border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-base">
        <h3 className="text-lg font-semibold text-card-foreground mb-6">Provider Usage (All Time)</h3>
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">
              {allTime.geminiRequests}
            </div>
            <div className="text-sm text-muted-foreground font-medium">Gemini Requests</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-accent-600 mb-2">
              {allTime.openaiRequests}
            </div>
            <div className="text-sm text-muted-foreground font-medium">OpenAI Requests</div>
          </div>
        </div>
      </div>
    </div>
  );
});

Analytics.displayName = 'Analytics';

export default Analytics;

function MetricRow({
  label,
  value,
  color = 'text-card-foreground',
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}
