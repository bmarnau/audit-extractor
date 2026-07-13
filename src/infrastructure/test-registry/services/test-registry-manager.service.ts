/**
 * Test Registry Manager Service
 * High-level test registry operations and management
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  TestMetadata,
  TestStatus,
  TestCategory,
  TestEnvironment,
  SeverityImpact,
  TestResult,
  TestDependency,
  TestReport,
  ITestRegistry,
  ITestRegistryManager,
  TestAutoRegistrationResult
} from '../test-registry.types';
import { TestRegistryService } from './test-registry.service';

export class TestRegistryManager implements ITestRegistryManager {
  private registry: TestRegistryService;
  private testGroups: Map<string, Set<string>> = new Map();
  private autoRegistrationResults: TestAutoRegistrationResult[] = [];

  constructor(registry?: TestRegistryService) {
    this.registry = registry || new TestRegistryService();
  }

  // ==================== Auto-Registration ====================

  /**
   * Register test from decorator
   */
  registerFromDecorator(metadata: Omit<TestMetadata, 'testId' | 'createdAt' | 'updatedAt'>): string {
    const testId = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const fullMetadata: TestMetadata = {
      ...metadata,
      testId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalRuns: 0,
      passedRuns: 0,
      failedRuns: 0,
      skippedRuns: 0,
      currentStatus: TestStatus.PENDING
    };

    try {
      return this.registry.registerTest(fullMetadata);
    } catch (error) {
      throw new Error(`Failed to auto-register test ${metadata.testName}: ${(error as Error).message}`);
    }
  }

  /**
   * Auto-register tests from file
   */
  autoRegisterFromFile(filePath: string): string[] {
    const testIds: string[] = [];

    if (!fs.existsSync(filePath)) {
      console.warn(`File not found for auto-registration: ${filePath}`);
      return testIds;
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Simple regex pattern to find test declarations
      // This is a basic implementation - extend as needed
      const testPatterns = [
        /describe\(['"`]([^'"`]+)['"`],\s*\(\)\s*=>\s*\{/g,
        /test\(['"`]([^'"`]+)['"`],/g,
        /it\(['"`]([^'"`]+)['"`],/g
      ];

      for (const pattern of testPatterns) {
        let match;
        while ((match = pattern.exec(fileContent)) !== null) {
          const testName = match[1];
          const component = path.basename(filePath, path.extname(filePath));

          try {
            const testId = this.registerFromDecorator({
              testName,
              category: this.categorizeFromFile(filePath),
              description: `Auto-registered test: ${testName}`,
              targetComponent: component,
              severityImpact: SeverityImpact.MEDIUM,
              buildBlocking: false,
              enabled: true,
              filePath,
              testFunction: testName,
              environment: TestEnvironment.LOCAL
            });

            testIds.push(testId);

            this.autoRegistrationResults.push({
              success: true,
              testId,
              testName,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            this.autoRegistrationResults.push({
              success: false,
              testName,
              error: (error as Error).message,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.error(`Failed to auto-register from file ${filePath}:`, error);
    }

    return testIds;
  }

  /**
   * Categorize test based on file path
   */
  private categorizeFromFile(filePath: string): TestCategory {
    if (filePath.includes('e2e') || filePath.includes('e2e')) {
      return TestCategory.E2E;
    }
    if (filePath.includes('integration')) {
      return TestCategory.INTEGRATION;
    }
    if (filePath.includes('performance') || filePath.includes('perf')) {
      return TestCategory.PERFORMANCE;
    }
    if (filePath.includes('security')) {
      return TestCategory.SECURITY;
    }
    if (filePath.includes('accessibility') || filePath.includes('a11y')) {
      return TestCategory.ACCESSIBILITY;
    }

    return TestCategory.UNIT; // Default
  }

  // ==================== Test Management ====================

  /**
   * Enable test
   */
  enableTest(testId: string): void {
    this.registry.updateTest(testId, { enabled: true });
  }

  /**
   * Disable test
   */
  disableTest(testId: string): void {
    this.registry.updateTest(testId, { enabled: false });
  }

  /**
   * Mark test as flaky
   */
  markAsFlaky(testId: string, isFlaky: boolean): void {
    this.registry.updateTest(testId, { isFlaky });
  }

  /**
   * Quarantine test
   */
  quarantineTest(testId: string, reason: string): void {
    const test = this.registry.getTest(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    this.registry.updateTest(testId, {
      currentStatus: TestStatus.QUARANTINED,
      customFields: {
        ...(test.customFields || {}),
        quarantineReason: reason,
        quarantinedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Release from quarantine
   */
  releaseFromQuarantine(testId: string): void {
    const test = this.registry.getTest(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    this.registry.updateTest(testId, {
      currentStatus: TestStatus.PENDING,
      customFields: {
        ...(test.customFields || {}),
        releasedFromQuarantineAt: new Date().toISOString()
      }
    });
  }

  // ==================== Grouping & Relationships ====================

  /**
   * Create test group
   */
  createTestGroup(groupName: string, testIds: string[]): void {
    const validTestIds = testIds.filter(id => this.registry.getTest(id) !== undefined);

    if (validTestIds.length === 0) {
      throw new Error(`No valid tests found for group ${groupName}`);
    }

    this.testGroups.set(groupName, new Set(validTestIds));
  }

  /**
   * Add dependency between tests
   */
  addDependency(fromTestId: string, toTestId: string, type: 'REQUIRES' | 'BLOCKS' | 'RELATED'): void {
    const fromTest = this.registry.getTest(fromTestId);
    const toTest = this.registry.getTest(toTestId);

    if (!fromTest || !toTest) {
      throw new Error('One or both tests not found');
    }

    const dependency: TestDependency = {
      testId: toTestId,
      testName: toTest.testName,
      dependencyType: type
    };

    const currentDeps = fromTest.dependencies || [];
    const updated = [...currentDeps, dependency];

    this.registry.updateTest(fromTestId, { dependencies: updated });
  }

  // ==================== Reports ====================

  /**
   * Generate category report
   */
  generateCategoryReport(category: TestCategory): TestReport {
    return this.registry.getReport({
      categories: [category]
    });
  }

  /**
   * Generate component report
   */
  generateComponentReport(component: string): TestReport {
    return this.registry.getReport({
      components: [component]
    });
  }

  /**
   * Generate health report
   */
  generateHealthReport(): TestReport {
    const stats = this.registry.calculateStatistics();

    const report = this.registry.getReport({
      buildBlockingOnly: true
    });

    report.summary.lastUpdated = new Date().toISOString();

    return report;
  }

  // ==================== Integration ====================

  /**
   * Identify blocking tests for a build
   */
  identifyBlockingTests(buildVersion: string): TestMetadata[] {
    const allTests = this.registry.getAllTests();

    return allTests.filter(test =>
      test.buildBlocking &&
      test.enabled &&
      (test.currentStatus === TestStatus.FAILED || test.currentStatus === TestStatus.QUARANTINED)
    );
  }

  /**
   * Identify regressions
   */
  identifyRegression(previousResults: TestResult[], currentResults: TestResult[]): TestMetadata[] {
    const regressions: TestMetadata[] = [];

    // Map results by test ID for easy lookup
    const previousMap = new Map(previousResults.map(r => [r.testId, r]));
    const currentMap = new Map(currentResults.map(r => [r.testId, r]));

    // Find tests that were passing but now failing
    for (const [testId, currentResult] of currentMap.entries()) {
      const previousResult = previousMap.get(testId);

      if (previousResult && previousResult.status === TestStatus.PASSED && currentResult.status === TestStatus.FAILED) {
        const test = this.registry.getTest(testId);
        if (test) {
          regressions.push(test);
        }
      }
    }

    return regressions;
  }

  // ==================== Maintenance ====================

  /**
   * Cleanup old results
   */
  cleanupOldResults(retentionDays: number): number {
    const allTests = this.registry.getAllTests();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let cleanedCount = 0;

    for (const test of allTests) {
      if (test.lastRunAt && new Date(test.lastRunAt) < cutoffDate) {
        // Reset run statistics for old tests
        this.registry.updateTest(test.testId, {
          lastRunAt: undefined,
          lastResult: undefined,
          totalRuns: 0,
          passedRuns: 0,
          failedRuns: 0,
          skippedRuns: 0
        });

        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Validate registry integrity
   */
  validateRegistry(): string[] {
    const errors: string[] = [];
    const allTests = this.registry.getAllTests();

    for (const test of allTests) {
      // Check required fields
      if (!test.testId) {
        errors.push(`Test missing testId`);
      }
      if (!test.testName) {
        errors.push(`Test ${test.testId} missing testName`);
      }
      if (!test.category) {
        errors.push(`Test ${test.testId} missing category`);
      }
      if (!test.targetComponent) {
        errors.push(`Test ${test.testId} missing targetComponent`);
      }

      // Check dependencies
      if (test.dependencies) {
        for (const dep of test.dependencies) {
          if (!this.registry.getTest(dep.testId)) {
            errors.push(`Test ${test.testId} references non-existent dependency ${dep.testId}`);
          }
        }
      }

      // Check statistics consistency
      if (test.passedRuns + test.failedRuns + test.skippedRuns > test.totalRuns) {
        errors.push(`Test ${test.testId} has inconsistent run statistics`);
      }

      // Check for orphaned quarantined tests
      if (test.currentStatus === TestStatus.QUARANTINED && !test.customFields?.quarantineReason) {
        errors.push(`Test ${test.testId} is quarantined but missing quarantine reason`);
      }
    }

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCircularDependency = (testId: string): boolean => {
      if (recursionStack.has(testId)) {
        return true;
      }
      if (visited.has(testId)) {
        return false;
      }

      visited.add(testId);
      recursionStack.add(testId);

      const test = this.registry.getTest(testId);
      if (test?.dependencies) {
        for (const dep of test.dependencies) {
          if (hasCircularDependency(dep.testId)) {
            return true;
          }
        }
      }

      recursionStack.delete(testId);
      return false;
    };

    for (const test of allTests) {
      if (hasCircularDependency(test.testId)) {
        errors.push(`Test ${test.testId} has circular dependencies`);
      }
    }

    return errors;
  }

  // ==================== Access ====================

  /**
   * Get the underlying registry
   */
  getRegistry(): ITestRegistry {
    return this.registry;
  }

  /**
   * Get auto-registration results
   */
  getAutoRegistrationResults(limit: number = 50): TestAutoRegistrationResult[] {
    return this.autoRegistrationResults.slice(-limit);
  }

  /**
   * Get test group
   */
  getTestGroup(groupName: string): string[] {
    const group = this.testGroups.get(groupName);
    return group ? Array.from(group) : [];
  }

  /**
   * List all test groups
   */
  listTestGroups(): string[] {
    return Array.from(this.testGroups.keys());
  }
}
