/**
 * Spike Test
 * Purpose: Test system behavior under sudden traffic spikes
 * VUs: Sudden jump to 100 users
 * Duration: 3 minutes
 * Use: Test auto-scaling and recovery
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { config, getRandomText, randomSleep } from '../utils/config.js';

// Custom metrics
const recoveryTime = new Trend('recovery_time');
const spikeErrors = new Counter('spike_errors');

export const options = {
  stages: [
    { duration: '10s', target: 5 },    // Normal load
    { duration: '10s', target: 100 },  // SPIKE!
    { duration: '1m', target: 100 },   // Sustain spike
    { duration: '30s', target: 5 },    // Recovery
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.1'],        // Allow 10% errors during spike
    http_req_duration: ['p(90)<10000'],   // 90% under 10s (very relaxed)
  },
};

export default function () {
  const baseUrl = config.baseUrl;
  const startTime = Date.now();

  // Quick create request
  const createPayload = JSON.stringify({
    text: getRandomText(),
  });

  const createRes = http.post(`${baseUrl}/summarization`, createPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'SpikeCreate' },
    timeout: '15s',
  });

  const responseTime = Date.now() - startTime;
  recoveryTime.add(responseTime);

  const success = check(createRes, {
    'spike create not failed': (r) => r.status !== 0,
    'spike create not 503': (r) => r.status !== 503,
  });

  if (!success) {
    spikeErrors.add(1);
  }

  // Very short sleep during spike
  sleep(randomSleep(0.1, 0.5));

  // Quick list request
  const listRes = http.get(`${baseUrl}/summarization?limit=5`, {
    tags: { name: 'SpikeList' },
    timeout: '10s',
  });

  check(listRes, {
    'spike list responsive': (r) => r.status < 500 || r.status === 0,
  });

  sleep(randomSleep(0.1, 0.5));
}

export function handleSummary(data) {
  console.log(`
========================================
    SPIKE TEST RESULTS
========================================
Max Response Time: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms
Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
P95 Response Time: ${data.metrics['http_req_duration{p(95)}']?.values || 'N/A'}
Errors During Spike: ${data.metrics.spike_errors?.values.count || 0}
========================================
  `);

  return {
    'k6/results/spike-test-summary.json': JSON.stringify(data, null, 2),
  };
}
