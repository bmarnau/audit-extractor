#!/usr/bin/env node
/**
 * PHASE 14 - Extraction API Test Suite
 * 
 * Testet alle Extraction Endpoints:
 * - POST /api/extract/pdf
 * - POST /api/extract/html  
 * - GET /api/extract/rules
 * - POST /api/extract/validate
 * - GET /api/extract/quality
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const http = require('http');

const API_BASE = 'http://localhost:3000/api/extract';
const PROJECT_ROOT = path.join(__dirname, '..');
const SAMPLE_PDF = path.join(PROJECT_ROOT, 'source-documents/pdf/invoice.pdf');
const SAMPLE_HTML = path.join(PROJECT_ROOT, 'source-documents/html/invoice.html');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

/**
 * Helper: Make HTTP request
 */
async function request(method, pathname, data = null, isFormData = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + pathname);
    
    let options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': isFormData ? undefined : 'application/json',
      },
    };

    if (isFormData) {
      options.headers = {
        ...options.headers,
        ...data.getHeaders(),
      };
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null,
            raw: body,
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: null,
            raw: body,
          });
        }
      });
    });

    req.on('error', reject);

    if (isFormData) {
      data.pipe(req);
    } else if (data) {
      req.write(JSON.stringify(data));
      req.end();
    } else {
      req.end();
    }
  });
}

/**
 * Test: GET /api/extract/rules
 */
async function testGetRules() {
  console.log(`\n${colors.cyan}[TEST 1] GET /api/extract/rules${colors.reset}`);
  console.log('Goal: List available document types & rulesets\n');

  try {
    const res = await request('GET', '/rules');
    
    if (res.status !== 200) {
      console.log(`${colors.red}❌ FAILED${colors.reset} - Status: ${res.status}`);
      console.log(res.body);
      return false;
    }

    console.log(`${colors.green}✅ SUCCESS${colors.reset} - Status: 200`);
    console.log(`📋 Available Rulesets: ${res.body.data.rulesList.length}`);
    
    res.body.data.rulesList.forEach((rule) => {
      console.log(`  • ${rule.docType}: v${rule.version} (${rule.fieldCount} fields, ${rule.successRate} success rate)`);
    });

    return true;
  } catch (err) {
    console.log(`${colors.red}❌ ERROR${colors.reset} - ${err.message}`);
    return false;
  }
}

/**
 * Test: POST /api/extract/validate
 */
async function testValidatePattern() {
  console.log(`\n${colors.cyan}[TEST 2] POST /api/extract/validate${colors.reset}`);
  console.log('Goal: Test regex pattern matching\n');

  const testData = {
    pattern: '(INV-[0-9]{6})',
    sampleText: 'RECHNUNG INV-202406-0142 vom 06.07.2024',
  };

  try {
    const res = await request('POST', '/validate', testData);
    
    if (res.status !== 200) {
      console.log(`${colors.red}❌ FAILED${colors.reset} - Status: ${res.status}`);
      return false;
    }

    console.log(`${colors.green}✅ SUCCESS${colors.reset} - Status: 200`);
    console.log(`  Pattern: ${testData.pattern}`);
    console.log(`  Text: "${testData.sampleText}"`);
    console.log(`  Matched: ${res.body.data.matched}`);
    console.log(`  Value: "${res.body.data.value}"`);
    console.log(`  Confidence: ${res.body.data.confidence}`);

    return res.body.data.matched;
  } catch (err) {
    console.log(`${colors.red}❌ ERROR${colors.reset} - ${err.message}`);
    return false;
  }
}

/**
 * Test: POST /api/extract/pdf
 */
async function testExtractPdf() {
  console.log(`\n${colors.cyan}[TEST 3] POST /api/extract/pdf${colors.reset}`);
  console.log('Goal: Upload PDF and extract with rules\n');

  if (!fs.existsSync(SAMPLE_PDF)) {
    console.log(`${colors.yellow}⚠️  SKIPPED${colors.reset} - Sample PDF not found: ${SAMPLE_PDF}`);
    return null;
  }

  try {
    const form = new FormData();
    form.append('document', fs.createReadStream(SAMPLE_PDF));
    form.append('docType', 'invoice');

    const res = await request('POST', '/pdf', form, true);

    if (res.status !== 200) {
      console.log(`${colors.red}❌ FAILED${colors.reset} - Status: ${res.status}`);
      console.log(res.body);
      return false;
    }

    console.log(`${colors.green}✅ SUCCESS${colors.reset} - Status: 200`);
    console.log(`  File: ${SAMPLE_PDF}`);
    console.log(`  Result ID: ${res.body.data.resultId}`);
    console.log(`  Fields Extracted: ${res.body.data.extractedFields.length}`);
    console.log(`  Fields Missing: ${res.body.data.missingFields.length}`);
    
    res.body.data.extractedFields.forEach((field) => {
      console.log(`    • ${field.field}: "${field.value}" (confidence: ${field.confidence})`);
    });

    if (res.body.data.missingFields.length > 0) {
      console.log(`  Missing: ${res.body.data.missingFields.join(', ')}`);
    }

    // Save result for review
    const resultsDir = path.join(PROJECT_ROOT, 'results/json');
    if (fs.existsSync(resultsDir)) {
      const resultFile = path.join(resultsDir, `${res.body.data.resultId}.json`);
      console.log(`  Saved to: ${resultFile}`);
    }

    return true;
  } catch (err) {
    console.log(`${colors.red}❌ ERROR${colors.reset} - ${err.message}`);
    return false;
  }
}

/**
 * Test: POST /api/extract/html
 */
async function testExtractHtml() {
  console.log(`\n${colors.cyan}[TEST 4] POST /api/extract/html${colors.reset}`);
  console.log('Goal: Upload HTML and extract with rules\n');

  if (!fs.existsSync(SAMPLE_HTML)) {
    console.log(`${colors.yellow}⚠️  SKIPPED${colors.reset} - Sample HTML not found: ${SAMPLE_HTML}`);
    return null;
  }

  try {
    const form = new FormData();
    form.append('document', fs.createReadStream(SAMPLE_HTML));
    form.append('docType', 'invoice');

    const res = await request('POST', '/html', form, true);

    if (res.status !== 200) {
      console.log(`${colors.red}❌ FAILED${colors.reset} - Status: ${res.status}`);
      console.log(res.body);
      return false;
    }

    console.log(`${colors.green}✅ SUCCESS${colors.reset} - Status: 200`);
    console.log(`  File: ${SAMPLE_HTML}`);
    console.log(`  Result ID: ${res.body.data.resultId}`);
    console.log(`  Fields Extracted: ${res.body.data.extractedFields.length}`);
    console.log(`  Fields Missing: ${res.body.data.missingFields.length}`);
    
    res.body.data.extractedFields.forEach((field) => {
      console.log(`    • ${field.field}: "${field.value}" (confidence: ${field.confidence})`);
    });

    if (res.body.data.missingFields.length > 0) {
      console.log(`  Missing: ${res.body.data.missingFields.join(', ')}`);
    }

    return true;
  } catch (err) {
    console.log(`${colors.red}❌ ERROR${colors.reset} - ${err.message}`);
    return false;
  }
}

/**
 * Test: GET /api/extract/quality
 */
async function testQualityMetrics() {
  console.log(`\n${colors.cyan}[TEST 5] GET /api/extract/quality${colors.reset}`);
  console.log('Goal: Get extraction quality metrics\n');

  try {
    const res = await request('GET', '/quality');

    if (res.status !== 200) {
      console.log(`${colors.red}❌ FAILED${colors.reset} - Status: ${res.status}`);
      return false;
    }

    console.log(`${colors.green}✅ SUCCESS${colors.reset} - Status: 200`);
    console.log(`  Total Extractions: ${res.body.data.summary.totalExtractions}`);
    console.log(`  Successful: ${res.body.data.summary.successfulExtractions}`);
    console.log(`  Overall Success Rate: ${(res.body.data.summary.overallSuccessRate * 100).toFixed(1)}%`);

    if (Object.keys(res.body.data.byDocType).length > 0) {
      console.log(`  By Document Type:`);
      Object.entries(res.body.data.byDocType).forEach(([docType, stats]) => {
        console.log(`    • ${docType}: ${stats.count} extractions, ${(stats.avgSuccessRate * 100).toFixed(1)}% success`);
      });
    }

    return true;
  } catch (err) {
    console.log(`${colors.red}❌ ERROR${colors.reset} - ${err.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   PHASE 14 - EXTRACTION API TEST SUITE                     ║
║   Testing all endpoints...                                  ║
╚════════════════════════════════════════════════════════════╝
  `);

  const results = [];

  // Run tests
  results.push(await testGetRules());
  results.push(await testValidatePattern());
  results.push(await testExtractPdf());
  results.push(await testExtractHtml());
  results.push(await testQualityMetrics());

  // Summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`${colors.bright}TEST SUMMARY${colors.reset}`);
  console.log(`${'═'.repeat(60)}`);

  const passed = results.filter((r) => r === true).length;
  const failed = results.filter((r) => r === false).length;
  const skipped = results.filter((r) => r === null).length;

  console.log(`
  ${colors.green}✅ Passed:  ${passed}${colors.reset}
  ${colors.red}❌ Failed:  ${failed}${colors.reset}
  ${colors.yellow}⏭️  Skipped: ${skipped}${colors.reset}
  `);

  if (failed === 0 && passed > 0) {
    console.log(`${colors.green}${colors.bright}🎉 ALL TESTS PASSED!${colors.reset}\n`);
    return 0;
  } else if (failed > 0) {
    console.log(`${colors.red}${colors.bright}⚠️  SOME TESTS FAILED${colors.reset}\n`);
    return 1;
  } else {
    console.log(`${colors.yellow}${colors.bright}⏳ ALL TESTS SKIPPED${colors.reset}\n`);
    return 2;
  }
}

// Run tests
runAllTests().then((code) => process.exit(code)).catch((err) => {
  console.error(err);
  process.exit(1);
});
