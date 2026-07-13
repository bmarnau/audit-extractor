import { IssueService } from '../src/application/IssueService';
import { JsonIssueRepository } from '../src/infrastructure/persistence/JsonIssueRepository';
import { IssueFactory } from '../src/domain/issue/IssueFactory';
import { Severity, IssueStatus } from '../src/domain/issue';
import path from 'path';
import fs from 'fs/promises';

describe('Issue Management System - Integration Tests', () => {
  let issueService: IssueService;
  let repository: JsonIssueRepository;
  const testDir = path.join(__dirname, '../test-integration');

  beforeAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore
    }
    await fs.mkdir(testDir, { recursive: true });
  });

  beforeEach(async () => {
    repository = new JsonIssueRepository(testDir);
    await repository.initialize();
    issueService = new IssueService(repository);
  });

  afterEach(async () => {
    await repository.deleteAll();
  });

  describe('End-to-End Workflow', () => {
    it('should handle complete issue lifecycle', async () => {
      // 1. Create issue from test failure
      const testIssue = await issueService.createFromTestFailure({
        testName: 'shouldCalculateTotal',
        testSuite: 'CalculatorTests',
        errorMessage: 'Expected 10 but got 11',
        failureReason: 'Off-by-one error',
        buildVersion: '1.0.0',
        component: 'Calculator',
        detectedBy: 'Jest'
      });

      expect(testIssue.getStatus()).toBe(IssueStatus.OPEN);
      expect(testIssue.getSeverity()).toBe(Severity.HIGH);

      // 2. Retrieve and verify
      const retrieved = await issueService.getIssueById(testIssue.getIssueId().getValue());
      expect(retrieved).not.toBeNull();

      // 3. Start working on it
      const inProgress = await issueService.startResolvingIssue(testIssue.getIssueId().getValue());
      expect(inProgress?.getStatus()).toBe(IssueStatus.IN_PROGRESS);

      // 4. Update recommendation
      const updated = await issueService.updateIssueRecommendation(
        testIssue.getIssueId().getValue(),
        'Fixed off-by-one error in calculation logic'
      );
      expect(updated?.getRecommendation()).toContain('off-by-one');

      // 5. Resolve it
      const resolved = await issueService.resolveIssue(testIssue.getIssueId().getValue());
      expect(resolved?.isResolved()).toBe(true);

      // 6. Close it
      const closed = await issueService.closeIssue(testIssue.getIssueId().getValue());
      expect(closed?.getStatus()).toBe(IssueStatus.CLOSED);
    });

    it('should handle multiple issues and filtering', async () => {
      // Create issues from different sources
      const testIssue = await issueService.createFromTestFailure({
        testName: 'test1',
        testSuite: 'Suite1',
        errorMessage: 'Error',
        failureReason: 'Failure',
        buildVersion: '1.0.0',
        component: 'Component1',
        detectedBy: 'Jest'
      });

      const apiIssue = await issueService.createFromApiTestFailure({
        endpoint: '/api/users',
        method: 'GET',
        expectedStatus: 200,
        actualStatus: 500,
        responseBody: 'Error',
        buildVersion: '1.0.0',
        detectedBy: 'Postman'
      });

      const perfIssue = await issueService.createFromPerformanceFailure({
        testName: 'loadTime',
        expectedDuration: 1000,
        actualDuration: 2000,
        unit: 'ms',
        buildVersion: '1.0.0',
        detectedBy: 'Lighthouse',
        component: 'Frontend'
      });

      // Verify total count
      const total = await issueService.getTotalIssueCount();
      expect(total).toBe(3);

      // Filter by category
      const testIssues = await issueService.getIssuesByCategory('TEST_FAILURE');
      expect(testIssues).toHaveLength(1);

      // Filter by severity
      const criticalIssues = await issueService.getCriticalIssues();
      expect(criticalIssues.length).toBeGreaterThan(0);

      // Get statistics
      const stats = await issueService.getStatistics();
      expect(stats.total).toBe(3);
      expect(stats.byCategory['TEST_FAILURE']).toBe(1);
      expect(stats.byCategory['API_TEST_FAILURE']).toBe(1);
      expect(stats.byCategory['PERFORMANCE']).toBe(1);
    });

    it('should persist and reload data', async () => {
      // Create some issues
      const issue1 = await issueService.createIssue({
        title: 'Critical Bug',
        description: 'System crash on startup',
        category: 'BUG',
        component: 'Core',
        severity: Severity.CRITICAL,
        rootCause: 'Null pointer exception',
        recommendation: 'Add null checks',
        consequenceIfResolved: 'System starts normally',
        consequenceIfIgnored: 'System crashes',
        detectedBy: 'QA',
        buildVersion: '1.0.0'
      });

      const issue2 = await issueService.createIssue({
        title: 'Performance Issue',
        description: 'Slow database queries',
        category: 'PERFORMANCE',
        component: 'Database',
        severity: Severity.HIGH,
        rootCause: 'Missing index',
        recommendation: 'Add database index',
        consequenceIfResolved: 'Queries run faster',
        consequenceIfIgnored: 'Application becomes slow',
        detectedBy: 'LoadTest',
        buildVersion: '1.0.0'
      });

      // Update some status
      await issueService.startResolvingIssue(issue1.getIssueId().getValue());
      await issueService.resolveIssue(issue2.getIssueId().getValue());

      // Create new service with same repository
      const repo2 = new JsonIssueRepository(testDir);
      await repo2.initialize();
      const service2 = new IssueService(repo2);

      // Verify data persisted
      const allIssues = await service2.getAllIssues();
      expect(allIssues).toHaveLength(2);

      // Check statuses were preserved
      const reloaded1 = await service2.getIssueById(issue1.getIssueId().getValue());
      expect(reloaded1?.getStatus()).toBe(IssueStatus.IN_PROGRESS);

      const reloaded2 = await service2.getIssueById(issue2.getIssueId().getValue());
      expect(reloaded2?.isResolved()).toBe(true);
    });

    it('should export and reimport issues', async () => {
      // Create issues
      const issues = [];
      for (let i = 0; i < 3; i++) {
        const issue = await issueService.createIssue({
          title: `Issue ${i}`,
          description: `Description ${i}`,
          category: 'TEST',
          component: `Component${i}`,
          severity: [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM][i],
          rootCause: `Cause ${i}`,
          recommendation: `Recommendation ${i}`,
          consequenceIfResolved: 'Resolved',
          consequenceIfIgnored: 'Ignored',
          detectedBy: 'Tester',
          buildVersion: '1.0.0'
        });
        issues.push(issue);
      }

      // Export
      const exported = await issueService.exportAllIssuesAsJson();
      expect(exported).toHaveLength(3);

      // Clear and reimport
      await repository.deleteAll();
      const reimported = await issueService.importIssues(exported);
      expect(reimported).toHaveLength(3);

      // Verify all data
      const reloaded = await issueService.getAllIssues();
      expect(reloaded.map(i => i.getTitle()).sort()).toEqual(
        ['Issue 0', 'Issue 1', 'Issue 2'].sort()
      );
    });
  });

  describe('Multi-Source Issue Aggregation', () => {
    it('should aggregate issues from different test sources', async () => {
      // Simulating test results from different frameworks
      const sources = [
        // Jest test results
        await issueService.createFromTestFailure({
          testName: 'mathTest',
          testSuite: 'MathSuite',
          errorMessage: 'Assertion failed',
          failureReason: 'Logic error',
          buildVersion: '1.0.0',
          component: 'Math',
          detectedBy: 'Jest'
        }),
        // API test results
        await issueService.createFromApiTestFailure({
          endpoint: '/api/data',
          method: 'POST',
          expectedStatus: 201,
          actualStatus: 500,
          responseBody: 'Server error',
          buildVersion: '1.0.0',
          detectedBy: 'RestAssured'
        }),
        // Performance test results
        await issueService.createFromPerformanceFailure({
          testName: 'memoryUsage',
          expectedDuration: 512,
          actualDuration: 1024,
          unit: 'MB',
          buildVersion: '1.0.0',
          detectedBy: 'JMeter',
          component: 'Backend'
        }),
        // Lint results
        await issueService.createFromLintError({
          filePath: 'src/util.ts',
          lineNumber: 15,
          rule: 'no-console',
          message: 'console.log not allowed',
          buildVersion: '1.0.0',
          detectedBy: 'ESLint'
        })
      ];

      expect(sources).toHaveLength(4);

      // Get summary statistics
      const summary = await issueService.getSummary();
      expect(summary.totalIssues).toBe(4);
      expect(summary.statistics.byCategory['TEST_FAILURE']).toBe(1);
      expect(summary.statistics.byCategory['API_TEST_FAILURE']).toBe(1);
      expect(summary.statistics.byCategory['PERFORMANCE']).toBe(1);
      expect(summary.statistics.byCategory['LINT_ERROR']).toBe(1);
    });
  });

  describe('Priority Management', () => {
    it('should identify and prioritize critical issues', async () => {
      // Create mixed severity issues
      await issueService.createIssue({
        title: 'Low Priority Task',
        description: 'Nice to have',
        category: 'ENHANCEMENT',
        component: 'UI',
        severity: Severity.LOW,
        rootCause: 'Enhancement request',
        recommendation: 'Consider for future release',
        consequenceIfResolved: 'Better UI',
        consequenceIfIgnored: 'No impact',
        detectedBy: 'User',
        buildVersion: '1.0.0'
      });

      await issueService.createIssue({
        title: 'Critical Production Bug',
        description: 'Data loss in production',
        category: 'BUG',
        component: 'Database',
        severity: Severity.CRITICAL,
        rootCause: 'Transaction failure',
        recommendation: 'Implement retry logic',
        consequenceIfResolved: 'Data preserved',
        consequenceIfIgnored: 'Customer data lost',
        detectedBy: 'Monitoring',
        buildVersion: '1.0.0'
      });

      await issueService.createIssue({
        title: 'High Priority Issue',
        description: 'Feature not working',
        category: 'BUG',
        component: 'API',
        severity: Severity.HIGH,
        rootCause: 'Code error',
        recommendation: 'Fix code',
        consequenceIfResolved: 'Feature works',
        consequenceIfIgnored: 'Feature broken',
        detectedBy: 'Testing',
        buildVersion: '1.0.0'
      });

      // Get high priority issues
      const highPriority = await issueService.getHighPriorityIssues();
      expect(highPriority.length).toBe(2);

      // All should be HIGH or CRITICAL
      highPriority.forEach(issue => {
        expect(issue.isHighPriority()).toBe(true);
      });

      // Get critical issues
      const critical = await issueService.getCriticalIssues();
      expect(critical).toHaveLength(1);
      expect(critical[0].getTitle()).toContain('Critical Production Bug');
    });
  });

  describe('Date Range Queries', () => {
    it('should query issues by date range', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      // Create issues (all with current timestamp)
      await issueService.createIssue({
        title: 'Recent Issue',
        description: 'Just created',
        category: 'BUG',
        component: 'Test',
        severity: Severity.MEDIUM,
        rootCause: 'Test',
        recommendation: 'Test',
        consequenceIfResolved: 'Test',
        consequenceIfIgnored: 'Test',
        detectedBy: 'Test',
        buildVersion: '1.0.0',
        timestamp: now
      });

      // Query recent issues
      const recent = await issueService.getIssuesByDateRange(oneHourAgo, oneHourLater);
      expect(recent.length).toBeGreaterThan(0);

      // Query old issues (should be empty)
      const old = await issueService.getIssuesByDateRange(
        new Date(now.getTime() - 24 * 60 * 60 * 1000),
        new Date(now.getTime() - 12 * 60 * 60 * 1000)
      );
      expect(old).toHaveLength(0);
    });
  });

  describe('Component Health Dashboard', () => {
    it('should provide component health metrics', async () => {
      const components = ['Frontend', 'Backend', 'Database'];

      for (const component of components) {
        for (let i = 0; i < 3; i++) {
          await issueService.createIssue({
            title: `Issue for ${component}`,
            description: `Issue ${i}`,
            category: 'BUG',
            component,
            severity: [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM][i],
            rootCause: 'Test',
            recommendation: 'Test',
            consequenceIfResolved: 'Test',
            consequenceIfIgnored: 'Test',
            detectedBy: 'Test',
            buildVersion: '1.0.0'
          });
        }
      }

      // Get health for each component
      for (const component of components) {
        const stats = await issueService.getComponentStatistics(component);
        expect(stats.component).toBe(component);
        expect(stats.totalIssues).toBe(3);
        expect(stats.criticalCount).toBe(1);
        expect(stats.highCount).toBe(1);
        expect(stats.mediumCount).toBe(1);
      }
    });
  });
});
