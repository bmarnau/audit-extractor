#!/usr/bin/env node
/**
 * Phase 15e Revision System - API Test Script
 * Tests all 6 revision endpoints
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
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
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Phase 15e Revision System - API Tests\n');

  try {
    // Test 1: Save a run
    console.log('1️⃣ Testing POST /api/revision/save-run');
    const runData = {
      documentId: 'doc-001',
      ruleSetId: 'ruleset-001',
      extractedFields: {
        invoiceNumber: { value: 'INV-001', confidence: 0.95 },
        customerName: { value: 'ACME Corp', confidence: 0.92 },
        totalAmount: { value: 15750.50, confidence: 0.98 },
      },
      coverage: 75,
      confidence: 0.95,
      validationStatus: 'passed',
      name: 'Invoice Extraction Run #1',
    };
    const saveRes = await makeRequest('POST', '/api/revision/save-run', runData);
    console.log(`   Status: ${saveRes.status}`);
    if (saveRes.data?.runId) {
      console.log(`   ✅ Run saved with ID: ${saveRes.data.runId}\n`);
      var runId = saveRes.data.runId;
    } else {
      console.log(`   ❌ Failed to save run\n`);
      console.log(`   Response: ${JSON.stringify(saveRes.data)}\n`);
    }

    // Test 2: Get the saved run
    if (runId) {
      console.log(`2️⃣ Testing GET /api/revision/run/${runId}`);
      const getRes = await makeRequest('GET', `/api/revision/run/${runId}`);
      console.log(`   Status: ${getRes.status}`);
      if (getRes.status === 200) {
        console.log(`   ✅ Run retrieved successfully`);
        console.log(`   Document: ${getRes.data?.documentId}, Coverage: ${getRes.data?.coverage}%\n`);
      } else {
        console.log(`   ❌ Failed to retrieve run\n`);
      }

      // Test 3: Get run history for document
      console.log(`3️⃣ Testing GET /api/revision/history/doc-001`);
      const historyRes = await makeRequest('GET', '/api/revision/history/doc-001');
      console.log(`   Status: ${historyRes.status}`);
      if (historyRes.status === 200) {
        console.log(`   ✅ History retrieved: ${historyRes.data?.length || 0} runs\n`);
      } else {
        console.log(`   ❌ Failed to retrieve history\n`);
      }

      // Test 4: List all runs
      console.log(`4️⃣ Testing GET /api/revision/runs`);
      const listRes = await makeRequest('GET', '/api/revision/runs?limit=10&offset=0');
      console.log(`   Status: ${listRes.status}`);
      if (listRes.status === 200) {
        console.log(`   ✅ Runs listed: ${listRes.data?.runCount || 0} total\n`);
      } else {
        console.log(`   ❌ Failed to list runs\n`);
      }

      // Test 5: Save a second run for comparison
      console.log(`5️⃣ Testing POST /api/revision/save-run (for comparison)`);
      const runData2 = {
        documentId: 'doc-001',
        ruleSetId: 'ruleset-002',
        extractedFields: {
          invoiceNumber: { value: 'INV-001', confidence: 0.96 },
          customerName: { value: 'ACME Corporation', confidence: 0.93 },
          totalAmount: { value: 15750.50, confidence: 0.98 },
        },
        coverage: 80,
        confidence: 0.96,
        validationStatus: 'passed',
        name: 'Invoice Extraction Run #2',
      };
      const saveRes2 = await makeRequest('POST', '/api/revision/save-run', runData2);
      console.log(`   Status: ${saveRes2.status}`);
      if (saveRes2.data?.runId) {
        console.log(`   ✅ Second run saved with ID: ${saveRes2.data.runId}\n`);
        var runId2 = saveRes2.data.runId;
      }

      // Test 6: Compare two runs
      if (runId2) {
        console.log(`6️⃣ Testing POST /api/revision/compare`);
        const compareRes = await makeRequest('POST', '/api/revision/compare', {
          run1Id: runId,
          run2Id: runId2,
        });
        console.log(`   Status: ${compareRes.status}`);
        if (compareRes.status === 200) {
          console.log(`   ✅ Runs compared`);
          console.log(`   Similarities: ${compareRes.data?.similarities}%`);
          console.log(`   Total changes: ${compareRes.data?.totalChanges}\n`);
        } else {
          console.log(`   ❌ Failed to compare runs\n`);
          console.log(`   Response: ${JSON.stringify(compareRes.data)}\n`);
        }
      }

      // Test 7: Delete a run
      console.log(`7️⃣ Testing DELETE /api/revision/run/${runId}`);
      const deleteRes = await makeRequest('DELETE', `/api/revision/run/${runId}`);
      console.log(`   Status: ${deleteRes.status}`);
      if (deleteRes.status === 200) {
        console.log(`   ✅ Run deleted successfully\n`);
      } else {
        console.log(`   ❌ Failed to delete run\n`);
      }
    }

    console.log('✨ All tests completed!');
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

// Wait a moment for server to be ready, then run tests
setTimeout(runTests, 500);
