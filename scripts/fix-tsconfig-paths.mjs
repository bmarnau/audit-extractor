#!/usr/bin/env node

/**
 * Fix tsconfig-paths/register import
 * Phase 38C - Specialized ESM fix for tsconfig-paths
 * 
 * Fixes the specific case where tsconfig-paths/register needs .js extension
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '../dist');

console.log('🔧 Fixing tsconfig-paths imports...\n');

function walkAndFix(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkAndFix(fullPath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      const originalContent = content;

      // Fix: import 'tsconfig-paths/register' -> import 'tsconfig-paths/register.js'
      content = content.replace(
        /import\s+['"]tsconfig-paths\/register['"]/g,
        "import 'tsconfig-paths/register.js'"
      );

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        const relativePath = path.relative(distDir, fullPath).replace(/\\/g, '/');
        console.log(`✓ Fixed tsconfig-paths in: ${relativePath}`);
      }
    }
  });
}

try {
  walkAndFix(distDir);
  console.log('\n✅ tsconfig-paths fix complete');
} catch (error) {
  console.error('❌ Error fixing tsconfig-paths:', error);
  process.exit(1);
}
