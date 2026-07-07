#!/usr/bin/env node
/**
 * Phase 14c Testing Suite - Learning & Feedback
 * Tests all new feedback and learning endpoints
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api/extract';

async function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
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
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function success(msg) {
  console.log(`${colors.green}✓${colors.cyan} ${msg}\x1b[0m`);
}

function error(msg) {
  console.log(`${colors.red}✗${colors.cyan} ${msg}\x1b[0m`);
}

async function runTests() {
  console.log(`\n${colors.cyan}========================================`);
  console.log(`  PHASE 14c - LEARNING & FEEDBACK TEST SUITE`);
  console.log(`========================================\x1b[0m\n`);

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: POST /extraction/:resultId/feedback
    console.log(`${colors.cyan}[TEST 1] POST /extraction/result-001/feedback${colors.cyan} - Record User Feedback`);
    try {
      const res = await request('POST', '/extraction/result-001/feedback', {
        docType: 'invoice',
        fieldFeedback: [
          {
            field: 'invoiceNumber',
            originalValue: 'INV-202406',
            correctedValue: 'INV-202406-0142',
            issue: 'WRONG_VALUE',
            severity: 'high',
            notes: 'Pattern captured too little',
          },
          {
            field: 'invoiceDate',
            originalValue: undefined,
            correctedValue: '07.06.2024',
            issue: 'MISSING',
            severity: 'critical',
            notes: 'Date not extracted',
          },
        ],
        userEmail: 'user@example.com',
      });

      if (res.status === 201 && res.body?.success) {
        success(`Status: ${res.status} | Feedback recorded: ${res.body.data.feedbackRecorded}`);
        passed++;
      } else {
        error(`Status: ${res.status} | Expected: 201`);
        failed++;
      }
    } catch (err) {
      error(`Request failed: ${err.message}`);
      failed++;
    }

    console.log();

    // Test 2: GET /extraction/:resultId/suggestions
    console.log(`${colors.cyan}[TEST 2] GET /extraction/result-001/suggestions${colors.cyan} - Get Pattern Suggestions`);
    try {
      const res = await request('GET', '/extraction/result-001/suggestions?docType=invoice');

      if (res.status === 200 && res.body?.success) {
        success(
          `Status: ${res.status} | Suggestions: ${res.body.data.suggestionsCount}`
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

    // Test 3: POST /rules/:docType/improve
    console.log(`${colors.cyan}[TEST 3] POST /rules/invoice/improve${colors.cyan} - Apply Feedback Improvements`);
    try {
      const res = await request('POST', '/rules/invoice/improve', {
        suggestions: [
          {
            field: 'invoiceNumber',
            suggestedPattern: '(INV-[0-9]{6}(-[0-9]{4})?)',
            estimatedImprovement: 0.12,
            confidence: 0.88,
          },
          {
            field: 'invoiceDate',
            suggestedPattern: '\\d{2}\\.\\d{2}\\.\\d{4}',
            estimatedImprovement: 0.18,
            confidence: 0.95,
          },
        ],
        applyAll: true,
      });

      if (res.status === 200 && res.body?.success) {
        success(
          `Status: ${res.status} | Version: ${res.body.data.version} | Applied: ${res.body.data.suggestionsApplied}`
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
    console.log(colors.cyan + '========================================');
    console.log(`${colors.green}Passed: ${passed}\x1b[0m`);
    console.log(`${colors.red}Failed: ${failed}\x1b[0m`);
    console.log(colors.cyan + '========================================\x1b[0m\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    error(`Test suite error: ${err.message}`);
    process.exit(1);
  }
}

runTests();
