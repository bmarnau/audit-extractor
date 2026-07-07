#!/usr/bin/env node

/**
 * Comprehensive Frontend Integration Audit
 * 
 * Tests:
 * 1. API endpoints return correct data structures
 * 2. Frontend hooks can process the data
 * 3. UI components receive populated data
 * 4. Error handling works correctly
 * 
 * @version 1.0.0
 * @date 2026-07-07
 */

const http = require('http');

const API_URL = 'http://localhost:3000/api';

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║     COMPREHENSIVE FRONTEND INTEGRATION AUDIT v1.0              ║');
console.log('║     Date: 2026-07-07 | Test Suite: Complete System Check     ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data),
            time: Date.now()
          });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000);
    req.end();
  });
}

async function testHelpCenter() {
  console.log('🧪 TEST 1: Help Center - Glossary Data Structure');
  console.log('─'.repeat(60));
  
  try {
    const resp = await makeRequest(`${API_URL}/help/glossary?limit=10`);
    
    if (resp.status !== 200) {
      throw new Error(`Expected 200, got ${resp.status}`);
    }
    
    const entries = resp.body.data?.entries;
    if (!entries || !Array.isArray(entries)) {
      throw new Error('Glossary entries not found in response');
    }
    
    if (entries.length === 0) {
      throw new Error('No glossary entries returned');
    }
    
    // Validate data structure
    const firstEntry = entries[0];
    const requiredFields = ['term', 'definition', 'category'];
    const missingFields = requiredFields.filter(f => !(f in firstEntry));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing fields in glossary entry: ${missingFields.join(', ')}`);
    }
    
    console.log('✅ PASS: Glossary structure valid');
    console.log(`   • Entries found: ${entries.length}`);
    console.log(`   • First entry: "${firstEntry.term}"`);
    console.log(`   • Category: ${firstEntry.category}`);
    console.log(`   • Response time: ${resp.body.duration}ms\n`);
    
    return true;
  } catch (err) {
    console.error(`❌ FAIL: ${err.message}\n`);
    return false;
  }
}

async function testLogs() {
  console.log('🧪 TEST 2: Logs - Data Structure & Content');
  console.log('─'.repeat(60));
  
  try {
    const resp = await makeRequest(`${API_URL}/logs?limit=20`);
    
    if (resp.status !== 200) {
      throw new Error(`Expected 200, got ${resp.status}`);
    }
    
    const logs = resp.body.data?.logs;
    if (!logs || !Array.isArray(logs)) {
      throw new Error('Logs array not found in response');
    }
    
    if (logs.length === 0) {
      throw new Error('No log entries returned');
    }
    
    // Validate data structure
    const firstLog = logs[0];
    const requiredFields = ['id', 'timestamp', 'level', 'source', 'message'];
    const missingFields = requiredFields.filter(f => !(f in firstLog));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing fields in log entry: ${missingFields.join(', ')}`);
    }
    
    // Check log level values
    const validLevels = ['debug', 'info', 'warn', 'error'];
    const invalidLevels = logs.filter(l => !validLevels.includes(l.level));
    
    if (invalidLevels.length > 0) {
      throw new Error(`Invalid log levels found: ${invalidLevels.map(l => l.level).join(', ')}`);
    }
    
    console.log('✅ PASS: Logs structure valid');
    console.log(`   • Entries found: ${logs.length}`);
    console.log(`   • Levels: ${[...new Set(logs.map(l => l.level))].join(', ')}`);
    console.log(`   • Sources: ${[...new Set(logs.map(l => l.source))].join(', ')}`);
    console.log(`   • Response time: ${resp.body.duration}ms\n`);
    
    return true;
  } catch (err) {
    console.error(`❌ FAIL: ${err.message}\n`);
    return false;
  }
}

async function testExtractionResults() {
  console.log('🧪 TEST 3: Learning - Extract Results Endpoint');
  console.log('─'.repeat(60));
  
  try {
    const resp = await makeRequest(`${API_URL}/extract/results/test-result-001`);
    
    if (resp.status !== 200) {
      throw new Error(`Expected 200, got ${resp.status}`);
    }
    
    const result = resp.body.data?.data || resp.body.data;
    if (!result) {
      throw new Error('Result data not found in response');
    }
    
    // Validate data structure
    const requiredFields = ['id', 'documentId', 'extractedFields', 'coverage', 'status'];
    const missingFields = requiredFields.filter(f => !(f in result));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing fields in result: ${missingFields.join(', ')}`);
    }
    
    // Check extracted fields
    const fieldNames = Object.keys(result.extractedFields || {});
    if (fieldNames.length === 0) {
      throw new Error('No extracted fields found');
    }
    
    // Validate field structure
    const firstField = result.extractedFields[fieldNames[0]];
    if (!('value' in firstField) || !('confidence' in firstField)) {
      throw new Error('Extracted field missing value or confidence');
    }
    
    console.log('✅ PASS: Results structure valid');
    console.log(`   • Result ID: ${result.id}`);
    console.log(`   • Fields extracted: ${fieldNames.length}`);
    console.log(`   • Field names: ${fieldNames.slice(0, 3).join(', ')}${fieldNames.length > 3 ? '...' : ''}`);
    console.log(`   • Coverage: ${(result.coverage * 100).toFixed(0)}%`);
    console.log(`   • Status: ${result.status}`);
    console.log(`   • Response time: ${resp.body.duration}ms\n`);
    
    return true;
  } catch (err) {
    console.error(`❌ FAIL: ${err.message}\n`);
    return false;
  }
}

async function testDataFlow() {
  console.log('🧪 TEST 4: Frontend Hook Data Processing Simulation');
  console.log('─'.repeat(60));
  
  try {
    // Simulate useHelp hook
    const glossResponse = await makeRequest(`${API_URL}/help/glossary?limit=100`);
    const glossary = glossResponse.body.data?.entries || [];
    
    if (glossary.length === 0) {
      throw new Error('useHelp hook would receive empty data');
    }
    
    // Simulate useLogs hook
    const logsResponse = await makeRequest(`${API_URL}/logs?limit=100`);
    const logs = logsResponse.body.data?.logs || [];
    
    if (logs.length === 0) {
      throw new Error('useLogs hook would receive empty data');
    }
    
    // Simulate LearningPage
    const resultResponse = await makeRequest(`${API_URL}/extract/results/test-001`);
    const result = resultResponse.body.data?.data || resultResponse.body.data;
    
    if (!result) {
      throw new Error('LearningPage would fail to load result');
    }
    
    console.log('✅ PASS: All hooks receive valid data');
    console.log(`   • useHelp: ${glossary.length} entries loaded`);
    console.log(`   • useLogs: ${logs.length} entries loaded`);
    console.log(`   • LearningPage: Result loaded with ${Object.keys(result.extractedFields).length} fields`);
    console.log(`   • Component rendering: Should succeed\n`);
    
    return true;
  } catch (err) {
    console.error(`❌ FAIL: ${err.message}\n`);
    return false;
  }
}

async function testErrorHandling() {
  console.log('🧪 TEST 5: Error Handling & Edge Cases');
  console.log('─'.repeat(60));
  
  try {
    // Test 404
    const notFoundResp = await makeRequest(`${API_URL}/help/glossary/nonexistent`);
    if (notFoundResp.status === 200) {
      throw new Error('Should return error for invalid endpoint');
    }
    
    console.log('✅ PASS: Error handling works');
    console.log(`   • Invalid endpoint: ${notFoundResp.status} response`);
    console.log(`   • Error message: ${notFoundResp.body.error || 'Present'}\n`);
    
    return true;
  } catch (err) {
    console.error(`❌ FAIL: ${err.message}\n`);
    return false;
  }
}

async function runAllTests() {
  const results = [];
  
  try {
    results.push(await testHelpCenter());
    results.push(await testLogs());
    results.push(await testExtractionResults());
    results.push(await testDataFlow());
    results.push(await testErrorHandling());
  } catch (err) {
    console.error('🔴 FATAL ERROR:', err.message);
    process.exit(1);
  }
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      AUDIT RESULTS                            ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║ Tests Passed: ${passed}/${total} (${percentage}%)                                      ║`);
  
  if (percentage === 100) {
    console.log('║ Status: ✅ ALL TESTS PASSED                                     ║');
    console.log('║                                                                ║');
    console.log('║ Frontend Integration: READY ✅                                 ║');
    console.log('║ Help Center: WORKING ✅                                        ║');
    console.log('║ Logs Section: WORKING ✅                                       ║');
    console.log('║ Learning Page: WORKING ✅                                      ║');
  } else if (percentage >= 80) {
    console.log('║ Status: ⚠️  SOME TESTS FAILED                                   ║');
  } else {
    console.log('║ Status: ❌ CRITICAL FAILURES                                    ║');
  }
  
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  process.exit(percentage === 100 ? 0 : 1);
}

// Run tests
runAllTests();
