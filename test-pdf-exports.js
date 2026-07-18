#!/usr/bin/env node

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create output directory
const outDir = 'pdf-export-tests';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function downloadPDF(url, filename) {
  return new Promise((resolve, reject) => {
    console.log(`\n📥 Testing: ${url}`);
    
    const options = new URL(url);
    options.method = url.includes('POST') ? 'POST' : 'GET';
    options.headers = {
      'Content-Type': 'application/json'
    };
    
    const req = http.request(url, options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Content-Type: ${res.headers['content-type']}`);
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`   Size: ${buffer.length} bytes`);
        
        // Check magic number
        const magic = buffer.toString('ascii', 0, 4);
        console.log(`   Magic: ${magic}`);
        
        // Save file
        const filepath = path.join(outDir, filename);
        fs.writeFileSync(filepath, buffer);
        console.log(`   ✅ Saved: ${filepath}`);
        
        resolve({ success: true, file: filepath, size: buffer.length, magic });
      });
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
    
    if (options.method === 'POST') {
      req.write('{}');
    }
    req.end();
  });
}

async function testPDFExports() {
  console.log('===== PDF EXPORT TESTING =====\n');
  
  const tests = [
    {
      url: 'http://localhost:3000/api/management/export-pdf',
      filename: `management-${new Date().toISOString().split('T')[0]}-${Date.now()}.pdf`,
      method: 'POST'
    },
    {
      url: 'http://localhost:3000/api/reports/test-001/export',
      filename: `audit-${new Date().toISOString().split('T')[0]}-${Date.now()}.pdf`,
      method: 'GET'
    }
  ];
  
  for (const test of tests) {
    await downloadPDF(test.url, test.filename);
  }
  
  // List all PDFs
  console.log('\n===== CREATED PDFs =====');
  const files = fs.readdirSync(outDir).filter(f => f.endsWith('.pdf'));
  files.forEach(f => {
    const stat = fs.statSync(path.join(outDir, f));
    console.log(`  📄 ${f} (${stat.size} bytes)`);
  });
  
  console.log('\n✅ Testing complete!\n');
}

testPDFExports();
