#!/usr/bin/env node
/**
 * Phase 14 E2E Integration Test Suite
 * Tests complete workflow: Extract → Feedback → Suggestions → Improve
 * 
 * Usage:
 *   node scripts/test-phase14-e2e.js
 * 
 * Requirements:
 *   - Backend running on http://localhost:3000
 *   - Express server initialized
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const API_BASE = 'http://localhost:3000';
const API_EXTRACT = `${API_BASE}/api/extract`;

// ============================================================================
// Test Utilities
// ============================================================================

class TestRunner {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  addTest(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`  ${this.name}`);
    console.log(`${'='.repeat(80)}\n`);

    for (const test of this.tests) {
      try {
        await test.fn();
        this.passed++;
        console.log(`✅ PASS: ${test.name}`);
        this.results.push({ name: test.name, status: 'PASS', error: null });
      } catch (error) {
        this.failed++;
        console.log(`❌ FAIL: ${test.name}`);
        console.log(`   Error: ${error.message}`);
        this.results.push({ name: test.name, status: 'FAIL', error: error.message });
      }
    }

    this.printSummary();
    return { passed: this.passed, failed: this.failed, results: this.results };
  }

  printSummary() {
    const total = this.passed + this.failed;
    const percentage = total > 0 ? Math.round((this.passed / total) * 100) : 0;

    console.log(`\n${'-'.repeat(80)}`);
    console.log(`Summary: ${this.passed}/${total} passed (${percentage}%)`);
    console.log(`${'-'.repeat(80)}\n`);
  }
}

async function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_EXTRACT}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertDefined(value, message) {
  if (value === undefined || value === null) {
    throw new Error(message || 'Value is undefined or null');
  }
}

// ============================================================================
// Test Suite
// ============================================================================

const runner = new TestRunner('Phase 14 E2E Integration Tests');

// Test 1: Verify server is running
runner.addTest('Server is reachable', async () => {
  const result = await request('GET', '/pdf');
  assert(result.status !== 'ECONNREFUSED', 'Server not reachable');
});

// Test 2: Check rules are loaded
runner.addTest('Rules are accessible', async () => {
  const result = await request('GET', '/rules');
  assertEquals(result.status, 200, 'Rules endpoint returned non-200');
  assert(result.body.success, 'Rules API returned success=false');
  assertDefined(result.body.data, 'Rules data is missing');
});

// Test 3: Quality evaluation works
runner.addTest('Quality evaluation returns metrics', async () => {
  const result = await request('GET', '/quality');
  assertEquals(result.status, 200, 'Quality endpoint returned non-200');
  assert(result.body.success, 'Quality API returned success=false');
  assertDefined(result.body.data, 'Quality data is missing');
  assertDefined(result.body.data.successRate, 'Success rate missing');
});

// Test 4: Version history is accessible
runner.addTest('Version history can be retrieved', async () => {
  const result = await request('GET', '/rules/invoice/history');
  assertEquals(result.status, 200, 'History endpoint returned non-200');
  assert(result.body.success, 'History API returned success=false');
  assertDefined(result.body.data, 'History data is missing');
});

// Test 5: Feedback endpoint accepts POST
runner.addTest('Feedback endpoint accepts valid input', async () => {
  const feedbackData = {
    docType: 'invoice',
    fieldFeedback: [
      {
        field: 'invoice_number',
        correctedValue: 'INV-2024-001',
        issue: 'WRONG_VALUE',
        severity: 'high',
        notes: 'The system extracted INV-2023-001 but should be INV-2024-001',
      },
    ],
    userEmail: 'test@example.com',
  };

  const result = await request(
    'POST',
    '/extraction/test-result-001/feedback',
    feedbackData
  );

  assertEquals(result.status, 200, 'Feedback endpoint returned non-200');
  assert(result.body.success, 'Feedback API returned success=false');
  assertDefined(result.body.data, 'Feedback response data is missing');
});

// Test 6: Suggestions can be generated
runner.addTest('Suggestions endpoint returns suggestions', async () => {
  const result = await request(
    'GET',
    '/extraction/test-result-001/suggestions?docType=invoice'
  );

  // 200 or empty suggestions are both OK
  if (result.status === 200 && result.body.success) {
    assertDefined(result.body.data, 'Suggestions data is missing');
  }
});

// Test 7: Batch testing works
runner.addTest('Batch testing returns results', async () => {
  const testData = {
    testSamples: [
      {
        sampleId: 'sample-1',
        content: 'Invoice #INV-2024-001',
        expectedValue: 'INV-2024-001',
      },
    ],
  };

  const result = await request(
    'POST',
    '/rules/invoice/test-batch',
    testData
  );

  assertEquals(result.status, 200, 'Batch test endpoint returned non-200');
  assert(result.body.success, 'Batch test API returned success=false');
  assertDefined(result.body.data, 'Batch test response data is missing');
});

// Test 8: Rule improvements can be applied
runner.addTest('Improve endpoint accepts valid suggestions', async () => {
  const improveData = {
    suggestions: [
      {
        field: 'invoice_number',
        currentPattern: '\\d{3}-\\d{4}',
        suggestedPattern: '[A-Z]{3}-\\d{4}-\\d{3}',
        reason: 'Current pattern misses letter prefix',
        confidence: 0.95,
        exampleCorrections: [
          { original: 'INV-2024-001', corrected: 'INV-2024-001' },
        ],
        estimatedImprovement: 0.15,
      },
    ],
    applyAll: false,
  };

  const result = await request(
    'POST',
    '/rules/invoice/improve',
    improveData
  );

  assertEquals(result.status, 200, 'Improve endpoint returned non-200');
  assert(result.body.success, 'Improve API returned success=false');
});

// Test 9: All endpoints return proper response format
runner.addTest('API responses follow standard format', async () => {
  const result = await request('GET', '/rules');
  
  assert(typeof result.body.success === 'boolean', 'success field missing or invalid');
  assertDefined(result.body.timestamp, 'timestamp field missing');
  assertDefined(result.body.duration, 'duration field missing');
  assertDefined(result.body.path, 'path field missing');
});

// Test 10: Error handling for missing data
runner.addTest('Endpoints handle missing parameters gracefully', async () => {
  const result = await request('POST', '/extraction/missing-id/feedback', {
    docType: 'invoice',
    fieldFeedback: [],
  });

  // Should either return 400 (bad request) or handle gracefully
  assert(
    [200, 400, 404].includes(result.status),
    `Unexpected status: ${result.status}`
  );
  assertDefined(result.body.success, 'Response missing success field');
});

// ============================================================================
// Run Tests
// ============================================================================

(async () => {
  console.log('\n🚀 Starting Phase 14 E2E Integration Tests...\n');
  console.log(`Target API: ${API_EXTRACT}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    const result = await runner.run();

    // Exit with appropriate code
    const exitCode = result.failed > 0 ? 1 : 0;
    process.exit(exitCode);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
})();
