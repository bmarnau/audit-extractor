const http = require('http');

const endpoints = [
  ['health', 'http://localhost:3000/health'],
  ['config', 'http://localhost:3000/api/config'],
  ['revision', 'http://localhost:3000/api/revision/save-run'],
  ['audit', 'http://localhost:3000/api/audit/test'],
];

async function testEndpoints() {
  console.log('API RESPONSE TIME TEST\n');
  for (const [name, url] of endpoints) {
    const start = Date.now();
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, res => {
          res.on('data', () => {});
          res.on('end', () => resolve({ status: res.statusCode, time: Date.now() - start }));
        });
        req.on('error', reject);
        req.setTimeout(2000, () => req.destroy());
      });
      const time = Date.now() - start;
      console.log(`[OK] ${name.padEnd(12)} ${time}ms`);
    } catch (e) {
      console.log(`[ERR] ${name.padEnd(12)} ${Date.now() - start}ms`);
    }
  }
}

testEndpoints().catch(console.error);
