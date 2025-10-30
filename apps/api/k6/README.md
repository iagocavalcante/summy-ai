# k6 Load Testing for Summ AI API

## Overview

This directory contains comprehensive k6 load testing scenarios for the Summ AI API. These tests help you understand system performance, identify bottlenecks, and ensure reliability under various load conditions.

## Test Scenarios

### 1. Smoke Test (`smoke-test.js`)
**Purpose:** Quick sanity check to verify the system works under minimal load

- **Duration:** 30 seconds
- **Virtual Users:** 1-2
- **Use Case:** Run before deploying or after changes
- **Thresholds:**
  - Error rate < 1%
  - P95 response time < 2s
  - Create requests < 500ms
  - List requests < 200ms

**When to run:**
- Before running larger tests
- After code changes
- As part of CI/CD pipeline
- Quick health check

### 2. Load Test (`load-test.js`)
**Purpose:** Test system under normal expected load

- **Duration:** 2 minutes
- **Virtual Users:** Ramps from 5 to 10
- **Use Case:** Baseline performance testing
- **Thresholds:**
  - Error rate < 1%
  - P95 response time < 2s
  - Minimum 100 successful requests

**When to run:**
- Regular performance testing
- After optimization changes
- Baseline metrics collection
- Pre-production validation

### 3. Stress Test (`stress-test.js`)
**Purpose:** Find the breaking point of the system

- **Duration:** 5 minutes
- **Virtual Users:** Gradually increases to 50+
- **Use Case:** Determine maximum capacity
- **Thresholds:**
  - Error rate < 5% (relaxed)
  - P95 response time < 5s
  - Identify failure modes

**When to run:**
- Capacity planning
- Before scaling decisions
- Identifying bottlenecks
- Infrastructure validation

### 4. Spike Test (`spike-test.js`)
**Purpose:** Test system behavior under sudden traffic spikes

- **Duration:** 3 minutes
- **Virtual Users:** Sudden jump from 5 to 100
- **Use Case:** Test auto-scaling and recovery
- **Thresholds:**
  - Error rate < 10% during spike
  - P90 response time < 10s
  - System recovers after spike

**When to run:**
- Testing auto-scaling
- Validating rate limiting
- Ensuring graceful degradation
- Before expected traffic events

## Installation

### Install k6

**macOS:**
```bash
brew install k6
```

**Linux (Debian/Ubuntu):**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows (Chocolatey):**
```bash
choco install k6
```

**Docker:**
```bash
docker pull grafana/k6
```

**Verify installation:**
```bash
k6 version
```

## Usage

### 1. Start the API Server

```bash
# From apps/api directory
pnpm dev

# API should be running on http://localhost:3000
```

### 2. Run Tests Using the Test Runner

```bash
# Navigate to api directory
cd apps/api

# Run smoke test (recommended first)
./k6/run-tests.sh smoke

# Run load test
./k6/run-tests.sh load

# Run stress test
./k6/run-tests.sh stress

# Run spike test
./k6/run-tests.sh spike

# Run all tests
./k6/run-tests.sh all
```

### 3. Run Tests Manually

```bash
# Smoke test
k6 run -e API_URL=http://localhost:3000 k6/scenarios/smoke-test.js

# Load test with custom output
k6 run --out json=k6/results/custom-load.json k6/scenarios/load-test.js

# Stress test
k6 run k6/scenarios/stress-test.js

# Spike test
k6 run k6/scenarios/spike-test.js
```

### 4. Custom Configuration

You can override the API URL:

```bash
API_URL=http://api.production.com ./k6/run-tests.sh load
```

Or set it as an environment variable:

```bash
export API_URL=http://staging-api.example.com
./k6/run-tests.sh smoke
```

## Understanding Results

### Key Metrics

#### Response Time Metrics
- **http_req_duration:** Time from start of request to end
- **http_req_waiting:** Time waiting for response
- **http_req_connecting:** Time spent establishing connection
- **http_req_sending:** Time sending request
- **http_req_receiving:** Time receiving response

#### Success Metrics
- **http_req_failed:** Percentage of failed requests
- **successful_requests:** Total successful requests
- **failed_requests:** Total failed requests
- **errors:** Error rate

#### Percentiles
- **P50 (median):** 50% of requests faster than this
- **P90:** 90% of requests faster than this
- **P95:** 95% of requests faster than this
- **P99:** 99% of requests faster than this

### Example Output

```
✓ create status is 201
✓ create has id
✓ list returns array
✓ analytics status is 200

checks.........................: 100.00% ✓ 400   ✗ 0
data_received..................: 156 kB  5.2 kB/s
data_sent......................: 98 kB   3.3 kB/s
http_req_blocked...............: avg=123µs  min=2µs   med=4µs   max=12ms   p(90)=7µs   p(95)=8µs
http_req_connecting............: avg=89µs   min=0s    med=0s    max=10ms   p(90)=0s    p(95)=0s
http_req_duration..............: avg=145ms  min=23ms  med=132ms max=523ms  p(90)=234ms p(95)=298ms
http_req_failed................: 0.00%   ✓ 0     ✗ 400
http_req_receiving.............: avg=89µs   min=15µs  med=45µs  max=2ms    p(90)=156µs p(95)=234µs
http_req_sending...............: avg=34µs   min=8µs   med=23µs  max=456µs  p(90)=45µs  p(95)=67µs
http_req_waiting...............: avg=145ms  min=23ms  med=131ms max=521ms  p(90)=233ms p(95)=297ms
http_reqs......................: 400     13.33/s
iterations.....................: 100     3.33/s
vus............................: 1       min=1   max=10
vus_max........................: 10      min=10  max=10
```

### Interpreting Results

#### ✅ Good Performance
- Error rate < 1%
- P95 response time < 2s
- No timeouts
- Consistent response times

#### ⚠️ Warning Signs
- Error rate 1-5%
- P95 response time 2-5s
- Increasing response times under load
- Occasional timeouts

#### ❌ Performance Issues
- Error rate > 5%
- P95 response time > 5s
- Frequent timeouts
- System unresponsive

## Test Results

All test results are saved in `k6/results/` directory:

```
k6/results/
├── smoke-test.json
├── smoke-test-summary.json
├── load-test.json
├── load-test-summary.json
├── stress-test.json
├── stress-test-summary.json
├── spike-test.json
└── spike-test-summary.json
```

## Performance Optimization Tips

### Based on Test Results

**High Response Times (> 2s)**
1. Check database query performance
2. Add database indexes
3. Implement caching (Redis)
4. Optimize N+1 queries

**High Error Rates**
1. Check application logs
2. Verify database connections
3. Check Redis availability
4. Review timeout configurations

**Memory Issues**
1. Monitor Node.js heap usage
2. Check for memory leaks
3. Optimize data structures
4. Implement pagination

**CPU Bottlenecks**
1. Profile CPU usage
2. Optimize heavy computations
3. Use worker threads for CPU-intensive tasks
4. Implement request queuing

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Performance Tests

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
        ports:
          - 5432:5432

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          npm install -g pnpm
          pnpm install

      - name: Start API
        run: |
          cd apps/api
          pnpm dev &
          sleep 10

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run smoke test
        run: |
          cd apps/api
          ./k6/run-tests.sh smoke

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: k6-results
          path: apps/api/k6/results/
```

## Advanced Usage

### Custom Thresholds

```javascript
export const options = {
  thresholds: {
    'http_req_duration': ['p(95)<500'],  // 95% under 500ms
    'http_req_duration{name:CreateSummarization}': ['p(95)<300'],
    'http_req_failed': ['rate<0.01'],    // Less than 1% errors
    'checks': ['rate>0.95'],             // 95% of checks pass
  },
};
```

### Multiple Scenarios

```javascript
export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
    },
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 },
      ],
    },
  },
};
```

### Environment Variables

```javascript
import { config } from './utils/config.js';

const API_URL = __ENV.API_URL || config.baseUrl;
const API_KEY = __ENV.API_KEY || '';
```

## Troubleshooting

### k6 Not Found
```bash
# Install k6 using your package manager
brew install k6  # macOS
```

### API Not Reachable
```bash
# Check if API is running
curl http://localhost:3000

# Start the API
cd apps/api && pnpm dev
```

### High Error Rates
1. Check API logs for errors
2. Verify database is running
3. Ensure Redis is available
4. Check system resources (CPU, memory)

### Timeout Errors
1. Increase timeout in test scripts
2. Optimize database queries
3. Add connection pooling
4. Scale infrastructure

## Best Practices

1. **Start Small:** Always run smoke test first
2. **Baseline First:** Establish baseline with load test
3. **Gradual Increase:** Gradually increase load in stress tests
4. **Monitor System:** Watch CPU, memory, database during tests
5. **Test in Staging:** Run performance tests in staging environment first
6. **Regular Testing:** Include in CI/CD pipeline
7. **Document Results:** Keep track of performance metrics over time
8. **Fix Issues:** Address performance issues before they reach production

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://github.com/grafana/k6-example-data-generation)
- [Load Testing Best Practices](https://k6.io/docs/testing-guides/load-testing-websites/)
- [k6 Cloud](https://k6.io/cloud/) - For more advanced features

---

**Last Updated:** October 2025
**k6 Version:** Latest
**Test Suite Version:** 1.0.0
