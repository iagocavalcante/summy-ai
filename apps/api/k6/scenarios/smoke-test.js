/**
 * Smoke Test
 * Purpose: Verify the system works under minimal load
 * VUs: 1-2
 * Duration: 30 seconds
 * Use: Quick sanity check before running larger tests
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { config, getRandomText, randomSleep } from '../utils/config.js';

export const options = {
  stages: [
    { duration: '10s', target: 1 },  // Ramp up to 1 user
    { duration: '10s', target: 2 },  // Stay at 2 users
    { duration: '10s', target: 0 },  // Ramp down to 0
  ],
  thresholds: config.thresholds,
};

export default function () {
  const baseUrl = config.baseUrl;

  // Test 1: Create summarization request
  const createPayload = JSON.stringify({
    text: getRandomText(),
  });

  const createRes = http.post(`${baseUrl}/summarization`, createPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'CreateSummarization' },
  });

  check(createRes, {
    'create status is 201': (r) => r.status === 201,
    'create has id': (r) => JSON.parse(r.body).id !== undefined,
    'create response time < 500ms': (r) => r.timings.duration < 500,
  });

  const requestId = createRes.status === 201 ? JSON.parse(createRes.body).id : null;

  sleep(randomSleep(1, 2));

  // Test 2: Get specific summarization
  if (requestId) {
    const getRes = http.get(`${baseUrl}/summarization/${requestId}`, {
      tags: { name: 'GetSummarization' },
    });

    check(getRes, {
      'get status is 200': (r) => r.status === 200,
      'get has correct id': (r) => JSON.parse(r.body).id === requestId,
      'get response time < 200ms': (r) => r.timings.duration < 200,
    });
  }

  sleep(randomSleep(1, 2));

  // Test 3: List summarizations
  const listRes = http.get(`${baseUrl}/summarization?limit=10`, {
    tags: { name: 'ListSummarizations' },
  });

  check(listRes, {
    'list status is 200': (r) => r.status === 200,
    'list returns array': (r) => Array.isArray(JSON.parse(r.body)),
    'list response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(randomSleep(1, 2));

  // Test 4: Get analytics summary
  const analyticsRes = http.get(`${baseUrl}/analytics/summary`, {
    tags: { name: 'GetAnalyticsSummary' },
  });

  check(analyticsRes, {
    'analytics status is 200': (r) => r.status === 200,
    'analytics has allTime': (r) => JSON.parse(r.body).allTime !== undefined,
    'analytics response time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(randomSleep(1, 2));
}
