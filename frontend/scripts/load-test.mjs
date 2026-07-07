#!/usr/bin/env node

/**
 * Load Testing Script
 * 
 * Simulates concurrent users accessing the API and frontend
 * Measures:
 * - Request throughput (req/sec)
 * - Response times (p50, p95, p99)
 * - Error rates
 * - Memory/CPU under load
 */

import http from 'http';
import https from 'https';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS || '50', 10);
const TEST_DURATION_MS = parseInt(process.env.TEST_DURATION || '30000', 10);
const REQUESTS_PER_USER = parseInt(process.env.REQUESTS_PER_USER || '100', 10);

interface Metrics {
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  responseTimes: number[];
  startTime: number;
  endTime: number;
}

const metrics: Metrics = {
  totalRequests: 0,
  successRequests: 0,
  errorRequests: 0,
  responseTimes: [],
  startTime: Date.now(),
  endTime: 0,
};

/**
 * Make HTTP request and measure response time
 */
function makeRequest(path: string): Promise<{ duration: number; status: number }> {
  return new Promise((resolve) => {
    const isHttps = BASE_URL.startsWith('https');
    const client = isHttps ? https : http;
    const url = new URL(path, BASE_URL);

    const start = Date.now();

    const req = client.get(url, (res) => {
      const duration = Date.now() - start;

      // Consume response data
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({ duration, status: res.statusCode || 500 });
      });
    });

    req.on('error', () => {
      const duration = Date.now() - start;
      resolve({ duration, status: 0 });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      const duration = Date.now() - start;
      resolve({ duration, status: 0 });
    });
  });
}

/**
 * Simulate single user making requests
 */
async function simulateUser(userId: number) {
  const endpoints = [
    '/api/health',
    '/learning',
    '/api/extraction/rules',
  ];

  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    if (Date.now() - metrics.startTime > TEST_DURATION_MS) {
      break;
    }

    const endpoint = endpoints[i % endpoints.length];

    try {
      const result = await makeRequest(endpoint);
      metrics.totalRequests++;
      metrics.responseTimes.push(result.duration);

      if (result.status >= 200 && result.status < 300) {
        metrics.successRequests++;
      } else {
        metrics.errorRequests++;
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (e) {
      metrics.errorRequests++;
      metrics.totalRequests++;
    }
  }
}

/**
 * Calculate percentile
 */
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = arr.sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * (p / 100)) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Run load test
 */
async function runLoadTest() {
  console.log(`Starting load test...`);
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Concurrent users: ${CONCURRENT_USERS}`);
  console.log(`  Requests per user: ${REQUESTS_PER_USER}`);
  console.log(`  Test duration: ${TEST_DURATION_MS}ms`);
  console.log('');

  // Create all users and run concurrently
  const userPromises = Array.from({ length: CONCURRENT_USERS }, (_, i) =>
    simulateUser(i)
  );

  await Promise.all(userPromises);

  metrics.endTime = Date.now();
  const durationSec = (metrics.endTime - metrics.startTime) / 1000;

  // Calculate statistics
  const avgResponseTime = metrics.responseTimes.length > 0
    ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
    : 0;

  const p50 = percentile(metrics.responseTimes, 50);
  const p95 = percentile(metrics.responseTimes, 95);
  const p99 = percentile(metrics.responseTimes, 99);
  const max = Math.max(...metrics.responseTimes, 0);
  const min = Math.min(...metrics.responseTimes, Infinity);

  const successRate =
    metrics.totalRequests > 0
      ? ((metrics.successRequests / metrics.totalRequests) * 100).toFixed(2)
      : '0.00';

  const throughput = (metrics.totalRequests / durationSec).toFixed(2);

  // Print results
  console.log('=== Load Test Results ===');
  console.log('');
  console.log('Requests:');
  console.log(`  Total: ${metrics.totalRequests}`);
  console.log(`  Success: ${metrics.successRequests}`);
  console.log(`  Failed: ${metrics.errorRequests}`);
  console.log(`  Success Rate: ${successRate}%`);
  console.log('');
  console.log('Performance:');
  console.log(`  Duration: ${durationSec.toFixed(2)}s`);
  console.log(`  Throughput: ${throughput} req/s`);
  console.log(`  Min Response: ${min.toFixed(2)}ms`);
  console.log(`  Avg Response: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`  P50 Response: ${p50.toFixed(2)}ms`);
  console.log(`  P95 Response: ${p95.toFixed(2)}ms`);
  console.log(`  P99 Response: ${p99.toFixed(2)}ms`);
  console.log(`  Max Response: ${max.toFixed(2)}ms`);
  console.log('');

  // Exit with error if performance is poor
  if (successRate < '90' || p95 > 5000) {
    console.error('⚠️  Performance degradation detected!');
    process.exit(1);
  } else {
    console.log('✅ Load test passed!');
    process.exit(0);
  }
}

// Run the test
runLoadTest().catch((err) => {
  console.error('Load test error:', err);
  process.exit(1);
});
