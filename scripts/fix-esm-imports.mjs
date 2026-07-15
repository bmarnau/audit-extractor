#!/usr/bin/env node

/**
 * Fix ESM Imports - Phase 38C
 * 
 * Adds .js extensions to all relative imports in compiled JavaScript files
 * for proper ESM module resolution in Node.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '..', 'dist');

function isDirectory(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    const fileDir = path.dirname(filePath);

    // Fix import statements - check if target is a directory or file
    content = content.replace(
      /from\s+['"](\.\.[/\\]|\.\/|\.\.\\)([^'"]+)(?<!\.js)(?<!\.json)['"];/g,
      (match, prefix, importPath) => {
        // Skip if already has extension
        if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
          return match;
        }

        // Resolve the actual path
        const fullPath = path.resolve(fileDir, prefix + importPath);
        
        // Check if it's a directory with an index.js
        if (isDirectory(fullPath) && fs.existsSync(path.join(fullPath, 'index.js'))) {
          return `from '${prefix}${importPath}/index.js';`;
        }
        
        // Check if file exists with .js extension
        if (fs.existsSync(fullPath + '.js')) {
          return `from '${prefix}${importPath}.js';`;
        }
        
        // Default: add .js
        return `from '${prefix}${importPath}.js';`;
      }
    );

    // Fix export statements
    content = content.replace(
      /export\s+([^}]*?)\s+from\s+['"](\.\.[/\\]|\.\/|\.\.\\)([^'"]+)(?<!\.js)(?<!\.json)['"];/g,
      (match, exports, prefix, importPath) => {
        if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
          return match;
        }

        const fullPath = path.resolve(fileDir, prefix + importPath);
        
        if (isDirectory(fullPath) && fs.existsSync(path.join(fullPath, 'index.js'))) {
          return `export ${exports} from '${prefix}${importPath}/index.js';`;
        }
        
        if (fs.existsSync(fullPath + '.js')) {
          return `export ${exports} from '${prefix}${importPath}.js';`;
        }
        
        return `export ${exports} from '${prefix}${importPath}.js';`;
      }
    );

    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed ESM imports: ${path.relative(distDir, filePath)}`);
    }
  } catch (err) {
    console.error(`✗ Error processing ${filePath}:`, err.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.js') && !file.endsWith('.d.ts')) {
      fixImportsInFile(filePath);
    }
  }
}

console.log('🔧 Fixing ESM imports in compiled JavaScript...\n');
if (fs.existsSync(distDir)) {
  walkDir(distDir);
  console.log('\n✅ ESM import fix complete');
} else {
  console.warn('⚠️  dist/ directory not found');
}
