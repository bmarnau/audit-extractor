#!/usr/bin/env node
/**
 * Build Verification Script
 * Comprehensive verification that build contains correct version strings
 * and APIs return correct versions
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const projectRoot = process.cwd();
const noRuntimeTest = process.argv.includes('--no-runtime');
const backendTimeout = 8000;

let exitCode = 0;

// Color codes for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function success(msg) {
  log(colors.green, `✓ ${msg}`);
}

function error(msg) {
  log(colors.red, `✗ ${msg}`);
  exitCode = 1;
}

function warn(msg) {
  log(colors.yellow, `⚠ ${msg}`);
}

function info(msg) {
  log(colors.cyan, `ℹ ${msg}`);
}

console.log('\n' + '='.repeat(70));
console.log('BUILD VERIFICATION SUITE');
console.log('='.repeat(70));

// ============================================================================
// STAGE 1: COMPILATION VERIFICATION
// ============================================================================

console.log(`\n[STAGE 1] TypeScript Compilation`);
info('Checking if dist/ directory exists...');

if (!fs.existsSync(path.join(projectRoot, 'dist'))) {
  error('dist/ directory not found!');
  process.exit(1);
}

if (fs.existsSync(path.join(projectRoot, 'dist', 'index.js'))) {
  success('Compiled backend found at dist/index.js');
} else {
  error('dist/index.js not found!');
  process.exit(1);
}

// ============================================================================
// STAGE 2: CONTENT VERIFICATION
// ============================================================================

console.log(`\n[STAGE 2] Content Verification`);
info('Checking version strings in compiled dist/ files...');

const helpFile = path.join(projectRoot, 'dist', 'infrastructure', 'api', 'routes', 'help.js');
if (fs.existsSync(helpFile)) {
  const content = fs.readFileSync(helpFile, 'utf8');
  if (content.includes('0.25.0')) {
    success('Help endpoint v0.25.0: Found in compiled output');
  } else {
    error('Help endpoint v0.25.0: NOT found in compiled output');
  }
} else {
  error(`Help routes file not found: ${helpFile}`);
}

// Check documentation files
info('Checking for required documentation files...');
const docs = ['MANUAL-0.25.0.md', 'RELEASE_NOTES_0.25.0.md', 'RELEASE_NOTES_0.24.0.md'];

for (const doc of docs) {
  const docPath = path.join(projectRoot, doc);
  if (fs.existsSync(docPath)) {
    const size = fs.statSync(docPath).size;
    const sizeKb = (size / 1024).toFixed(1);
    success(`Documentation: ${doc} (${sizeKb} KB)`);
  } else {
    error(`Documentation missing: ${doc}`);
  }
}

// ============================================================================
// STAGE 3: RUNTIME VERIFICATION
// ============================================================================

if (noRuntimeTest) {
  console.log(`\n[STAGE 3] Runtime Verification SKIPPED (--no-runtime)`);
  console.log('\n' + '='.repeat(70));
  console.log('BUILD VERIFICATION COMPLETE');
  if (exitCode === 0) {
    success('All checks passed');
  }
  console.log('='.repeat(70) + '\n');
  process.exit(exitCode);
}

console.log(`\n[STAGE 3] Runtime Verification`);
info('Cleaning up existing Node processes...');

// Kill existing node processes on port 3000
const ps = require('child_process').execSync('netstat -ano', { encoding: 'utf8' });
const lines = ps.split('\n').filter(l => l.includes(':3000'));

for (const line of lines) {
  const match = line.match(/(\d+)$/);
  if (match) {
    try {
      process.kill(match[1], 'SIGKILL');
    } catch (e) {
      // Process already dead
    }
  }
}

setTimeout(() => {
  info('Starting backend in test mode...');
  
  const backend = spawn('node', ['dist/index.js'], {
    cwd: projectRoot,
    stdio: 'ignore',
  });

  info(`Backend process started (PID: ${backend.pid})`);
  info(`Waiting for backend to initialize (up to ${backendTimeout / 1000} seconds)...`);

  let backendReady = false;
  const startTime = Date.now();

  const checkBackend = () => {
    if (backendReady) return;
    
    if (Date.now() - startTime > backendTimeout) {
      error(`Backend failed to start within ${backendTimeout / 1000} seconds`);
      backend.kill();
      process.exit(1);
    }

    // Try to connect
    const req = http.get('http://localhost:3000/api/help/manual', { timeout: 2000 }, (res) => {
      if (res.statusCode === 200) {
        backendReady = true;
        success('Backend is responding on port 3000');
        runApiTests();
      }
      res.on('data', () => {});
    });

    req.on('error', () => {
      setTimeout(checkBackend, 1000);
    });

    req.on('timeout', () => {
      req.destroy();
      setTimeout(checkBackend, 1000);
    });
  };

  const runApiTests = () => {
    console.log(`\n[STAGE 4] API Version Verification`);

    // Test Help Manual
    const manualReq = http.get('http://localhost:3000/api/help/manual', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data.version === '0.25.0') {
            success(`Help Manual: Version ${json.data.version} returned correctly`);
            info(`  Title: ${json.data.title}`);
          } else {
            error(`Help Manual: Version mismatch - got ${json.data.version}`);
          }
        } catch (e) {
          error(`Help Manual: Failed to parse response`);
        }
        
        // Test Release Notes
        const notesReq = http.get('http://localhost:3000/api/help/release-notes', (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              if (json.data && json.data.length > 0 && json.data[0].version === '0.25.0') {
                success(`Release Notes: Version ${json.data[0].version} found`);
              } else {
                error(`Release Notes: Version mismatch`);
              }
            } catch (e) {
              error(`Release Notes: Failed to parse response`);
            }
            
            // Cleanup
            backend.kill();
            setTimeout(() => {
              console.log('\n' + '='.repeat(70));
              if (exitCode === 0) {
                log(colors.green, 'ALL VERIFICATION CHECKS PASSED');
              } else {
                log(colors.red, 'VERIFICATION FAILED');
              }
              console.log('='.repeat(70) + '\n');
              process.exit(exitCode);
            }, 500);
          });
        });

        notesReq.on('error', () => {
          error('Release Notes API request failed');
          backend.kill();
          process.exit(1);
        });
      });
    });

    manualReq.on('error', () => {
      error('Help Manual API request failed');
      backend.kill();
      process.exit(1);
    });
  };

  checkBackend();
}, 1000);
