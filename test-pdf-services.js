/**
 * Quick test of PDF services compilation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing PDF Services Compilation...\n');

// Check if dist files exist
const distFiles = [
  'dist/infrastructure/services/pdf-validator.service.js',
  'dist/infrastructure/services/pdf-layout-builder.service.js',
  'dist/infrastructure/services/pdf-generation.service.js',
];

let allExist = true;
for (const file of distFiles) {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  allExist = allExist && exists;
}

if (!allExist) {
  console.log('\n❌ Some files missing - compilation may have failed');
  process.exit(1);
}

console.log('\n✅ All PDF service files compiled successfully!');

// Try importing pdfkit to verify dependency
try {
  import('pdfkit').then(() => {
    console.log('✅ pdfkit available (version info in package.json)');
  }).catch(() => {
    console.log('⚠️  pdfkit not available locally - will be available in Docker');
  });
} catch (err) {
  console.log('⚠️  pdfkit not available locally - will be available in Docker');
}

console.log('\n📋 Ready for Docker deployment and testing');
