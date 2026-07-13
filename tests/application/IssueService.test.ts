import { IssueService } from '../src/application/IssueService';
import { JsonIssueRepository } from '../src/infrastructure/persistence/JsonIssueRepository';
import { IssueFactory } from '../src/domain/issue/IssueFactory';
import { IssueStatus, Severity } from '../src/domain/issue';
import path from 'path';
import fs from 'fs/promises';

describe('IssueService - Application Layer', () => {
  let issueService: IssueService;
  let repository: JsonIssueRepository;
  const testDir = path.join(__dirname, '../test-issues');

  beforeAll(async () => {
    // Cleanup test directory
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

  describe('issue creation', () => {
    it('should create new issue', async () => {
      const issue = await issueService.createIssue({
        title: 'Test Issue',
        description: 'Test Description',
        category: 'TEST',
        component: 'TestComponent',
        severity: Severity.MEDIUM,
        rootCause: 'Test cause',
        recommendation: 'Test recommendation',
        consequenceIfResolved: 'Will work',
        consequenceIfIgnored: 'Will break',
        detectedBy: 'TestRunner',
        buildVersion: '1.0.0'
      });

      expect(issue.getTitle()).toBe('Test Issue');
      expect(issue.getIssueId().getValue()).toBeDefined();
    });

    it('should create issue from test failure', async () => {
      const issue = await issueService.createFromTestFailure({
        testName: 'shouldWork',
        testSuite: 'TestSuite',
        errorMessage: 'Error message',
        failureReason: 'Failure reason',
        buildVersion: '1.0.0',
        component: 'TestComponent',
        detectedBy: 'Jest'
      });

      expect(issue.getCategory()).toBe('TEST_FAILURE');
      expect(issue.getSeverity()).toBe(Severity.HIGH);
    });

    it('should create issue from API test failure', async () => {
      const issue = await issueService.createFromApiTestFailure({
        endpoint: '/api/test',
        method: 'GET',
        expectedStatus: 200,
        actualStatus: 500,
        responseBody: 'Error',
        buildVersion: '1.0.0',
        detectedBy: 'Postman'
      });

      expect(issue.getCategory()).toBe('API_TEST_FAILURE');
    });

    it('should create issue from performance failure', async () => {
      const issue = await issueService.createFromPerformanceFailure({
        testName: 'loadTime',
        expectedDuration: 1000,
        actualDuration: 2000,
        unit: 'ms',
        buildVersion: '1.0.0',
        detectedBy: 'Lighthouse',
        component: 'Frontend'
      });

      expect(issue.getCategory()).toBe('PERFORMANCE');
    });

    it('should create issue from lint error', async () => {
      const issue = await issueService.createFromLintError({
        filePath: 'src/file.ts',
        lineNumber: 10,
        rule: 'no-unused-vars',
        message: 'Unused variable',
        buildVersion: '1.0.0',
        detectedBy: 'ESLint'
      });

      expect(issue.getCategory()).toBe('LINT_ERROR');
    });

    it('should create issue from validation failure', async () => {
      const issue = await issueService.createFromValidationFailure({
        fieldName: 'email',
        validationRule: 'must be email',
        actualValue: 'invalid',
        component: 'Auth',
        buildVersion: '1.0.0',
        detectedBy: 'ValidationEngine'
      });

      expect(issue.getCategory()).toBe('VALIDATION_ERROR');
    });

    it('should create issue from integration failure', async () => {
      const issue = await issueService.createFromIntegrationFailure({
        serviceName: 'PaymentGateway',
        operation: 'process',
        errorCode: 'AUTH_FAILED',
        errorMessage: 'Auth failed',
        buildVersion: '1.0.0',
        detectedBy: 'IntegrationTest'
      });

      expect(issue.getCategory()).toBe('INTEGRATION_ERROR');
      expect(issue.getSeverity()).toBe(Severity.CRITICAL);
    });
  });

  describe('issue retrieval', () => {
    beforeEach(async () => {
      await issueService.createIssue({
        title: 'Issue 1',
        description: 'Description 1',
        category: 'TEST',
        component: 'Component1',
        severity: Severity.CRITICAL,
        rootCause: 'Cause 1',
        recommendation: 'Recommendation 1',
        consequenceIfResolved: 'Resolved',
        consequenceIfIgnored: 'Ignored',
        detectedBy: 'Tester1',
        buildVersion: '1.0.0'
      });

      await issueService.createIssue({
        title: 'Issue 2',
        description: 'Description 2',
        category: 'BUG',
        component: 'Component2',
        severity: Severity.HIGH,
        rootCause: 'Cause 2',
        recommendation: 'Recommendation 2',
        consequenceIfResolved: 'Resolved',
        consequenceIfIgnored: 'Ignored',
        detectedBy: 'Tester2',
        buildVersion: '2.0.0'
      });
    });

    it('should get all issues', async () => {
      const issues = await issueService.getAllIssues();
      expect(issues).toHaveLength(2);
    });

    it('should get issues by severity', async () => {
      const criticalIssues = await issueService.getIssuesBySeverity(Severity.CRITICAL);
      expect(criticalIssues).toHaveLength(1);
      expect(criticalIssues[0].getTitle()).toBe('Issue 1');
    });

    it('should get critical issues', async () => {
      const criticalIssues = await issueService.getCriticalIssues();
      expect(criticalIssues.length).toBeGreaterThan(0);
    });

    it('should get high priority issues', async () => {
      const highPriority = await issueService.getHighPriorityIssues();
      expect(highPriority.length).toBeGreaterThan(0);
    });

    it('should get issues by component', async () => {
      const issues = await issueService.getIssuesByComponent('Component1');
      expect(issues).toHaveLength(1);
    });

    it('should get issues by category', async () => {
      const issues = await issueService.getIssuesByCategory('TEST');
      expect(issues).toHaveLength(1);
    });

    it('should get open issues', async () => {
      const openIssues = await issueService.getOpenIssues();
      expect(openIssues.length).toBeGreaterThan(0);
    });

    it('should get issues by build version', async () => {
      const issues = await issueService.getIssuesByBuildVersion('1.0.0');
      expect(issues).toHaveLength(1);
    });

    it('should search issues by title', async () => {
      const results = await issueService.searchIssuesByTitle('Issue');
      expect(results).toHaveLength(2);

      const singleResult = await issueService.searchIssuesByTitle('Issue 1');
      expect(singleResult).toHaveLength(1);
    });
  });

  describe('issue status management', () => {
    let issueId: string;

    beforeEach(async () => {
      const issue = await issueService.createIssue({
        title: 'Status Test',
        description: 'Description',
        category: 'TEST',
        component: 'Component',
        severity: Severity.MEDIUM,
        rootCause: 'Cause',
        recommendation: 'Recommendation',
        consequenceIfResolved: 'Resolved',
        consequenceIfIgnored: 'Ignored',
        detectedBy: 'Tester',
        buildVersion: '1.0.0'
      });
      issueId = issue.getIssueId().getValue();
    });

    it('should update issue status', async () => {
      const updated = await issueService.updateIssueStatus(issueId, IssueStatus.IN_PROGRESS);
      expect(updated?.getStatus()).toBe(IssueStatus.IN_PROGRESS);
    });

    it('should resolve issue', async () => {
      const resolved = await issueService.resolveIssue(issueId);
      expect(resolved?.isResolved()).toBe(true);
    });

    it('should close issue', async () => {
      const closed = await issueService.closeIssue(issueId);
      expect(closed?.getStatus()).toBe(IssueStatus.CLOSED);
    });

    it('should start resolving issue', async () => {
      const inProgress = await issueService.startResolvingIssue(issueId);
      expect(inProgress?.getStatus()).toBe(IssueStatus.IN_PROGRESS);
    });

    it('should archive issue', async () => {
      const archived = await issueService.archiveIssue(issueId);
      expect(archived?.getStatus()).toBe(IssueStatus.ARCHIVED);
    });
  });

  describe('issue updates', () => {
    let issueId: string;

    beforeEach(async () => {
      const issue = await issueService.createIssue({
        title: 'Update Test',
        description: 'Description',
        category: 'TEST',
        component: 'Component',
        severity: Severity.MEDIUM,
        rootCause: 'Cause',
        recommendation: 'Old Recommendation',
        consequenceIfResolved: 'Resolved',
        consequenceIfIgnored: 'Ignored',
        detectedBy: 'Tester',
        buildVersion: '1.0.0'
      });
      issueId = issue.getIssueId().getValue();
    });

    it('should update recommendation', async () => {
      const updated = await issueService.updateIssueRecommendation(
        issueId,
        'New Recommendation'
      );
      expect(updated?.getRecommendation()).toBe('New Recommendation');
    });

    it('should update severity', async () => {
      const updated = await issueService.updateIssueSeverity(issueId, Severity.CRITICAL);
      expect(updated?.getSeverity()).toBe(Severity.CRITICAL);
    });

    it('should not update severity for non-open issue', async () => {
      await issueService.resolveIssue(issueId);
      expect(
        issueService.updateIssueSeverity(issueId, Severity.HIGH)
      ).rejects.toThrow();
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      for (let i = 0; i < 3; i++) {
        await issueService.createIssue({
          title: `Issue ${i}`,
          description: 'Description',
          category: 'TEST',
          component: 'Component1',
          severity: [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM][i],
          rootCause: 'Cause',
          recommendation: 'Recommendation',
          consequenceIfResolved: 'Resolved',
          consequenceIfIgnored: 'Ignored',
          detectedBy: 'Tester',
          buildVersion: '1.0.0'
        });
      }
    });

    it('should get statistics', async () => {
      const stats = await issueService.getStatistics();
      expect(stats.total).toBe(3);
      expect(stats.bySeverity.CRITICAL).toBe(1);
      expect(stats.bySeverity.HIGH).toBe(1);
      expect(stats.bySeverity.MEDIUM).toBe(1);
    });

    it('should get component statistics', async () => {
      const stats = await issueService.getComponentStatistics('Component1');
      expect(stats.component).toBe('Component1');
      expect(stats.totalIssues).toBe(3);
      expect(stats.recentIssues.length).toBeLessThanOrEqual(5);
    });

    it('should get summary', async () => {
      const summary = await issueService.getSummary();
      expect(summary.totalIssues).toBe(3);
      expect(summary.criticalCount).toBe(1);
      expect(summary.urgentAction).toBe(true);
    });
  });

  describe('batch operations', () => {
    it('should import multiple issues', async () => {
      const issuesData = [
        {
          title: 'Issue 1',
          description: 'Description 1',
          category: 'TEST',
          component: 'Component1',
          severity: Severity.MEDIUM,
          rootCause: 'Cause 1',
          recommendation: 'Recommendation 1',
          consequenceIfResolved: 'Resolved',
          consequenceIfIgnored: 'Ignored',
          detectedBy: 'Tester1',
          buildVersion: '1.0.0'
        },
        {
          title: 'Issue 2',
          description: 'Description 2',
          category: 'BUG',
          component: 'Component2',
          severity: Severity.HIGH,
          rootCause: 'Cause 2',
          recommendation: 'Recommendation 2',
          consequenceIfResolved: 'Resolved',
          consequenceIfIgnored: 'Ignored',
          detectedBy: 'Tester2',
          buildVersion: '2.0.0'
        }
      ];

      const imported = await issueService.importIssues(issuesData);
      expect(imported).toHaveLength(2);
    });

    it('should export all issues as JSON', async () => {
      await issueService.createIssue({
        title: 'Export Test',
        description: 'Description',
        category: 'TEST',
        component: 'Component',
        severity: Severity.MEDIUM,
        rootCause: 'Cause',
        recommendation: 'Recommendation',
        consequenceIfResolved: 'Resolved',
        consequenceIfIgnored: 'Ignored',
        detectedBy: 'Tester',
        buildVersion: '1.0.0'
      });

      const exported = await issueService.exportAllIssuesAsJson();
      expect(exported.length).toBeGreaterThan(0);
      expect(exported[0].title).toBe('Export Test');
    });
  });

  describe('issue existence checks', () => {
    let issueId: string;

    beforeEach(async () => {
      const issue = await issueService.createIssue({
        title: 'Existence Test',
        description: 'Description',
        category: 'TEST',
        component: 'Component',
        severity: Severity.MEDIUM,
        rootCause: 'Cause',
        recommendation: 'Recommendation',
        consequenceIfResolved: 'Resolved',
        consequenceIfIgnored: 'Ignored',
        detectedBy: 'Tester',
        buildVersion: '1.0.0'
      });
      issueId = issue.getIssueId().getValue();
    });

    it('should check if issue exists', async () => {
      const exists = await issueService.issueExists(issueId);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent issue', async () => {
      const exists = await issueService.issueExists('non-existent-id');
      expect(exists).toBe(false);
    });

    it('should get total issue count', async () => {
      const count = await issueService.getTotalIssueCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('issue deletion', () => {
    it('should delete issue', async () => {
      const issue = await issueService.createIssue({
        title: 'Delete Test',
        description: 'Description',
        category: 'TEST',
        component: 'Component',
        severity: Severity.MEDIUM,
        rootCause: 'Cause',
        recommendation: 'Recommendation',
        consequenceIfResolved: 'Resolved',
        consequenceIfIgnored: 'Ignored',
        detectedBy: 'Tester',
        buildVersion: '1.0.0'
      });

      const issueId = issue.getIssueId().getValue();
      await issueService.deleteIssue(issueId);

      const deleted = await issueService.getIssueById(issueId);
      expect(deleted).toBeNull();
    });
  });
});
