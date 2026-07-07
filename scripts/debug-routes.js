#!/usr/bin/env node
const http = require('http');

const tests = [
  { method: 'GET', path: '/api/revision', name: 'Root revision path' },
  { method: 'GET', path: '/api/revision/', name: 'Root with slash' },
  { method: 'POST', path: '/api/revision/save-run', name: 'Save run endpoint' },
  { method: 'GET', path: '/api/health', name: 'Health check (sanity)' },
  { method: 'POST', path: '/api/config', name: 'Config endpoint (sanity)' },
];

function request(method, path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        resolve({ status: res.statusCode, path, method, data });
      });
    });

    req.on('error', (e) => {
      resolve({ status: 'ERROR', path, method, data: e.message });
    });

    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      req.write(JSON.stringify({}));
    }
    req.end();
  });
}

(async () => {
  console.log('Testing revision routes...\n');
  for (const test of tests) {
    const result = await request(test.method, test.path);
    console.log(`${test.name}`);
    console.log(`  ${test.method} ${test.path} → Status: ${result.status}`);
    if (result.data) {
      const parsed = JSON.parse(result.data);
      if (parsed.error) {
        console.log(`  Error: ${parsed.error.message}\n`);
      } else {
        console.log(`  Response OK\n`);
      }
    }
  }
})();
