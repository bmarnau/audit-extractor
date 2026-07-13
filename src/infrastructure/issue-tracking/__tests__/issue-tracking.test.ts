/**
 * ISSUE TRACKING SYSTEM - COMPREHENSIVE TESTS
 * 
 * Tests for IssueRepositoryService, IssueManagerService,
 * and GovernanceIssueIntegrator
 */

import { IssueRepositoryService } from '../services/issue-repository.service';
import { IssueManagerService } from '../services/issue-manager.service';
import { GovernanceIssueIntegrator } from '../services/governance-issue.integrator';
import {
  Issue,
  IssueCategory,
  IssuePriority,
  IssueStatus,
  ImpactArea,
} from '../types/issue.types';
import { SeverityLevel } from '../../governance/types/severity.types';

describe('Issue Tracking System', () => {
  let repository: IssueRepositoryService;
  let manager: IssueManagerService;

  beforeEach(() => {
    repository = new IssueRepositoryService();
    manager = new IssueManagerService(repository);
  });

  describe('IssueRepositoryService', () => {
    it('should create and retrieve issues', () => {
      const issue: Issue = {
        issueId: 'ISS-TEST-001',
        category: IssueCategory.TEST_FAILURE,
        priority: IssuePriority.HIGH,
        severity: SeverityLevel.HIGH,
        status: IssueStatus.OPEN,
        title: 'Test Issue',
        description: 'This is a test issue',
        rootCause: 'LOGIC_ERROR',
        impactAreas: [ImpactArea.BUILD_PIPELINE],
        affectedComponents: ['testing'],
        consequenceIfNotFixed: 'Tests will fail',
        recommendedAction: 'Fix the test',
        buildVersion: '1.0.0',
        detectionMethod: 'AUTOMATED_TEST',
        discoveredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      repository.createIssue(issue);
      const retrieved = repository.getIssue('ISS-TEST-001');

      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('Test Issue');
      expect(retrieved?.priority).toBe(IssuePriority.HIGH);
    });

    it('should filter issues by status', () => {
      const openIssue: Issue = {
        issueId: 'ISS-FILTER-001',
        category: IssueCategory.TEST_FAILURE,
        priority: IssuePriority.HIGH,
        severity: SeverityLevel.HIGH,
        status: IssueStatus.OPEN,
        title: 'Open Issue',
        description: 'Open',
        rootCause: 'LOGIC_ERROR',
        impactAreas: [ImpactArea.BUILD_PIPELINE],
        affectedComponents: ['test'],
        consequenceIfNotFixed: 'Tests fail',
        recommendedAction: 'Fix it',
        buildVersion: '1.0.0',
        detectionMethod: 'AUTOMATED_TEST',
        discoveredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const closedIssue: Issue = {
        ...openIssue,
        issueId: 'ISS-FILTER-002',
        title: 'Closed Issue',
        status: IssueStatus.CLOSED,
      };

      repository.createIssue(openIssue);
      repository.createIssue(closedIssue);

      const openIssues = repository.filterIssues({ statuses: [IssueStatus.OPEN] });

      expect(openIssues).toHaveLength(1);
      expect(openIssues[0].issueId).toBe('ISS-FILTER-001');
    });

    it('should filter issues by priority', () => {
      const criticalIssue: Issue = {
        issueId: 'ISS-CRIT-001',
        category: IssueCategory.TEST_FAILURE,
        priority: IssuePriority.CRITICAL,
        severity: SeverityLevel.CRITICAL,
        status: IssueStatus.OPEN,
        title: 'Critical',
        description: 'Critical issue',
        rootCause: 'LOGIC_ERROR',
        impactAreas: [ImpactArea.CORE_FUNCTIONALITY],
        affectedComponents: ['core'],
        consequenceIfNotFixed: 'System fails',
        recommendedAction: 'Fix immediately',
        buildVersion: '1.0.0',
        detectionMethod: 'AUTOMATED_TEST',
        discoveredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const lowIssue: Issue = {
        ...criticalIssue,
        issueId: 'ISS-LOW-001',
        priority: IssuePriority.LOW,
        severity: SeverityLevel.LOW,
      };

      repository.createIssue(criticalIssue);
      repository.createIssue(lowIssue);

      const criticals = repository.filterIssues({ priorities: [IssuePriority.CRITICAL] });

      expect(criticals).toHaveLength(1);
      expect(criticals[0].priority).toBe(IssuePriority.CRITICAL);
    });

    it('should calculate summary statistics', () => {
      for (let i = 0; i < 5; i++) {
        repository.createIssue({
          issueId: `ISS-SUMMARY-${i}`,
          category: IssueCategory.TEST_FAILURE,
          priority: IssuePriority.HIGH,
          severity: SeverityLevel.HIGH,
          status: i < 3 ? IssueStatus.OPEN : IssueStatus.CLOSED,
          title: `Issue ${i}`,
          description: 'Test',
          rootCause: 'LOGIC_ERROR',
          impactAreas: [ImpactArea.BUILD_PIPELINE],
          affectedComponents: ['test'],
          consequenceIfNotFixed: 'Fails',
          recommendedAction: 'Fix',
          buildVersion: '1.0.0',
          detectionMethod: 'AUTOMATED_TEST',
          discoveredAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      }

      const summary = repository.calculateSummary();

      expect(summary.totalIssues).toBe(5);
      expect(summary.openCount).toBe(3);
      expect(summary.byStatus[IssueStatus.OPEN]).toBe(3);
      expect(summary.byStatus[IssueStatus.CLOSED]).toBe(2);
    });

    it('should update issue status', () => {
      const issue: Issue = {
        issueId: 'ISS-UPDATE-001',
        category: IssueCategory.TEST_FAILURE,
        priority: IssuePriority.MEDIUM,
        severity: SeverityLevel.MEDIUM,
        status: IssueStatus.OPEN,
        title: 'Issue to Update',
        description: 'Update me',
        rootCause: 'LOGIC_ERROR',
        impactAreas: [ImpactArea.BUILD_PIPELINE],
        affectedComponents: ['test'],
        consequenceIfNotFixed: 'Fails',
        recommendedAction: 'Fix',
        buildVersion: '1.0.0',
        detectionMethod: 'AUTOMATED_TEST',
        discoveredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      repository.createIssue(issue);
      const updated = repository.updateIssue('ISS-UPDATE-001', { status: IssueStatus.CLOSED });

      expect(updated.status).toBe(IssueStatus.CLOSED);
      expect(updated.updatedAt).toBeDefined();
    });

    it('should delete issues', () => {
      const issue: Issue = {
        issueId: 'ISS-DELETE-001',
        category: IssueCategory.TEST_FAILURE,
        priority: IssuePriority.LOW,
        severity: SeverityLevel.LOW,
        status: IssueStatus.OPEN,
        title: 'Delete me',
        description: 'To be deleted',
        rootCause: 'LOGIC_ERROR',
        impactAreas: [ImpactArea.BUILD_PIPELINE],
        affectedComponents: ['test'],
        consequenceIfNotFixed: 'Fails',
        recommendedAction: 'Fix',
        buildVersion: '1.0.0',
        detectionMethod: 'AUTOMATED_TEST',
        discoveredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      repository.createIssue(issue);
      expect(repository.getAllIssues()).toHaveLength(1);

      repository.deleteIssue('ISS-DELETE-001');
      expect(repository.getAllIssues()).toHaveLength(0);
    });
  });

  describe('IssueManagerService', () => {
    it('should create issue from test failure', () => {
      const issue = manager.createFromTestFailure(
        'should extract data',
        'src/extraction/extraction.test.ts',
        'Expected true, got false',
        'at line 42',
        '1.0.0',
        IssueCategory.TEST_FAILURE,
        'extraction-engine',
        SeverityLevel.HIGH
      );

      expect(issue).toBeDefined();
      expect(issue.title).toContain('Test Failure');
      expect(issue.category).toBe(IssueCategory.TEST_FAILURE);
      expect(issue.severity).toBe(SeverityLevel.HIGH);
      expect(issue.buildVersion).toBe('1.0.0');
    });

    it('should create issue from coverage gap', () => {
      const issue = manager.createFromCoverageGap(
        'extraction-engine',
        150,
        80,
        65,
        '1.0.0'
      );

      expect(issue.category).toBe(IssueCategory.COVERAGE_GAP);
      expect(issue.severity).toBe(SeverityLevel.HIGH);
      expect(issue.priority).toBe(IssuePriority.HIGH);
      expect(issue.description).toContain('65');
    });

    it('should create issue from performance problem', () => {
      const issue = manager.createFromPerformance(
        'extraction-engine',
        'execution time',
        5000,
        8000,
        '1.0.0'
      );

      expect(issue.category).toBe(IssueCategory.PERFORMANCE_DEGRADATION);
      expect(issue.title).toContain('Performance');
      expect(issue.impactAreas).toContain(ImpactArea.PERFORMANCE);
    });

    it('should create issue from regression', () => {
      const issue = manager.createFromRegression(
        'should validate input',
        '0.25.0',
        '0.26.0',
        'Test failed in new version'
      );

      expect(issue.category).toBe(IssueCategory.TEST_REGRESSION);
      expect(issue.priority).toBe(IssuePriority.CRITICAL);
      expect(issue.severity).toBe(SeverityLevel.CRITICAL);
    });

    it('should assign issue to team member', () => {
      const created = manager.createFromTestFailure(
        'test',
        'test.ts',
        'error',
        '',
        '1.0.0'
      );

      const assigned = manager.assignIssue(created.issueId, 'john.doe@example.com');

      expect(assigned.assignedTo).toBe('john.doe@example.com');
      expect(assigned.status).toBe(IssueStatus.ACKNOWLEDGED);
    });

    it('should resolve issue', () => {
      const created = manager.createFromTestFailure(
        'test',
        'test.ts',
        'error',
        '',
        '1.0.0'
      );

      const resolved = manager.resolveIssue(
        created.issueId,
        'Fixed the bug',
        'unit test passed',
        'abc123'
      );

      expect(resolved.status).toBe(IssueStatus.RESOLVED);
      expect(resolved.resolution).toBeDefined();
      expect(resolved.resolution?.resolutionType).toBe('FIXED');
    });

    it('should mark issue as wont-fix', () => {
      const created = manager.createFromTestFailure(
        'test',
        'test.ts',
        'error',
        '',
        '1.0.0'
      );

      const wontFix = manager.markAsWontFix(created.issueId, 'Deprecated feature');

      expect(wontFix.status).toBe(IssueStatus.WONT_FIX);
    });

    it('should identify release blockers', () => {
      manager.createFromTestFailure(
        'test1',
        'test.ts',
        'error',
        '',
        '1.0.0',
        IssueCategory.TEST_FAILURE,
        'test',
        SeverityLevel.CRITICAL
      );

      manager.createFromTestFailure(
        'test2',
        'test.ts',
        'error',
        '',
        '1.0.0',
        IssueCategory.TEST_FAILURE,
        'test',
        SeverityLevel.LOW
      );

      const blockers = manager.getReleaseBlocers('1.0.0');

      expect(blockers.length).toBeGreaterThan(0);
      expect(blockers[0].priority).toBe(IssuePriority.CRITICAL);
    });

    it('should generate issue report', () => {
      manager.createFromTestFailure(
        'test1',
        'test.ts',
        'error1',
        '',
        '1.0.0'
      );

      manager.createFromCoverageGap('component', 50, 80, 70, '1.0.0');

      const report = manager.generateReport();

      expect(report.totalIssues).toBe(2);
      expect(report.issues.length).toBe(2);
      expect(report.summary).toBeDefined();
    });
  });

  describe('GovernanceIssueIntegrator', () => {
    it('should integrate with governance framework', () => {
      const integrator = new GovernanceIssueIntegrator(manager);

      // Create mock governance report
      const mockReport = {
        reportId: 'GOV-001',
        timestamp: new Date().toISOString(),
        projectVersion: '1.0.0',
        testRunId: 'RUN-001',
        executiveSummary: {
          totalTestsRun: 100,
          passedTests: 95,
          failedTests: 5,
          passRate: 95,
          coveragePercentage: 85,
          qualityScore: 85,
        },
        failures: [
          {
            testName: 'should extract',
            testFile: 'extraction.test.ts',
            error: 'Assertion failed',
            duration: 1000,
            category: 'unit' as const,
            timestamp: new Date().toISOString(),
          },
        ],
        failureAnalysis: {
          failuresByCategory: { unit: 1 },
          failuresByModule: { extraction: 1 },
          commonPatterns: ['ASSERTION'],
          rootCauseAnalysis: {},
        },
        severityAssessment: {
          timestamp: new Date().toISOString(),
          totalIssues: 1,
          byLevel: {
            CRITICAL: 0,
            HIGH: 1,
            MEDIUM: 0,
            LOW: 0,
            INFO: 0,
          },
          criticalIssues: [],
          overallRisk: 'CAUTION' as const,
          assessmentDetails: [],
        },
        recommendations: [],
        riskAnalysis: {
          identifiedRisks: [],
          overallRiskRating: 'MEDIUM' as const,
          riskMatrix: '',
          mitigationPlan: '',
        },
        releaseDecision: {
          canRelease: true,
          releaseBlockers: [],
          warnings: [],
          recommendedActions: [],
          approvalLevel: 'APPROVED' as const,
          reasoning: 'All checks passed',
        },
        compliance: {
          codeStyleCompliance: 100,
          typeScriptStrictness: 100,
          testCoverageCompliance: 85,
          documentationCompleteness: 75,
          preCommitHooksStatus: 'PASSED' as const,
        },
        metrics: {
          executionTime: 45000,
          averageTestDuration: 450,
          slowestTests: [],
          flakynessIndex: 5,
          regressionDetected: false,
        },
        approval: {
          status: 'PENDING' as const,
          approverRole: 'Release Manager',
        },
      };

      const issueIds = integrator.processGovernanceReport(mockReport, '1.0.0');

      expect(issueIds.length).toBeGreaterThan(0);

      const releaseCheck = integrator.checkReleaseBlocked('1.0.0');
      expect(releaseCheck).toBeDefined();
    });

    it('should generate release approval report', () => {
      const integrator = new GovernanceIssueIntegrator(manager);

      manager.createFromTestFailure(
        'test',
        'test.ts',
        'error',
        '',
        '1.0.0',
        IssueCategory.TEST_FAILURE,
        'test',
        SeverityLevel.HIGH
      );

      const report = integrator.generateReleaseApprovalReport('1.0.0');

      expect(report).toContain('RELEASE APPROVAL REPORT');
      expect(report).toContain('1.0.0');
    });
  });
});
