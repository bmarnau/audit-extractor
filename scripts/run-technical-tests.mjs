#!/usr/bin/env node

/**
 * CLI Entry Point für Technical Test Runner
 * Phase 38C - Technical Test Runner
 * 
 * Verwendung:
 *   npm run test:technical                    # Full mode
 *   npm run test:technical:critical           # Critical mode
 *   npm run test:technical:smoke              # Smoke mode
 */

import { TechnicalTestRunner } from '../dist/test/runner/TechnicalTestRunner.js';

async function main() {
  const mode = (process.argv[2] || 'FULL').toUpperCase();
  const verbose = process.argv.includes('--verbose');
  const parallel = !process.argv.includes('--sequential');

  // Validierung des Mode
  const validModes = ['FULL', 'CRITICAL', 'SMOKE', 'SUBSET'];
  if (!validModes.includes(mode)) {
    console.error(`❌ Invalid mode: ${mode}`);
    console.error(`Valid modes: ${validModes.join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🚀 Technical Test Runner - Phase 38C`);
  console.log(`   Mode: ${mode}`);
  console.log(`   Parallel: ${parallel}`);
  console.log(`   Verbose: ${verbose}\n`);

  try {
    const runner = new TechnicalTestRunner({
      executionMode: mode,
      parallel,
      maxConcurrent: 4,
      timeoutMs: 30000,
      verbose
    });

    const success = await runner.execute();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
