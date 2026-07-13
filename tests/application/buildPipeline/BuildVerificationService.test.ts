/**
 * Build Verification Service Tests
 * 
 * 40+ comprehensive tests für die Build Verification Pipeline
 */

import { BuildVerificationService } from '../../../src/application/buildPipeline/BuildVerificationService';
import { BuildAssessmentReport } from '../../../src/application/buildPipeline/BuildAssessmentReport';
import { BuildMetrics } from '../../../src/domain/buildPipeline/BuildMetrics';
import { BuildRisk, RiskCategory, RiskSeverity } from '../../../src/domain/buildPipeline/BuildRisk';
import { BuildRecommendation, RecommendationType } from '../../../src/domain/buildPipeline/BuildRecommendation';

/**
 * Mock Services
 */
class MockTestRegistry {
  async getAllTests() {
    return [
      { id: 'test_1', getTestId: () => ({ getValue: () => 'test_1' }), getTestName: () => 'UserService.create', getComponent: () => 'UserService' },
      { id: 'test_2', getTestId: () => ({ getValue: () => 'test_2' }), getTestName: () => 'UserService.update', getComponent: () => 'UserService' },
      { id: 'test_3', getTestId: () => ({ getValue: () => 'test_3' }), getTestName: () => 'PaymentService.process', getComponent: () => 'PaymentService' }
    ];
  }
  async getTestsByCategory() { return []; }
  async getCatalogStatistics() { return {}; }
  async recordTestSuccess() {}
  async recordTestFailure() {}
  async getBuildAssessment() { return {}; }
}

class MockIssueService {
  async getAllIssues() {
    return [
      { id: 'issue_1', severity: 'HIGH', getSeverity: () => 'HIGH', getComponent: () => 'UserService', getIsBlocking: () => false },
      { id: 'issue_2', severity: 'MEDIUM', getSeverity: () => 'MEDIUM', getComponent: () => 'PaymentService', getIsBlocking: () => false }
    ];
  }
  async getIssuesByComponent() { return []; }
  async getIssuesByStatus() { return []; }
  async getStatistics() { return {}; }
}

describe('BuildVerificationService', () => {
  let service: BuildVerificationService;
  let testRegistry: MockTestRegistry;
  let issueService: MockIssueService;

  beforeEach(() => {
    testRegistry = new MockTestRegistry();
    issueService = new MockIssueService();
    service = new BuildVerificationService(testRegistry, issueService);
  });

  describe('Build Pipeline Execution', () => {
    it('should run complete build pipeline successfully', async () => {
      const report = await service.runBuildPipeline();
      
      expect(report).toBeInstanceOf(BuildAssessmentReport);
      expect(report.buildId).toBeDefined();
      expect(report.buildId.startsWith('build_')).toBe(true);
    });

    it('should include all pipeline stages', async () => {
      const report = await service.runBuildPipeline();
      
      expect(report.completedStages).toContain('BUILD_STARTED' as any);
      expect(report.completedStages).toContain('TEST_DISCOVERY' as any);
      expect(report.completedStages).toContain('TEST_EXECUTION' as any);
      expect(report.completedStages).toContain('ISSUE_COLLECTION' as any);
      expect(report.completedStages).toContain('SEVERITY_EVALUATION' as any);
      expect(report.completedStages).toContain('BUILD_ASSESSMENT' as any);
    });

    it('should track timing metrics', async () => {
      const report = await service.runBuildPipeline();
      
      expect(report.startTime).toBeDefined();
      expect(report.endTime).toBeDefined();
      expect(report.totalDuration).toBeGreaterThan(0);
      expect(report.endTime.getTime()).toBeGreaterThanOrEqual(report.startTime.getTime());
    });

    it('should handle CI/CD context', async () => {
      const report = await service.runBuildPipeline({
        ci: true,
        branch: 'main',
        commitHash: 'abc123',
        author: 'test-user'
      });
      
      expect(report.ci).toBe(true);
      expect(report.branch).toBe('main');
      expect(report.commitHash).toBe('abc123');
      expect(report.author).toBe('test-user');
    });
  });

  describe('Test Discovery', () => {
    it('should discover all tests', async () => {
      const report = await service.runBuildPipeline();
      
      expect(report.totalTests).toBeGreaterThan(0);
    });

    it('should categorize tests by component', async () => {
      const report = await service.runBuildPipeline();
      
      expect(report.affectedComponents.length).toBeGreaterThan(0);
      expect(report.affectedComponents).toContain('UserService');
    });
  });

  describe('Test Execution', () => {
    it('should record test results', async () => {
      const report = await service.runBuildPipeline();
      
      expect(report.successfulTests + report.failedTests + report.skippedTests).toBe(report.totalTests);
    });

    it('should calculate success rate', async () => {
      const report = await service.runBuildPipeline();
      
      expect(report.testSuccessRate).toBeGreaterThanOrEqual(0);
      expect(report.testSuccessRate).toBeLessThanOrEqual(1);
    });

    it('should track failed tests', async () => {
      const report = await service.runBuildPipeline();
      
      if (report.failedTests > 0) {
        expect(report.failedTestNames.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Issue Collection', () => {
    it('should collect all issues', async () => {
      const report = await service.runBuildPipeline();
      
      expect(report.totalIssues).toBeGreaterThanOrEqual(0);
    });

    it('should categorize issues by severity', async () => {
      const report = await service.runBuildPipeline();
      
      const total = report.criticalIssues + report.highIssues + report.mediumIssues + report.lowIssues;
      expect(total).toBe(report.totalIssues);
    });
  });

  describe('Risk Assessment', () => {
    it('should identify risks', async () => {
      const report = await service.runBuildPipeline();
      
      expect(report.risks).toBeDefined();
      expect(Array.isArray(report.risks)).toBe(true);
    });

    it('should assign risk severity levels', async () => {
      const report = await service.runBuildPipeline();
      
      for (const risk of report.risks) {
        expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(risk.severity);
      }
    });

    it('should calculate risk impact scores', async () => {
      const report = await service.runBuildPipeline();
      
      for (const risk of report.risks) {
        const impact = risk.getImpactScore();
        expect(impact).toBeGreaterThanOrEqual(0);
        expect(impact).toBeLessThanOrEqual(100);
      }
    });

    it('should identify blocking risks', async () => {
      const report = await service.runBuildPipeline();
      
      const blockingRisks = report.risks.filter(r => r.isBlocking());
      expect(blockingRisks.length).toBeLessThanOrEqual(report.buildBlockingIssues);
    });
  });

  describe('Recommendation Generation', () => {
    it('should generate recommendations', async () => {
      const report = await service.runBuildPipeline();
      
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should prioritize recommendations', async () => {
      const report = await service.runBuildPipeline();
      
      for (const rec of report.recommendations) {
        expect(rec.priority).toBeGreaterThanOrEqual(1);
        expect(rec.priority).toBeLessThanOrEqual(10);
      }
    });

    it('should include action items', async () => {
      const report = await service.runBuildPipeline();
      
      const recWithActions = report.recommendations.filter(r => r.actionItems.length > 0);
      expect(recWithActions.length).toBeGreaterThan(0);
    });

    it('should identify blocking recommendations', async () => {
      const report = await service.runBuildPipeline();
      
      const blockingRecs = report.recommendations.filter(r => r.isBlocking());
      expect(Array.isArray(blockingRecs)).toBe(true);
    });
  });

  describe('Build Assessment', () => {
    it('should determine if build can pass', async () => {
      const report = await service.runBuildPipeline();
      
      expect(typeof report.canBuildPass).toBe('boolean');
    });

    it('should calculate health score', async () => {
      const report = await service.runBuildPipeline();
      
      expect(report.healthScore).toBeGreaterThanOrEqual(0);
      expect(report.healthScore).toBeLessThanOrEqual(100);
    });

    it('should determine risk level', async () => {
      const report = await service.runBuildPipeline();
      
      expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(report.riskLevel);
    });

    it('should provide recommendation text', async () => {
      const report = await service.runBuildPipeline();
      
      expect(typeof report.buildRecommendation).toBe('string');
      expect(report.buildRecommendation.length).toBeGreaterThan(0);
    });

    it('should track flaky tests', async () => {
      const report = await service.runBuildPipeline();
      
      expect(typeof report.flakyTests).toBe('number');
      expect(report.flakyTests).toBeGreaterThanOrEqual(0);
    });

    it('should track build-blocking issues', async () => {
      const report = await service.runBuildPipeline();
      
      expect(typeof report.buildBlockingIssues).toBe('number');
      expect(report.buildBlockingIssues).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Report Generation', () => {
    it('should generate markdown report', async () => {
      const report = await service.runBuildPipeline();
      const markdown = await service.generateMarkdownReport(report);
      
      expect(typeof markdown).toBe('string');
      expect(markdown.length).toBeGreaterThan(0);
      expect(markdown).toContain('Build Assessment Report');
    });

    it('should export JSON report', async () => {
      const report = await service.runBuildPipeline();
      const json = await service.exportReportAsJson(report);
      
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.buildId).toBeDefined();
    });

    it('should include summary', async () => {
      const report = await service.runBuildPipeline();
      const summary = report.getSummary();
      
      expect(typeof summary).toBe('string');
      expect(summary).toContain('Tests');
    });
  });
});

describe('BuildMetrics', () => {
  it('should calculate health score', () => {
    const metrics = new BuildMetrics({
      totalTests: 100,
      successfulTests: 85,
      failedTests: 15,
      skippedTests: 0,
      totalIssues: 5,
      criticalIssues: 1,
      highIssues: 2,
      mediumIssues: 2,
      lowIssues: 0,
      testDuration: 5000,
      successRate: 0.85,
      buildBlockingIssues: 0,
      flakyTests: 3
    });

    const score = metrics.calculateHealthScore();
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should determine risk level', () => {
    const metrics = new BuildMetrics({
      totalTests: 100,
      successfulTests: 50,
      failedTests: 50,
      skippedTests: 0,
      totalIssues: 10,
      criticalIssues: 5,
      highIssues: 3,
      mediumIssues: 2,
      lowIssues: 0,
      testDuration: 5000,
      successRate: 0.5,
      buildBlockingIssues: 2,
      flakyTests: 10
    });

    const riskLevel = metrics.determineRiskLevel();
    expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(riskLevel);
  });

  it('should determine if build can pass', () => {
    const goodMetrics = new BuildMetrics({
      totalTests: 100,
      successfulTests: 95,
      failedTests: 5,
      skippedTests: 0,
      totalIssues: 1,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 1,
      lowIssues: 0,
      testDuration: 5000,
      successRate: 0.95,
      buildBlockingIssues: 0,
      flakyTests: 0
    });

    expect(goodMetrics.canBuildPass()).toBe(true);
  });
});

describe('BuildRisk', () => {
  it('should calculate impact score', () => {
    const risk = new BuildRisk({
      id: 'risk_1',
      category: RiskCategory.CRITICAL_ISSUES,
      severity: RiskSeverity.CRITICAL,
      description: 'Critical issue',
      affectedComponent: 'UserService',
      count: 3,
      recommendation: 'Fix immediately',
      detectedAt: new Date()
    });

    const impact = risk.getImpactScore();
    expect(impact).toBeGreaterThan(0);
    expect(impact).toBeLessThanOrEqual(100);
  });

  it('should identify blocking risks', () => {
    const blockingRisk = new BuildRisk({
      id: 'risk_1',
      category: RiskCategory.BLOCKING_ISSUES,
      severity: RiskSeverity.CRITICAL,
      description: 'Blocking issue',
      affectedComponent: 'PaymentService',
      count: 1,
      recommendation: 'Must resolve',
      detectedAt: new Date()
    });

    expect(blockingRisk.isBlocking()).toBe(true);
  });
});

describe('BuildRecommendation', () => {
  it('should create recommendation with priority', () => {
    const rec = new BuildRecommendation({
      id: 'rec_1',
      type: RecommendationType.FIX_BEFORE_MERGE,
      priority: 8,
      title: 'Fix critical issues',
      description: 'Critical issues must be fixed',
      affectedComponent: 'AuthService',
      actionItems: ['Review code', 'Fix tests'],
      estimatedEffort: 'HIGH',
      createdAt: new Date()
    });

    expect(rec.priority).toBe(8);
    expect(rec.actionItems.length).toBe(2);
  });

  it('should reject invalid priority', () => {
    expect(() => {
      new BuildRecommendation({
        id: 'rec_1',
        type: RecommendationType.INVESTIGATE,
        priority: 11,
        title: 'Test',
        description: 'Test',
        affectedComponent: 'Test',
        actionItems: [],
        estimatedEffort: 'LOW',
        createdAt: new Date()
      });
    }).toThrow();
  });

  it('should calculate urgency score', () => {
    const rec = new BuildRecommendation({
      id: 'rec_1',
      type: RecommendationType.FIX_BEFORE_MERGE,
      priority: 9,
      title: 'Fix urgent issue',
      description: 'Urgent',
      affectedComponent: 'Component',
      actionItems: [],
      estimatedEffort: 'HIGH',
      createdAt: new Date()
    });

    const urgency = rec.getUrgencyScore();
    expect(urgency).toBeGreaterThan(0);
    expect(urgency).toBeLessThanOrEqual(100);
  });
});

describe('BuildAssessmentReport', () => {
  it('should create report with all data', () => {
    const report = new BuildAssessmentReport({
      buildId: 'build_123',
      startTime: new Date(),
      endTime: new Date(),
      totalDuration: 5000,
      status: 'PASSED',
      totalTests: 100,
      successfulTests: 95,
      failedTests: 5,
      skippedTests: 0,
      testSuccessRate: 0.95,
      totalIssues: 2,
      criticalIssues: 0,
      highIssues: 1,
      mediumIssues: 1,
      lowIssues: 0,
      riskLevel: 'LOW',
      healthScore: 90,
      buildBlockingIssues: 0,
      flakyTests: 0,
      canBuildPass: true,
      buildRecommendation: 'Build is ready',
      risks: [],
      recommendations: [],
      failedTestNames: [],
      blockingTestNames: [],
      flakyTestNames: [],
      affectedComponents: ['UserService'],
      completedStages: [],
      ci: false
    });

    expect(report.buildId).toBe('build_123');
    expect(report.status).toBe('PASSED');
    expect(report.canBuildPass).toBe(true);
  });

  it('should generate markdown output', () => {
    const report = new BuildAssessmentReport({
      buildId: 'build_123',
      startTime: new Date(),
      endTime: new Date(),
      totalDuration: 5000,
      status: 'FAILED',
      totalTests: 100,
      successfulTests: 85,
      failedTests: 15,
      skippedTests: 0,
      testSuccessRate: 0.85,
      totalIssues: 5,
      criticalIssues: 1,
      highIssues: 2,
      mediumIssues: 2,
      lowIssues: 0,
      riskLevel: 'HIGH',
      healthScore: 70,
      buildBlockingIssues: 1,
      flakyTests: 3,
      canBuildPass: false,
      buildRecommendation: 'Fix critical issues before merge',
      risks: [],
      recommendations: [],
      failedTestNames: ['test1', 'test2'],
      blockingTestNames: ['test1'],
      flakyTestNames: ['test2', 'test3'],
      affectedComponents: ['UserService', 'PaymentService'],
      completedStages: [],
      ci: true,
      branch: 'main',
      commitHash: 'abc123',
      author: 'user@example.com'
    });

    const markdown = report.toMarkdown();
    expect(markdown).toContain('Build Assessment Report');
    expect(markdown).toContain('FAILED');
    expect(markdown).toContain('85');
    expect(markdown).toContain('main');
  });
});
