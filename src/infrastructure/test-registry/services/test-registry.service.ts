/**
 * Test Registry Service
 * Core service for test registration, storage, and retrieval
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  TestMetadata,
  TestRegistryFilter,
  TestRegistrySummary,
  TestRegistryStatistics,
  TestReport,
  TestResult,
  TestStatus,
  TestCategory,
  SeverityImpact,
  TestEnvironment,
  ITestRegistry,
  BatchTestOperation
} from '../test-registry.types';

export class TestRegistryService implements ITestRegistry {
  private tests: Map<string, TestMetadata> = new Map();
  private batchOperations: BatchTestOperation[] = [];
  private persistencePath: string;
  private maxBatchHistory: number = 100;

  constructor(persistencePath?: string) {
    this.persistencePath = persistencePath || path.join(process.cwd(), 'test-results', 'test-registry.json');
    this.loadFromDiskSync();
  }

  // ==================== Registration ====================

  /**
   * Register a new test in the registry
   */
  registerTest(metadata: TestMetadata): string {
    if (!metadata.testId) {
      throw new Error('Test metadata must include testId');
    }

    if (this.tests.has(metadata.testId)) {
      throw new Error(`Test with ID ${metadata.testId} already exists`);
    }

    const testWithTimestamps: TestMetadata = {
      ...metadata,
      createdAt: metadata.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalRuns: 0,
      passedRuns: 0,
      failedRuns: 0,
      skippedRuns: 0
    };

    this.tests.set(metadata.testId, testWithTimestamps);
    this.saveToDiskSync();

    return metadata.testId;
  }

  /**
   * Unregister a test
   */
  unregisterTest(testId: string): boolean {
    const deleted = this.tests.delete(testId);
    if (deleted) {
      this.saveToDiskSync();
    }
    return deleted;
  }

  /**
   * Get a single test by ID
   */
  getTest(testId: string): TestMetadata | undefined {
    return this.tests.get(testId);
  }

  /**
   * Get all registered tests
   */
  getAllTests(): TestMetadata[] {
    return Array.from(this.tests.values());
  }

  // ==================== Querying ====================

  /**
   * Filter tests by multiple criteria
   */
  filterTests(filter: TestRegistryFilter): TestMetadata[] {
    let results = Array.from(this.tests.values());

    if (filter.categories && filter.categories.length > 0) {
      results = results.filter(t => filter.categories!.includes(t.category));
    }

    if (filter.statuses && filter.statuses.length > 0) {
      results = results.filter(t => filter.statuses!.includes(t.currentStatus));
    }

    if (filter.severities && filter.severities.length > 0) {
      results = results.filter(t => filter.severities!.includes(t.severityImpact));
    }

    if (filter.environments && filter.environments.length > 0) {
      results = results.filter(t => filter.environments!.includes(t.environment));
    }

    if (filter.components && filter.components.length > 0) {
      results = results.filter(t => filter.components!.includes(t.targetComponent));
    }

    if (filter.tags && filter.tags.length > 0) {
      results = results.filter(t =>
        t.tags && t.tags.some(tag => filter.tags!.includes(tag))
      );
    }

    if (filter.owners && filter.owners.length > 0) {
      results = results.filter(t => t.owner && filter.owners!.includes(t.owner));
    }

    if (filter.buildBlockingOnly) {
      results = results.filter(t => t.buildBlocking);
    }

    if (filter.enabledOnly) {
      results = results.filter(t => t.enabled);
    }

    if (filter.searchText) {
      const query = filter.searchText.toLowerCase();
      results = results.filter(t =>
        t.testName.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.targetComponent.toLowerCase().includes(query)
      );
    }

    if (filter.createdAfter) {
      const after = new Date(filter.createdAfter);
      results = results.filter(t => new Date(t.createdAt) >= after);
    }

    if (filter.createdBefore) {
      const before = new Date(filter.createdBefore);
      results = results.filter(t => new Date(t.createdAt) <= before);
    }

    if (filter.lastRunAfter && filter.lastRunAfter) {
      const after = new Date(filter.lastRunAfter);
      results = results.filter(t => t.lastRunAt && new Date(t.lastRunAt) >= after);
    }

    if (filter.lastRunBefore && filter.lastRunBefore) {
      const before = new Date(filter.lastRunBefore);
      results = results.filter(t => t.lastRunAt && new Date(t.lastRunAt) <= before);
    }

    return results;
  }

  /**
   * Search tests by text
   */
  searchTests(query: string): TestMetadata[] {
    return this.filterTests({ searchText: query });
  }

  /**
   * Get tests by category
   */
  getTestsByCategory(category: TestCategory): TestMetadata[] {
    return Array.from(this.tests.values()).filter(t => t.category === category);
  }

  /**
   * Get tests by component
   */
  getTestsByComponent(component: string): TestMetadata[] {
    return Array.from(this.tests.values()).filter(t => t.targetComponent === component);
  }

  /**
   * Get tests by owner
   */
  getTestsByOwner(owner: string): TestMetadata[] {
    return Array.from(this.tests.values()).filter(t => t.owner === owner);
  }

  /**
   * Get build-blocking tests
   */
  getBuildBlockingTests(): TestMetadata[] {
    return Array.from(this.tests.values()).filter(t => t.buildBlocking);
  }

  // ==================== Updates ====================

  /**
   * Update test metadata
   */
  updateTest(testId: string, updates: Partial<TestMetadata>): void {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const updated = {
      ...test,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.tests.set(testId, updated);
    this.saveToDiskSync();
  }

  /**
   * Record a test result
   */
  recordTestResult(testId: string, result: TestResult): void {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    // Update statistics
    test.totalRuns++;
    test.lastRunAt = result.timestamp;
    test.currentStatus = result.status;
    test.lastResult = result;

    switch (result.status) {
      case TestStatus.PASSED:
        test.passedRuns++;
        break;
      case TestStatus.FAILED:
        test.failedRuns++;
        break;
      case TestStatus.SKIPPED:
        test.skippedRuns++;
        break;
    }

    // Detect flakiness: if 50% of recent runs fail/pass randomly
    if (test.totalRuns >= 3) {
      const recentFailureRate = test.failedRuns / test.totalRuns;
      test.isFlaky = recentFailureRate > 0.2 && recentFailureRate < 0.8;
    }

    test.updatedAt = new Date().toISOString();

    this.tests.set(testId, test);
    this.saveToDiskSync();
  }

  /**
   * Update test status
   */
  updateTestStatus(testId: string, status: TestStatus): void {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    test.currentStatus = status;
    test.updatedAt = new Date().toISOString();

    this.tests.set(testId, test);
    this.saveToDiskSync();
  }

  // ==================== Batch Operations ====================

  /**
   * Register multiple tests in batch
   */
  batchRegisterTests(metadata: TestMetadata[]): string[] {
    const testIds: string[] = [];
    const operation: BatchTestOperation = {
      operationId: `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operationType: 'CREATE',
      testCount: metadata.length,
      successCount: 0,
      failureCount: 0,
      timestamp: new Date().toISOString(),
      duration: 0,
      details: {}
    };

    const startTime = Date.now();

    for (const test of metadata) {
      try {
        const testId = this.registerTest(test);
        testIds.push(testId);
        operation.successCount++;
      } catch (error) {
        operation.failureCount++;
        (operation.details as any)[test.testId] = (error as Error).message;
      }
    }

    operation.duration = Date.now() - startTime;
    this.batchOperations.push(operation);

    if (this.batchOperations.length > this.maxBatchHistory) {
      this.batchOperations = this.batchOperations.slice(-this.maxBatchHistory);
    }

    return testIds;
  }

  /**
   * Bulk update tests
   */
  bulkUpdateTests(testIds: string[], updates: Partial<TestMetadata>): number {
    let updated = 0;

    for (const testId of testIds) {
      if (this.tests.has(testId)) {
        this.updateTest(testId, updates);
        updated++;
      }
    }

    return updated;
  }

  // ==================== Statistics ====================

  /**
   * Calculate registry summary
   */
  calculateSummary(): TestRegistrySummary {
    const allTests = Array.from(this.tests.values());

    const summary: TestRegistrySummary = {
      totalTests: allTests.length,
      totalEnabled: allTests.filter(t => t.enabled).length,
      totalDisabled: allTests.filter(t => !t.enabled).length,

      byCategory: {} as Record<TestCategory, number>,
      byStatus: {} as Record<TestStatus, number>,
      bySeverity: {} as Record<SeverityImpact, number>,
      byEnvironment: {} as Record<TestEnvironment, number>,
      byComponent: {},

      buildBlockingCount: allTests.filter(t => t.buildBlocking).length,
      flakyTestsCount: allTests.filter(t => t.isFlaky).length,
      quarantinedCount: allTests.filter(t => t.currentStatus === TestStatus.QUARANTINED).length,

      totalRuns: allTests.reduce((sum, t) => sum + t.totalRuns, 0),
      passRate: 0,
      averageExecutionTimeMs: 0,

      lastUpdated: new Date().toISOString()
    };

    // Count by category
    Object.values(TestCategory).forEach(cat => {
      summary.byCategory[cat] = allTests.filter(t => t.category === cat).length;
    });

    // Count by status
    Object.values(TestStatus).forEach(status => {
      summary.byStatus[status] = allTests.filter(t => t.currentStatus === status).length;
    });

    // Count by severity
    Object.values(SeverityImpact).forEach(severity => {
      summary.bySeverity[severity] = allTests.filter(t => t.severityImpact === severity).length;
    });

    // Count by environment
    Object.values(TestEnvironment).forEach(env => {
      summary.byEnvironment[env] = allTests.filter(t => t.environment === env).length;
    });

    // Count by component
    allTests.forEach(t => {
      summary.byComponent[t.targetComponent] = (summary.byComponent[t.targetComponent] || 0) + 1;
    });

    // Calculate pass rate
    const totalPassed = allTests.reduce((sum, t) => sum + t.passedRuns, 0);
    summary.passRate = summary.totalRuns > 0 ? (totalPassed / summary.totalRuns) * 100 : 0;

    // Calculate average execution time
    const testsWithLastResult = allTests.filter(t => t.lastResult);
    if (testsWithLastResult.length > 0) {
      const totalTime = testsWithLastResult.reduce((sum, t) => sum + (t.lastResult?.executionTimeMs || 0), 0);
      summary.averageExecutionTimeMs = totalTime / testsWithLastResult.length;
    }

    return summary;
  }

  /**
   * Calculate detailed statistics
   */
  calculateStatistics(): TestRegistryStatistics {
    const allTests = Array.from(this.tests.values());
    const summary = this.calculateSummary();

    // Top categories
    const topCategories = Object.entries(summary.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category: category as TestCategory, count }));

    // Top components
    const topComponents = Object.entries(summary.byComponent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([component, count]) => ({ component, count }));

    // Top owners
    const ownerCounts: Record<string, number> = {};
    allTests.forEach(t => {
      if (t.owner) {
        ownerCounts[t.owner] = (ownerCounts[t.owner] || 0) + 1;
      }
    });
    const topOwners = Object.entries(ownerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([owner, count]) => ({ owner, count }));

    // Flaky tests
    const flakyTests = allTests
      .filter(t => t.isFlaky)
      .map(t => ({
        testName: t.testName,
        flakynessRate: t.totalRuns > 0 ? (t.failedRuns / t.totalRuns) * 100 : 0
      }))
      .sort((a, b) => b.flakynessRate - a.flakynessRate)
      .slice(0, 10);

    // Quarantined tests
    const quarantinedTests = allTests.filter(t => t.currentStatus === TestStatus.QUARANTINED);

    // Recent failures
    const recentFailures = allTests
      .filter(t => t.lastResult?.status === TestStatus.FAILED)
      .sort((a, b) => new Date(b.lastRunAt || 0).getTime() - new Date(a.lastRunAt || 0).getTime())
      .slice(0, 10)
      .map(t => t.lastResult!)
      .filter((r): r is TestResult => !!r);

    // Recently added
    const recentlyAdded = allTests
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Health score (0-100)
    let healthScore = 100;
    healthScore -= flakyTests.length * 5; // 5 points per flaky test
    healthScore -= quarantinedTests.length * 10; // 10 points per quarantined test
    healthScore -= (100 - summary.passRate); // 1 point per % below 100% pass rate
    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      totalCreated: allTests.length,
      totalResolved: allTests.filter(t => t.currentStatus === TestStatus.PASSED).length,
      resolutionRate: allTests.length > 0 ? (allTests.filter(t => t.currentStatus === TestStatus.PASSED).length / allTests.length) * 100 : 0,

      topCategories,
      topComponents,
      topOwners,

      testsByEnvironment: summary.byEnvironment,

      criticalTests: allTests.filter(t => t.severityImpact === SeverityImpact.CRITICAL).length,
      flakyTests,
      quarantinedTests,

      averagePassRate: summary.passRate,
      medianExecutionTimeMs: summary.averageExecutionTimeMs,

      recentFailures,
      recentlyAdded,

      healthScore
    };
  }

  /**
   * Get test report
   */
  getReport(filter?: TestRegistryFilter): TestReport {
    const summary = this.calculateSummary();
    const statistics = this.calculateStatistics();

    let detailedResults = Array.from(this.tests.values());
    if (filter) {
      detailedResults = this.filterTests(filter);
    }

    const recommendations: string[] = [];

    if (statistics.flakyTests.length > 0) {
      recommendations.push(`Found ${statistics.flakyTests.length} flaky tests - review and stabilize them`);
    }

    if (statistics.quarantinedTests.length > 0) {
      recommendations.push(`${statistics.quarantinedTests.length} tests are quarantined - consider fixing or removing them`);
    }

    if (summary.passRate < 95) {
      recommendations.push(`Pass rate is ${summary.passRate.toFixed(1)}% - investigate recent failures`);
    }

    if (statistics.healthScore < 80) {
      recommendations.push(`Registry health score is ${statistics.healthScore} - take action on flaky and quarantined tests`);
    }

    if (detailedResults.filter(t => !t.owner).length > 0) {
      recommendations.push(`${detailedResults.filter(t => !t.owner).length} tests have no owner - assign owners for accountability`);
    }

    return {
      timestamp: new Date().toISOString(),
      environment: TestEnvironment.LOCAL,
      summary,
      statistics,
      detailedResults,
      recommendations,
      exportedAt: new Date().toISOString()
    };
  }

  // ==================== Persistence ====================

  /**
   * Save to disk (async)
   */
  async saveToDisk(): Promise<void> {
    return new Promise((resolve, reject) => {
      const data = {
        lastUpdated: new Date().toISOString(),
        totalTests: this.tests.size,
        tests: Array.from(this.tests.entries()).map(([id, metadata]) => ({
          id,
          metadata
        })),
        batchOperations: this.batchOperations
      };

      const dir = path.dirname(this.persistencePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFile(this.persistencePath, JSON.stringify(data, null, 2), 'utf-8', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Save to disk (sync)
   */
  private saveToDiskSync(): void {
    try {
      const data = {
        lastUpdated: new Date().toISOString(),
        totalTests: this.tests.size,
        tests: Array.from(this.tests.entries()).map(([id, metadata]) => ({
          id,
          metadata
        })),
        batchOperations: this.batchOperations
      };

      const dir = path.dirname(this.persistencePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.persistencePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save test registry to disk:', error);
    }
  }

  /**
   * Load from disk (async)
   */
  async loadFromDisk(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(this.persistencePath)) {
        resolve();
        return;
      }

      fs.readFile(this.persistencePath, 'utf-8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          this.tests.clear();

          if (parsed.tests && Array.isArray(parsed.tests)) {
            parsed.tests.forEach((item: any) => {
              this.tests.set(item.id, item.metadata);
            });
          }

          if (parsed.batchOperations && Array.isArray(parsed.batchOperations)) {
            this.batchOperations = parsed.batchOperations;
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Load from disk (sync)
   */
  private loadFromDiskSync(): void {
    try {
      if (!fs.existsSync(this.persistencePath)) {
        return;
      }

      const data = fs.readFileSync(this.persistencePath, 'utf-8');
      const parsed = JSON.parse(data);

      this.tests.clear();

      if (parsed.tests && Array.isArray(parsed.tests)) {
        parsed.tests.forEach((item: any) => {
          this.tests.set(item.id, item.metadata);
        });
      }

      if (parsed.batchOperations && Array.isArray(parsed.batchOperations)) {
        this.batchOperations = parsed.batchOperations;
      }
    } catch (error) {
      console.error('Failed to load test registry from disk:', error);
    }
  }

  /**
   * Export as JSON
   */
  exportAsJSON(): string {
    const report = this.getReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export as text
   */
  exportAsText(): string {
    const summary = this.calculateSummary();
    const stats = this.calculateStatistics();

    let text = '='.repeat(80) + '\n';
    text += 'TEST REGISTRY REPORT\n';
    text += '='.repeat(80) + '\n\n';

    text += `Report Generated: ${new Date().toISOString()}\n`;
    text += `Total Tests: ${summary.totalTests}\n`;
    text += `Enabled: ${summary.totalEnabled} | Disabled: ${summary.totalDisabled}\n`;
    text += `Pass Rate: ${summary.passRate.toFixed(2)}%\n`;
    text += `Health Score: ${stats.healthScore}/100\n\n`;

    text += '-'.repeat(80) + '\n';
    text += 'BY CATEGORY\n';
    text += '-'.repeat(80) + '\n';
    Object.entries(summary.byCategory).forEach(([cat, count]) => {
      text += `  ${cat.padEnd(20)} ${count}\n`;
    });

    text += '\n';
    text += '-'.repeat(80) + '\n';
    text += 'BY STATUS\n';
    text += '-'.repeat(80) + '\n';
    Object.entries(summary.byStatus).forEach(([status, count]) => {
      text += `  ${status.padEnd(20)} ${count}\n`;
    });

    text += '\n';
    text += '-'.repeat(80) + '\n';
    text += 'BY SEVERITY\n';
    text += '-'.repeat(80) + '\n';
    Object.entries(summary.bySeverity).forEach(([severity, count]) => {
      text += `  ${severity.padEnd(20)} ${count}\n`;
    });

    if (stats.flakyTests.length > 0) {
      text += '\n';
      text += '-'.repeat(80) + '\n';
      text += `FLAKY TESTS (${stats.flakyTests.length})\n`;
      text += '-'.repeat(80) + '\n';
      stats.flakyTests.forEach(flaky => {
        text += `  ${flaky.testName.padEnd(50)} ${flaky.flakynessRate.toFixed(1)}%\n`;
      });
    }

    if (stats.recommendations.length > 0) {
      text += '\n';
      text += '-'.repeat(80) + '\n';
      text += 'RECOMMENDATIONS\n';
      text += '-'.repeat(80) + '\n';
      stats.recommendations.forEach((rec, i) => {
        text += `  ${i + 1}. ${rec}\n`;
      });
    }

    text += '\n' + '='.repeat(80) + '\n';

    return text;
  }
}
