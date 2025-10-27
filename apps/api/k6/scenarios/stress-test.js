/**
 * Stress Test
 * Purpose: Find the breaking point of the system
 * VUs: Gradually increase to 50+
 * Duration: 5 minutes
 * Use: Determine maximum capacity and failure modes
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { config, getRandomText, randomSleep } from '../utils/config.js';

// Custom metrics
const errorRate = new Rate('errors');
const successRate = new Rate('success');
const timeouts = new Counter('timeouts');

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10
    { duration: '1m', target: 20 },   // Ramp up to 20
    { duration: '1m', target: 30 },   // Ramp up to 30
    { duration: '1m', target: 50 },   // Ramp up to 50 (stress)
    { duration: '1m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],      // Allow up to 5% errors under stress
    http_req_duration: ['p(95)<5000'],   // 95% under 5s (relaxed for stress)
    errors: ['rate<0.1'],                // Error rate should stay under 10%
  },
};

export default function () {
  const baseUrl = config.baseUrl;

  // Create summarization request
  const createPayload = JSON.stringify({
    text: getRandomText(),
    userId: `stress_user_${__VU}`,
  });

  const createRes = http.post(`${baseUrl}/summarization`, createPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'CreateSummarization' },
    timeout: '10s',
  });

  const createSuccess = check(createRes, {
    'create not 5xx error': (r) => r.status < 500,
    'create not timeout': (r) => r.status !== 0,
  });

  if (createRes.status === 0) {
    timeouts.add(1);
  }

  errorRate.add(!createSuccess);
  successRate.add(createSuccess);

  sleep(randomSleep(0.5, 1.5));

  // List requests
  const listRes = http.get(`${baseUrl}/summarization?limit=10`, {
    tags: { name: 'ListSummarizations' },
    timeout: '5s',
  });

  check(listRes, {
    'list not 5xx error': (r) => r.status < 500,
    'list not timeout': (r) => r.status !== 0,
  });

  if (listRes.status === 0) {
    timeouts.add(1);
  }

  sleep(randomSleep(0.5, 1));

  // Analytics (occasional)
  if (Math.random() < 0.2) {
    const analyticsRes = http.get(`${baseUrl}/analytics/summary`, {
      tags: { name: 'GetAnalyticsSummary' },
      timeout: '5s',
    });

    check(analyticsRes, {
      'analytics not 5xx error': (r) => r.status < 500,
    });
  }

  sleep(randomSleep(0.5, 2));
}

export function handleSummary(data) {
  return {
    'k6/results/stress-test-summary.json': JSON.stringify(data, null, 2),
  };
}
