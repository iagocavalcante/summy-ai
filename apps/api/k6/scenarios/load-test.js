/**
 * Load Test
 * Purpose: Test normal expected load
 * VUs: 10
 * Duration: 2 minutes
 * Use: Baseline performance testing
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { config, getRandomText, randomSleep } from '../utils/config.js';

// Custom metrics
const createDuration = new Trend('http_req_duration_create');
const listDuration = new Trend('http_req_duration_list');
const analyticsDuration = new Trend('http_req_duration_analytics');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    ...config.thresholds,
    successful_requests: ['count>100'],  // At least 100 successful requests
    failed_requests: ['count<10'],       // Less than 10 failed requests
  },
};

export default function () {
  const baseUrl = config.baseUrl;

  // Scenario: Create and retrieve summarization
  const createPayload = JSON.stringify({
    text: getRandomText(),
    userId: `user_${__VU}_${__ITER}`,
  });

  const createRes = http.post(`${baseUrl}/summarization`, createPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'CreateSummarization' },
  });

  createDuration.add(createRes.timings.duration);

  const createSuccess = check(createRes, {
    'create status is 201': (r) => r.status === 201,
    'create has id': (r) => JSON.parse(r.body).id !== undefined,
    'create has status PENDING': (r) => JSON.parse(r.body).status === 'PENDING',
  });

  if (createSuccess) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
  }

  const requestId = createRes.status === 201 ? JSON.parse(createRes.body).id : null;

  sleep(randomSleep(1, 3));

  // Get specific request
  if (requestId) {
    const getRes = http.get(`${baseUrl}/summarization/${requestId}`, {
      tags: { name: 'GetSummarization' },
    });

    check(getRes, {
      'get status is 200': (r) => r.status === 200,
      'get has correct id': (r) => JSON.parse(r.body).id === requestId,
    });
  }

  sleep(randomSleep(0.5, 1.5));

  // List requests with filtering
  const statusFilter = ['PENDING', 'PROCESSING', 'COMPLETED'][Math.floor(Math.random() * 3)];
  const listRes = http.get(`${baseUrl}/summarization?limit=20&status=${statusFilter}`, {
    tags: { name: 'ListSummarizations' },
  });

  listDuration.add(listRes.timings.duration);

  check(listRes, {
    'list status is 200': (r) => r.status === 200,
    'list returns array': (r) => Array.isArray(JSON.parse(r.body)),
  });

  sleep(randomSleep(1, 2));

  // Get analytics (less frequent)
  if (Math.random() < 0.3) {  // 30% of iterations
    const analyticsRes = http.get(`${baseUrl}/analytics/summary`, {
      tags: { name: 'GetAnalyticsSummary' },
    });

    analyticsDuration.add(analyticsRes.timings.duration);

    check(analyticsRes, {
      'analytics status is 200': (r) => r.status === 200,
      'analytics has structure': (r) => {
        const body = JSON.parse(r.body);
        return body.allTime && body.today && body.recentRequests;
      },
    });
  }

  sleep(randomSleep(1, 3));
}

export function handleSummary(data) {
  return {
    'k6/results/load-test-summary.json': JSON.stringify(data, null, 2),
  };
}
