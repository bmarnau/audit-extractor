/**
 * Test Registry System - Runnable Examples
 * 
 * This file demonstrates common usage patterns for the Test Registry System.
 * Run with: npx ts-node examples/TestRegistryExample.ts
 */

import { TestRegistryService } from '../src/application/TestRegistryService';
import { JsonTestRegistryRepository } from '../src/infrastructure/persistence/JsonTestRegistryRepository';
import { TestCategory, SeverityImpact } from '../src/domain/testRegistry/TestMetadata';

/**
 * Example 1: Basic Test Registration
 */
async function example1_BasicRegistration() {
  console.log('\n=== Example 1: Basic Test Registration ===\n');

  const repository = new JsonTestRegistryRepository('./examples-data/test-registry');
  const service = new TestRegistryService(repository);

  // Register different types of tests
  const unitTest = await service.registerUnitTest({
    testName: 'UserService.create',
    description: 'Should create a new user',
    component: 'UserService',
    framework: 'Jest',
    severityImpact: SeverityImpact.HIGH
  });

  const integrationTest = await service.registerIntegrationTest({
    testName: 'UserService + Database',
    description: 'Should persist user to database',
    component: 'UserService',
    framework: 'Jest'
  });

  const e2eTest = await service.registerE2ETest({
    testName: 'User Registration Flow',
    description: 'Complete user registration flow',
    component: 'UserInterface',
    framework: 'Playwright'
  });

  console.log(`Registered ${await service.getTestCount()} tests`);
  const all = await service.getAllTests();
  all.forEach(t => console.log(`  - ${t.getTestName()} (${t.getCategory()})`));
}

/**
 * Example 2: Test Execution Tracking
 */
async function example2_ExecutionTracking() {
  console.log('\n=== Example 2: Test Execution Tracking ===\n');

  const repository = new JsonTestRegistryRepository('./examples-data/test-registry');
  const service = new TestRegistryService(repository);

  // Get first test
  const tests = await service.getAllTests();
  if (tests.length === 0) {
    console.log('No tests registered. Run example1 first.');
    return;
  }

  const testEntry = tests[0];
  const testId = testEntry.getTestId().getValue();

  // Simulate test runs
  const runs = [
    { success: true, duration: 145 },
    { success: true, duration: 152 },
    { success: false, duration: 198 },
    { success: true, duration: 150 },
    { success: true, duration: 155 }
  ];

  console.log(`Recording ${runs.length} test runs for: ${testEntry.getTestName()}`);

  for (const run of runs) {
    if (run.success) {
      await service.recordTestSuccess(testId, run.duration);
    } else {
      await service.recordTestFailure(testId, run.duration);
    }
  }

  const updated = await service.getTestById(testId);
  if (updated) {
    const stats = updated.getExecutionStats();
    console.log(`\nExecution Statistics:`);
    console.log(`  Total runs: ${stats.totalRuns}`);
    console.log(`  Successes: ${stats.successCount}`);
    console.log(`  Failures: ${stats.failureCount}`);
    console.log(`  Success rate: ${(updated.getSuccessRate() * 100).toFixed(2)}%`);
    console.log(`  Average duration: ${stats.averageDuration.toFixed(2)}ms`);
    console.log(`  Flakiness: ${(stats.flakiness * 100).toFixed(2)}%`);
    console.log(`  Is flaky: ${updated.isFlaky()}`);
  }
}

/**
 * Example 3: Build Assessment
 */
async function example3_BuildAssessment() {
  console.log('\n=== Example 3: Build Assessment ===\n');

  const repository = new JsonTestRegistryRepository('./examples-data/test-registry');
  const service = new TestRegistryService(repository);

  const assessment = await service.getBuildAssessment();

  console.log('Build Assessment Report:');
  console.log(`  Build can pass: ${assessment.buildCanPass ? '✅' : '❌'}`);
  console.log(`  Total build-blocking tests: ${assessment.totalBuildBlockingTests}`);
  console.log(`  Flaky blocking tests: ${assessment.blockingFlakyTests}`);
  console.log(`  Critical impact tests: ${assessment.criticalTestsCount}`);
  console.log(`  Average success rate: ${(assessment.averageSuccessRate * 100).toFixed(2)}%`);
  console.log(`\n  Recommendation:`);
  console.log(`  ${assessment.recommendation}`);
}

/**
 * Example 4: Governance Report
 */
async function example4_GovernanceReport() {
  console.log('\n=== Example 4: Governance Report ===\n');

  const repository = new JsonTestRegistryRepository('./examples-data/test-registry');
  const service = new TestRegistryService(repository);

  const stats = await service.getCatalogStatistics();

  console.log('Test Catalog Statistics:');
  console.log(`  Total tests: ${stats.total}`);
  console.log(`  Enabled: ${stats.enabledCount}`);
  console.log(`  Disabled: ${stats.disabledCount}`);
  console.log(`  Build-blocking: ${stats.buildBlockingCount}`);
  console.log(`  Flaky tests: ${stats.flakyTestsCount}`);
  console.log(`  Average success rate: ${(stats.averageSuccessRate * 100).toFixed(2)}%`);

  console.log('\n  By Category:');
  Object.entries(stats.byCategory).forEach(([category, count]) => {
    if (count > 0) console.log(`    ${category}: ${count}`);
  });

  console.log('\n  By Component:');
  Object.entries(stats.byComponent).forEach(([component, count]) => {
    console.log(`    ${component}: ${count}`);
  });

  console.log('\n  By Framework:');
  Object.entries(stats.byFramework).forEach(([framework, count]) => {
    console.log(`    ${framework}: ${count}`);
  });

  console.log('\n  By Severity:');
  Object.entries(stats.bySeverityImpact).forEach(([severity, count]) => {
    if (count > 0) console.log(`    ${severity}: ${count}`);
  });
}

/**
 * Example 5: Component Overview
 */
async function example5_ComponentOverview() {
  console.log('\n=== Example 5: Component Overview ===\n');

  const repository = new JsonTestRegistryRepository('./examples-data/test-registry');
  const service = new TestRegistryService(repository);

  // Get all components and their overviews
  const overviews = await service.getAllComponentOverviews();

  if (overviews.length === 0) {
    console.log('No components with tests found.');
    return;
  }

  console.log(`Component Test Health Dashboard:\n`);

  for (const overview of overviews) {
    console.log(`📦 ${overview.component}`);
    console.log(`   Total tests: ${overview.totalTests}`);
    console.log(`   Enabled: ${overview.enabledTests}`);
    console.log(`   Build-blocking: ${overview.buildBlockingTests}`);
    console.log(`   Flaky: ${overview.flakyTests}`);
    console.log(`   Health score: ${(overview.averageSuccessRate * 100).toFixed(2)}%`);
    console.log(`   Frameworks: ${overview.frameworks.join(', ')}`);
    console.log();
  }
}

/**
 * Example 6: Flaky Test Detection
 */
async function example6_FlakyTestDetection() {
  console.log('\n=== Example 6: Flaky Test Detection ===\n');

  const repository = new JsonTestRegistryRepository('./examples-data/test-registry');
  const service = new TestRegistryService(repository);

  const flakyTests = await service.getFlakyTests();

  if (flakyTests.length === 0) {
    console.log('✅ No flaky tests detected!');
    return;
  }

  console.log(`⚠️  Found ${flakyTests.length} flaky test(s):\n`);

  for (const test of flakyTests) {
    const stats = test.getExecutionStats();
    console.log(`🔴 ${test.getTestName()}`);
    console.log(`   Component: ${test.getComponent()}`);
    console.log(`   Category: ${test.getCategory()}`);
    console.log(`   Success rate: ${(test.getSuccessRate() * 100).toFixed(2)}%`);
    console.log(`   Total runs: ${stats.totalRuns}`);
    console.log(`   Failures: ${stats.failureCount}`);
    console.log(`   Build blocking: ${test.isBuildBlocking() ? '🔒 Yes' : 'No'}`);
    console.log(`   Enabled: ${test.isEnabled() ? 'Yes' : 'Disabled'}`);
    console.log();
  }

  // Show recommendation
  const blockingFlaky = flakyTests.filter(t => t.isBuildBlocking());
  if (blockingFlaky.length > 0) {
    console.log('❌ Recommendation: Disable or fix these flaky build-blocking tests:');
    blockingFlaky.forEach(t => console.log(`   - ${t.getTestName()}`));
  }
}

/**
 * Example 7: Test Management
 */
async function example7_TestManagement() {
  console.log('\n=== Example 7: Test Management ===\n');

  const repository = new JsonTestRegistryRepository('./examples-data/test-registry');
  const service = new TestRegistryService(repository);

  const tests = await service.getAllTests();
  if (tests.length === 0) {
    console.log('No tests registered.');
    return;
  }

  const testEntry = tests[0];
  const testId = testEntry.getTestId().getValue();

  console.log(`Managing test: ${testEntry.getTestName()}`);
  console.log(`  Current enabled status: ${testEntry.isEnabled()}`);
  console.log(`  Current severity: ${testEntry.getSeverityImpact()}`);
  console.log(`  Current build-blocking: ${testEntry.isBuildBlocking()}`);

  // Toggle enabled status
  const toggled = await service.updateTestEnabled(testId, !testEntry.isEnabled());
  console.log(`\n✅ Toggled enabled status to: ${toggled?.isEnabled()}`);

  // Update severity
  const newSeverity = testEntry.getSeverityImpact() === SeverityImpact.MEDIUM 
    ? SeverityImpact.HIGH 
    : SeverityImpact.MEDIUM;
  const updated = await service.updateSeverityImpact(testId, newSeverity);
  console.log(`✅ Updated severity to: ${updated?.getSeverityImpact()}`);

  // Update build-blocking
  const blocking = await service.updateBuildBlocking(testId, !testEntry.isBuildBlocking());
  console.log(`✅ Updated build-blocking to: ${blocking?.isBuildBlocking()}`);
}

/**
 * Example 8: Export/Import Registry
 */
async function example8_ExportImport() {
  console.log('\n=== Example 8: Export/Import Registry ===\n');

  const repository = new JsonTestRegistryRepository('./examples-data/test-registry');
  const service = new TestRegistryService(repository);

  // Export
  const exported = await service.exportCatalog();
  console.log(`📤 Exported ${exported.length} tests`);

  if (exported.length === 0) {
    console.log('No tests to export.');
    return;
  }

  console.log('  Export sample (first test):');
  const firstTest = exported[0];
  console.log(`    Name: ${firstTest.testName}`);
  console.log(`    Category: ${firstTest.category}`);
  console.log(`    Component: ${firstTest.component}`);
  console.log(`    Framework: ${firstTest.framework}`);

  // Reimport into new repository
  const newRepository = new JsonTestRegistryRepository('./examples-data/test-registry-backup');
  const newService = new TestRegistryService(newRepository);

  const reimported = await newService.registerMany(exported);
  console.log(`\n📥 Reimported ${reimported.length} tests`);

  const count = await newService.getTestCount();
  console.log(`   New registry now contains: ${count} tests`);
}

/**
 * Main: Run all examples
 */
async function main() {
  try {
    console.log('🧪 Test Registry System Examples');
    console.log('================================\n');

    await example1_BasicRegistration();
    await example2_ExecutionTracking();
    await example3_BuildAssessment();
    await example4_GovernanceReport();
    await example5_ComponentOverview();
    await example6_FlakyTestDetection();
    await example7_TestManagement();
    await example8_ExportImport();

    console.log('\n✅ All examples completed!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run examples
main();
