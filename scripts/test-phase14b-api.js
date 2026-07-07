#!/usr/bin/env node
/**
 * Phase 14b Testing Suite
 * Tests all new rule management endpoints
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api/extract';

// Helper function to make requests
async function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: body ? JSON.parse(body) : null,
          });
        } catch {
          resolve({
            status: res.statusCode,
            body: null,
            raw: body,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function success(msg) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function error(msg) {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

function info(msg) {
  console.log(`${colors.cyan}${msg}${colors.reset}`);
}

// Main test suite
async function runTests() {
  console.log('\n' + colors.cyan + '========================================' + colors.reset);
  console.log(colors.cyan + '  PHASE 14b - RULE MANAGEMENT TEST SUITE' + colors.reset);
  console.log(colors.cyan + '========================================' + colors.reset + '\n');

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: PUT /rules/:docType
    info('[TEST 1] PUT /api/extract/rules/invoice - Update rules');
    try {
      const res = await request('PUT', '/rules/invoice', {
        rules: [
          {
            field: 'invoiceNumber',
            pattern: '(INV-[0-9]{6}|REV-[0-9]{6})',
            confidence: 0.95,
            required: true,
          },
          { field: 'invoiceDate', pattern: '\\d{2}\\.\\d{2}\\.\\d{4}', confidence: 0.9, required: true },
        ],
        changeReason: 'Added support for REV format invoice numbers',
        description: 'Updated invoice extraction patterns',
      });

      if (res.status === 200 && res.body?.success) {
        success(`Status: ${res.status} | Version: ${res.body.data.version} | Rules updated: ${res.body.data.rulesUpdated}`);
        passed++;
      } else {
        error(`Status: ${res.status} | Expected: 200`);
        failed++;
      }
    } catch (err) {
      error(`Request failed: ${err.message}`);
      failed++;
    }

    console.log();

    // Test 2: GET /rules/:docType/history
    info('[TEST 2] GET /api/extract/rules/invoice/history - Get version history');
    try {
      const res = await request('GET', '/rules/invoice/history');

      if (res.status === 200 && res.body?.success) {
        success(
          `Status: ${res.status} | Versions: ${res.body.data.totalVersions} | Current: ${res.body.data.currentVersion}`
        );
        passed++;
      } else {
        error(`Status: ${res.status} | Expected: 200`);
        failed++;
      }
    } catch (err) {
      error(`Request failed: ${err.message}`);
      failed++;
    }

    console.log();

    // Test 3: POST /rules/:docType/test-batch
    info('[TEST 3] POST /api/extract/rules/invoice/test-batch - Test on samples');
    try {
      const res = await request('POST', '/rules/invoice/test-batch', {
        testRules: [
          {
            field: 'invoiceNumber',
            pattern: '(INV-[0-9]{6}|REV-[0-9]{6})',
            confidence: 0.95,
            required: true,
          },
        ],
        sampleCount: 5,
      });

      if (res.status === 200 && res.body?.success) {
        const data = res.body.data;
        success(
          `Status: ${res.status} | Batch ID: ${data.batchTestId.substring(0, 20)}... | Samples: ${data.samplesProcessed}`
        );
        console.log(
          `  → Success rate (new): ${(data.improvement.newSuccessRate * 100).toFixed(0)}% | Ready: ${data.improvement.isReady}`
        );
        passed++;
      } else {
        error(`Status: ${res.status} | Expected: 200`);
        failed++;
      }
    } catch (err) {
      error(`Request failed: ${err.message}`);
      failed++;
    }

    console.log();

    // Test 4: POST /rules/:docType/publish
    info('[TEST 4] POST /api/extract/rules/invoice/publish - Publish version');
    try {
      // Get current version first
      const historyRes = await request('GET', '/rules/invoice/history');
      const currentVersion = historyRes.body?.data?.currentVersion || '1.0.6';

      const res = await request('POST', '/rules/invoice/publish', {
        version: currentVersion,
        publishNotes: 'Released with improved pattern matching',
      });

      if (res.status === 200 && res.body?.success) {
        success(
          `Status: ${res.status} | Published: ${res.body.data.publishedVersion} | Status: ${res.body.data.status}`
        );
        passed++;
      } else {
        error(`Status: ${res.status} | Expected: 200`);
        failed++;
      }
    } catch (err) {
      error(`Request failed: ${err.message}`);
      failed++;
    }

    console.log();

    // Summary
    console.log(colors.cyan + '========================================' + colors.reset);
    console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(colors.cyan + '========================================' + colors.reset + '\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    error(`Test suite error: ${err.message}`);
    process.exit(1);
  }
}

runTests();
