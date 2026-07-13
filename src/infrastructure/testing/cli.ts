#!/usr/bin/env ts-node

/**
 * Comprehensive Test Execution CLI
 * 
 * Usage:
 *   npm run test:comprehensive
 *   npx ts-node src/infrastructure/testing/cli.ts
 */

import ComprehensiveTestRunner from './ComprehensiveTestRunner';

async function main() {
  const outputDir = process.argv[2] || './test-results';

  try {
    const runner = new ComprehensiveTestRunner();
    const report = await runner.runAllTests(outputDir);

    // Exit code based on results
    if (report.criticalFailures > 0) {
      console.log('\n❌ CRITICAL FAILURES DETECTED - EXIT CODE 2');
      process.exit(2); // Critical issues
    } else if (report.failedTests > 0) {
      console.log('\n⚠️  TEST FAILURES DETECTED - EXIT CODE 1');
      process.exit(1); // Failures
    } else {
      console.log('\n✅ ALL TESTS PASSED - EXIT CODE 0');
      process.exit(0); // Success
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(3); // Fatal error
  }
}

main();
