/**
 * Test Registry System - Comprehensive Test Suite
 * Tests for all test registry services and functionality
 */

import { TestRegistryService } from '../services/test-registry.service';
import { TestRegistryManager } from '../services/test-registry-manager.service';
import {
  TestMetadata,
  TestCategory,
  TestStatus,
  SeverityImpact,
  TestEnvironment,
  TestResult
} from '../test-registry.types';

describe('TestRegistryService', () => {
  let registry: TestRegistryService;

  beforeEach(() => {
    registry = new TestRegistryService();
  });

  describe('Test Registration', () => {
    test('should register a new test', () => {
      const metadata: TestMetadata = {
        testId: 'TEST-001',
        testName: 'Sample Test',
        category: TestCategory.UNIT,
        description: 'A sample test',
        targetComponent: 'sample-component',
        severityImpact: SeverityImpact.HIGH,
        buildBlocking: true,
        enabled: true,
        filePath: 'test/sample.test.ts',
        testFunction: 'sampleTest',
        environment: TestEnvironment.LOCAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalRuns: 0,
        passedRuns: 0,
        failedRuns: 0,
        skippedRuns: 0,
        currentStatus: TestStatus.PENDING
      };

      const testId = registry.registerTest(metadata);

      expect(testId).toBe('TEST-001');
      expect(registry.getTest(testId)).toEqual(expect.objectContaining({
        testName: 'Sample Test',
        category: TestCategory.UNIT
      }));
    });

    test('should not register test with duplicate ID', () => {
      const metadata: TestMetadata = {
        testId: 'TEST-DUP',
        testName: 'Duplicate Test',
        category: TestCategory.UNIT,
        description: 'Duplicate test',
        targetComponent: 'component',
        severityImpact: SeverityImpact.MEDIUM,
        buildBlocking: false,
        enabled: true,
        filePath: 'test/dup.test.ts',
        testFunction: 'dupTest',
        environment: TestEnvironment.LOCAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalRuns: 0,
        passedRuns: 0,
        failedRuns: 0,
        skippedRuns: 0,
        currentStatus: TestStatus.PENDING
      };

      registry.registerTest(metadata);

      expect(() => registry.registerTest(metadata)).toThrow();
    });

    test('should unregister a test', () => {
      const metadata: TestMetadata = {
        testId: 'TEST-UNREG',
        testName: 'Test to Unregister',
        category: TestCategory.UNIT,
        description: 'Test',
        targetComponent: 'component',
        severityImpact: SeverityImpact.LOW,
        buildBlocking: false,
        enabled: true,
        filePath: 'test/unreg.test.ts',
        testFunction: 'unregTest',
        environment: TestEnvironment.LOCAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalRuns: 0,
        passedRuns: 0,
        failedRuns: 0,
        skippedRuns: 0,
        currentStatus: TestStatus.PENDING
      };

      registry.registerTest(metadata);
      const deleted = registry.unregisterTest('TEST-UNREG');

      expect(deleted).toBe(true);
      expect(registry.getTest('TEST-UNREG')).toBeUndefined();
    });
  });

  describe('Querying', () => {
    beforeEach(() => {
      const tests: TestMetadata[] = [
        {
          testId: 'TEST-UNIT-1',
          testName: 'Unit Test 1',
          category: TestCategory.UNIT,
          description: 'First unit test',
          targetComponent: 'auth-service',
          severityImpact: SeverityImpact.CRITICAL,
          buildBlocking: true,
          enabled: true,
          filePath: 'test/auth.test.ts',
          testFunction: 'testAuth',
          environment: TestEnvironment.LOCAL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalRuns: 5,
          passedRuns: 5,
          failedRuns: 0,
          skippedRuns: 0,
          currentStatus: TestStatus.PASSED,
          tags: ['auth', 'security']
        },
        {
          testId: 'TEST-INT-1',
          testName: 'Integration Test 1',
          category: TestCategory.INTEGRATION,
          description: 'First integration test',
          targetComponent: 'api-gateway',
          severityImpact: SeverityImpact.HIGH,
          buildBlocking: false,
          enabled: true,
          filePath: 'test/api.test.ts',
          testFunction: 'testApi',
          environment: TestEnvironment.CI,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalRuns: 3,
          passedRuns: 2,
          failedRuns: 1,
          skippedRuns: 0,
          currentStatus: TestStatus.FAILED,
          tags: ['api', 'integration']
        }
      ];

      tests.forEach(test => registry.registerTest(test));
    });

    test('should filter tests by category', () => {
      const unitTests = registry.filterTests({ categories: [TestCategory.UNIT] });

      expect(unitTests).toHaveLength(1);
      expect(unitTests[0].category).toBe(TestCategory.UNIT);
    });

    test('should filter tests by status', () => {
      const passedTests = registry.filterTests({ statuses: [TestStatus.PASSED] });

      expect(passedTests).toHaveLength(1);
      expect(passedTests[0].currentStatus).toBe(TestStatus.PASSED);
    });

    test('should filter tests by severity', () => {
      const criticalTests = registry.filterTests({ severities: [SeverityImpact.CRITICAL] });

      expect(criticalTests).toHaveLength(1);
      expect(criticalTests[0].severityImpact).toBe(SeverityImpact.CRITICAL);
    });

    test('should filter build-blocking tests', () => {
      const blockers = registry.filterTests({ buildBlockingOnly: true });

      expect(blockers).toHaveLength(1);
      expect(blockers[0].buildBlocking).toBe(true);
    });

    test('should filter by tags', () => {
      const authTests = registry.filterTests({ tags: ['auth'] });

      expect(authTests).toHaveLength(1);
      expect(authTests[0].tags).toContain('auth');
    });

    test('should search tests by text', () => {
      const results = registry.searchTests('auth');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.testName.includes('auth') || t.description.includes('auth'))).toBe(true);
    });

    test('should get tests by component', () => {
      const authTests = registry.getTestsByComponent('auth-service');

      expect(authTests).toHaveLength(1);
      expect(authTests[0].targetComponent).toBe('auth-service');
    });
  });

  describe('Test Updates', () => {
    beforeEach(() => {
      const metadata: TestMetadata = {
        testId: 'TEST-UPDATE',
        testName: 'Test to Update',
        category: TestCategory.UNIT,
        description: 'Test for update',
        targetComponent: 'component',
        severityImpact: SeverityImpact.MEDIUM,
        buildBlocking: false,
        enabled: true,
        filePath: 'test/update.test.ts',
        testFunction: 'updateTest',
        environment: TestEnvironment.LOCAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalRuns: 0,
        passedRuns: 0,
        failedRuns: 0,
        skippedRuns: 0,
        currentStatus: TestStatus.PENDING
      };

      registry.registerTest(metadata);
    });

    test('should update test metadata', () => {
      registry.updateTest('TEST-UPDATE', {
        description: 'Updated description',
        enabled: false
      });

      const updated = registry.getTest('TEST-UPDATE');
      expect(updated?.description).toBe('Updated description');
      expect(updated?.enabled).toBe(false);
    });

    test('should record test result', () => {
      const result: TestResult = {
        testId: 'TEST-UPDATE',
        status: TestStatus.PASSED,
        executionTimeMs: 150,
        timestamp: new Date().toISOString(),
        environment: TestEnvironment.LOCAL
      };

      registry.recordTestResult('TEST-UPDATE', result);

      const updated = registry.getTest('TEST-UPDATE');
      expect(updated?.totalRuns).toBe(1);
      expect(updated?.passedRuns).toBe(1);
      expect(updated?.currentStatus).toBe(TestStatus.PASSED);
      expect(updated?.lastResult).toEqual(result);
    });

    test('should update test status', () => {
      registry.updateTestStatus('TEST-UPDATE', TestStatus.FAILED);

      const updated = registry.getTest('TEST-UPDATE');
      expect(updated?.currentStatus).toBe(TestStatus.FAILED);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      const tests: TestMetadata[] = [
        {
          testId: 'TEST-STAT-1',
          testName: 'Stat Test 1',
          category: TestCategory.UNIT,
          description: 'Test',
          targetComponent: 'comp-a',
          severityImpact: SeverityImpact.HIGH,
          buildBlocking: true,
          enabled: true,
          filePath: 'test/stat.test.ts',
          testFunction: 'test1',
          environment: TestEnvironment.LOCAL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalRuns: 10,
          passedRuns: 8,
          failedRuns: 2,
          skippedRuns: 0,
          currentStatus: TestStatus.PASSED,
          isFlaky: true
        },
        {
          testId: 'TEST-STAT-2',
          testName: 'Stat Test 2',
          category: TestCategory.INTEGRATION,
          description: 'Test',
          targetComponent: 'comp-b',
          severityImpact: SeverityImpact.MEDIUM,
          buildBlocking: false,
          enabled: false,
          filePath: 'test/stat.test.ts',
          testFunction: 'test2',
          environment: TestEnvironment.CI,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalRuns: 5,
          passedRuns: 5,
          failedRuns: 0,
          skippedRuns: 0,
          currentStatus: TestStatus.PASSED
        }
      ];

      tests.forEach(test => registry.registerTest(test));
    });

    test('should calculate summary', () => {
      const summary = registry.calculateSummary();

      expect(summary.totalTests).toBe(2);
      expect(summary.totalEnabled).toBe(1);
      expect(summary.totalDisabled).toBe(1);
      expect(summary.buildBlockingCount).toBe(1);
      expect(summary.flakyTestsCount).toBe(1);
      expect(summary.passRate).toBeGreaterThan(0);
    });

    test('should calculate statistics', () => {
      const stats = registry.calculateStatistics();

      expect(stats.topCategories.length).toBeGreaterThan(0);
      expect(stats.topComponents.length).toBeGreaterThan(0);
      expect(stats.healthScore).toBeLessThanOrEqual(100);
      expect(stats.healthScore).toBeGreaterThanOrEqual(0);
    });

    test('should generate report', () => {
      const report = registry.getReport();

      expect(report.summary).toBeDefined();
      expect(report.statistics).toBeDefined();
      expect(report.detailedResults).toHaveLength(2);
      expect(report.recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Batch Operations', () => {
    test('should batch register tests', () => {
      const tests: TestMetadata[] = [
        {
          testId: 'BATCH-1',
          testName: 'Batch Test 1',
          category: TestCategory.UNIT,
          description: 'Batch test',
          targetComponent: 'comp',
          severityImpact: SeverityImpact.LOW,
          buildBlocking: false,
          enabled: true,
          filePath: 'test/batch.test.ts',
          testFunction: 'batchTest1',
          environment: TestEnvironment.LOCAL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalRuns: 0,
          passedRuns: 0,
          failedRuns: 0,
          skippedRuns: 0,
          currentStatus: TestStatus.PENDING
        },
        {
          testId: 'BATCH-2',
          testName: 'Batch Test 2',
          category: TestCategory.UNIT,
          description: 'Batch test',
          targetComponent: 'comp',
          severityImpact: SeverityImpact.LOW,
          buildBlocking: false,
          enabled: true,
          filePath: 'test/batch.test.ts',
          testFunction: 'batchTest2',
          environment: TestEnvironment.LOCAL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalRuns: 0,
          passedRuns: 0,
          failedRuns: 0,
          skippedRuns: 0,
          currentStatus: TestStatus.PENDING
        }
      ];

      const testIds = registry.batchRegisterTests(tests);

      expect(testIds).toHaveLength(2);
      expect(testIds).toContain('BATCH-1');
      expect(testIds).toContain('BATCH-2');
    });

    test('should bulk update tests', () => {
      registry.registerTest({
        testId: 'BULK-1',
        testName: 'Bulk Test 1',
        category: TestCategory.UNIT,
        description: 'Bulk test',
        targetComponent: 'comp',
        severityImpact: SeverityImpact.LOW,
        buildBlocking: false,
        enabled: true,
        filePath: 'test/bulk.test.ts',
        testFunction: 'bulkTest1',
        environment: TestEnvironment.LOCAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalRuns: 0,
        passedRuns: 0,
        failedRuns: 0,
        skippedRuns: 0,
        currentStatus: TestStatus.PENDING
      });

      const updated = registry.bulkUpdateTests(['BULK-1'], { enabled: false });

      expect(updated).toBe(1);
      expect(registry.getTest('BULK-1')?.enabled).toBe(false);
    });
  });

  describe('Export', () => {
    test('should export as JSON', () => {
      const metadata: TestMetadata = {
        testId: 'EXPORT-JSON',
        testName: 'Export Test',
        category: TestCategory.UNIT,
        description: 'Export test',
        targetComponent: 'comp',
        severityImpact: SeverityImpact.LOW,
        buildBlocking: false,
        enabled: true,
        filePath: 'test/export.test.ts',
        testFunction: 'exportTest',
        environment: TestEnvironment.LOCAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalRuns: 0,
        passedRuns: 0,
        failedRuns: 0,
        skippedRuns: 0,
        currentStatus: TestStatus.PENDING
      };

      registry.registerTest(metadata);
      const json = registry.exportAsJSON();

      expect(json).toContain('EXPORT-JSON');
      expect(json).toContain('Export Test');

      const parsed = JSON.parse(json);
      expect(parsed.detailedResults).toBeDefined();
    });

    test('should export as text', () => {
      const metadata: TestMetadata = {
        testId: 'EXPORT-TEXT',
        testName: 'Export Test',
        category: TestCategory.UNIT,
        description: 'Export test',
        targetComponent: 'comp',
        severityImpact: SeverityImpact.LOW,
        buildBlocking: false,
        enabled: true,
        filePath: 'test/export.test.ts',
        testFunction: 'exportTest',
        environment: TestEnvironment.LOCAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalRuns: 0,
        passedRuns: 0,
        failedRuns: 0,
        skippedRuns: 0,
        currentStatus: TestStatus.PENDING
      };

      registry.registerTest(metadata);
      const text = registry.exportAsText();

      expect(text).toContain('TEST REGISTRY REPORT');
      expect(text).toContain('Export Test');
    });
  });
});

describe('TestRegistryManager', () => {
  let manager: TestRegistryManager;
  let registry: TestRegistryService;

  beforeEach(() => {
    registry = new TestRegistryService();
    manager = new TestRegistryManager(registry);
  });

  describe('Auto-Registration', () => {
    test('should register test from decorator', () => {
      const testId = manager.registerFromDecorator({
        testName: 'Decorator Test',
        category: TestCategory.UNIT,
        description: 'Test from decorator',
        targetComponent: 'test-comp',
        severityImpact: SeverityImpact.HIGH,
        buildBlocking: true,
        enabled: true,
        filePath: 'test/decorator.test.ts',
        testFunction: 'decoratorTest',
        environment: TestEnvironment.LOCAL
      });

      expect(testId).toBeDefined();
      expect(testId.startsWith('TEST-')).toBe(true);

      const test = registry.getTest(testId);
      expect(test?.testName).toBe('Decorator Test');
    });
  });

  describe('Test Management', () => {
    beforeEach(() => {
      manager.registerFromDecorator({
        testName: 'Managed Test',
        category: TestCategory.UNIT,
        description: 'Test for management',
        targetComponent: 'comp',
        severityImpact: SeverityImpact.MEDIUM,
        buildBlocking: false,
        enabled: true,
        filePath: 'test/managed.test.ts',
        testFunction: 'managedTest',
        environment: TestEnvironment.LOCAL
      });
    });

    test('should enable and disable tests', () => {
      const allTests = registry.getAllTests();
      const testId = allTests[0].testId;

      manager.disableTest(testId);
      expect(registry.getTest(testId)?.enabled).toBe(false);

      manager.enableTest(testId);
      expect(registry.getTest(testId)?.enabled).toBe(true);
    });

    test('should mark test as flaky', () => {
      const allTests = registry.getAllTests();
      const testId = allTests[0].testId;

      manager.markAsFlaky(testId, true);
      expect(registry.getTest(testId)?.isFlaky).toBe(true);
    });

    test('should quarantine and release test', () => {
      const allTests = registry.getAllTests();
      const testId = allTests[0].testId;

      manager.quarantineTest(testId, 'Flaky behavior detected');
      expect(registry.getTest(testId)?.currentStatus).toBe(TestStatus.QUARANTINED);

      manager.releaseFromQuarantine(testId);
      expect(registry.getTest(testId)?.currentStatus).toBe(TestStatus.PENDING);
    });
  });

  describe('Groups & Dependencies', () => {
    test('should create test group', () => {
      const testId1 = manager.registerFromDecorator({
        testName: 'Group Test 1',
        category: TestCategory.UNIT,
        description: 'Group test',
        targetComponent: 'comp',
        severityImpact: SeverityImpact.LOW,
        buildBlocking: false,
        enabled: true,
        filePath: 'test/group.test.ts',
        testFunction: 'groupTest1',
        environment: TestEnvironment.LOCAL
      });

      const testId2 = manager.registerFromDecorator({
        testName: 'Group Test 2',
        category: TestCategory.UNIT,
        description: 'Group test',
        targetComponent: 'comp',
        severityImpact: SeverityImpact.LOW,
        buildBlocking: false,
        enabled: true,
        filePath: 'test/group.test.ts',
        testFunction: 'groupTest2',
        environment: TestEnvironment.LOCAL
      });

      manager.createTestGroup('Auth Tests', [testId1, testId2]);

      const group = manager.getTestGroup('Auth Tests');
      expect(group).toHaveLength(2);
      expect(group).toContain(testId1);
    });

    test('should add test dependency', () => {
      const testId1 = manager.registerFromDecorator({
        testName: 'Dependency Test 1',
        category: TestCategory.UNIT,
        description: 'Dependency test',
        targetComponent: 'comp',
        severityImpact: SeverityImpact.LOW,
        buildBlocking: false,
        enabled: true,
        filePath: 'test/dep.test.ts',
        testFunction: 'depTest1',
        environment: TestEnvironment.LOCAL
      });

      const testId2 = manager.registerFromDecorator({
        testName: 'Dependency Test 2',
        category: TestCategory.UNIT,
        description: 'Dependency test',
        targetComponent: 'comp',
        severityImpact: SeverityImpact.LOW,
        buildBlocking: false,
        enabled: true,
        filePath: 'test/dep.test.ts',
        testFunction: 'depTest2',
        environment: TestEnvironment.LOCAL
      });

      manager.addDependency(testId1, testId2, 'REQUIRES');

      const test1 = registry.getTest(testId1);
      expect(test1?.dependencies).toBeDefined();
      expect(test1?.dependencies?.length).toBeGreaterThan(0);
    });
  });

  describe('Validation', () => {
    test('should validate registry', () => {
      manager.registerFromDecorator({
        testName: 'Valid Test',
        category: TestCategory.UNIT,
        description: 'Valid test',
        targetComponent: 'comp',
        severityImpact: SeverityImpact.LOW,
        buildBlocking: false,
        enabled: true,
        filePath: 'test/valid.test.ts',
        testFunction: 'validTest',
        environment: TestEnvironment.LOCAL
      });

      const errors = manager.validateRegistry();
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('Reports', () => {
    test('should generate category report', () => {
      manager.registerFromDecorator({
        testName: 'Report Test',
        category: TestCategory.UNIT,
        description: 'Report test',
        targetComponent: 'comp',
        severityImpact: SeverityImpact.MEDIUM,
        buildBlocking: false,
        enabled: true,
        filePath: 'test/report.test.ts',
        testFunction: 'reportTest',
        environment: TestEnvironment.LOCAL
      });

      const report = manager.generateCategoryReport(TestCategory.UNIT);

      expect(report.summary).toBeDefined();
      expect(report.detailedResults).toBeDefined();
    });

    test('should generate health report', () => {
      manager.registerFromDecorator({
        testName: 'Health Test',
        category: TestCategory.UNIT,
        description: 'Health test',
        targetComponent: 'comp',
        severityImpact: SeverityImpact.CRITICAL,
        buildBlocking: true,
        enabled: true,
        filePath: 'test/health.test.ts',
        testFunction: 'healthTest',
        environment: TestEnvironment.LOCAL
      });

      const report = manager.generateHealthReport();

      expect(report.statistics.healthScore).toBeDefined();
    });
  });
});
