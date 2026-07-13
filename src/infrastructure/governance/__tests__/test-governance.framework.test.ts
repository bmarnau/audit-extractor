/**
 * TEST GOVERNANCE FRAMEWORK - Comprehensive Test Suite
 * Tests für alle Services und den Main Framework
 */

import { TestGovernanceFramework } from '../test-governance.framework';
import { ErrorCollectorService } from '../services/error-collector.service';
import { SeverityAssessorService, SeverityLevel } from '../services/severity-assessor.service';
import { RecommendationEngineService } from '../services/recommendation-engine.service';
import { RiskAnalyzerService } from '../services/risk-analyzer.service';
import { ReleaseDecisionService } from '../services/release-decision.service';

describe('TestGovernanceFramework', () => {
  let framework: TestGovernanceFramework;

  beforeEach(() => {
    framework = new TestGovernanceFramework();
  });

  describe('Full Workflow', () => {
    it('should generate complete governance report from test results', async () => {
      const testRunData = {
        testRunId: 'TEST-RUN-001',
        projectVersion: '0.26.1',
        totalTests: 100,
        passedTests: 95,
        failedTests: 5,
        coverage: 85,
        executionTime: 45000,
        flakynessIndex: 12,
        hasRegressions: false,
        lintIssues: 3,
        typeScriptErrors: 1,
        slowTests: [{ name: 'slow-test', duration: 5000 }],
      };

      const report = await framework.executeGovernanceWorkflow(testRunData);

      expect(report).toBeDefined();
      expect(report.reportId).toMatch(/^GOV-/);
      expect(report.executiveSummary.passRate).toBe(95);
      expect(report.executiveSummary.coveragePercentage).toBe(85);
      expect(report.releaseDecision).toBeDefined();
    });

    it('should identify critical issues and block release', async () => {
      const testRunData = {
        testRunId: 'TEST-RUN-002',
        projectVersion: '0.26.1',
        totalTests: 100,
        passedTests: 60,
        failedTests: 40,
        coverage: 50,
        executionTime: 120000,
        flakynessIndex: 60,
        hasRegressions: true,
        lintIssues: 50,
        typeScriptErrors: 20,
      };

      const report = await framework.executeGovernanceWorkflow(testRunData);

      expect(report.releaseDecision.canRelease).toBe(false);
      expect(report.releaseDecision.approvalLevel).toBe('BLOCKED');
      expect(report.releaseDecision.releaseBlockers.length).toBeGreaterThan(0);
      expect(report.severityAssessment.byLevel[SeverityLevel.CRITICAL]).toBeGreaterThan(0);
    });

    it('should generate recommendations based on failures', async () => {
      const testRunData = {
        testRunId: 'TEST-RUN-003',
        projectVersion: '0.26.1',
        totalTests: 100,
        passedTests: 85,
        failedTests: 15,
        coverage: 78,
        executionTime: 60000,
        flakynessIndex: 35,
        hasRegressions: true,
        lintIssues: 10,
        typeScriptErrors: 3,
      };

      const report = await framework.executeGovernanceWorkflow(testRunData);

      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations[0].priority).toBeLessThanOrEqual(report.recommendations[1].priority);
    });

    it('should create release checklist', () => {
      const testRunData = {
        testRunId: 'TEST-RUN-004',
        projectVersion: '0.26.1',
        totalTests: 100,
        passedTests: 98,
        failedTests: 2,
        coverage: 88,
        executionTime: 40000,
        flakynessIndex: 8,
        hasRegressions: false,
        lintIssues: 1,
        typeScriptErrors: 0,
      };

      return framework.executeGovernanceWorkflow(testRunData).then(report => {
        const checklist = framework.createReleaseChecklist(report);

        expect(checklist.items).toBeDefined();
        expect(checklist.totalItems).toBeGreaterThan(0);
        expect(checklist.passedItems).toBeGreaterThanOrEqual(0);
        expect(checklist.failedItems).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('ErrorCollectorService', () => {
    let service: ErrorCollectorService;

    beforeEach(() => {
      service = new ErrorCollectorService();
    });

    it('should collect errors from Jest results', () => {
      const jestResults = {
        testResults: [
          {
            name: 'src/__tests__/extraction.test.ts',
            assertionResults: [
              {
                title: 'should extract data',
                status: 'passed',
              },
              {
                title: 'should handle errors',
                status: 'failed',
                failureMessages: ['Expected value to be true', 'at line 42'],
                duration: 1500,
              },
            ],
          },
        ],
      };

      const failures = service.collectFromJestResults(jestResults);

      expect(failures).toHaveLength(1);
      expect(failures[0].testName).toBe('should handle errors');
      expect(failures[0].category).toBe('unit');
    });

    it('should group failures by category', () => {
      service.addManualFailure({
        testName: 'test1',
        testFile: 'unit.test.ts',
        error: 'Error',
        duration: 100,
        category: 'unit',
      });

      service.addManualFailure({
        testName: 'test2',
        testFile: 'integration.test.ts',
        error: 'Error',
        duration: 200,
        category: 'integration',
      });

      const grouped = service.groupByCategory();

      expect(grouped.unit).toHaveLength(1);
      expect(grouped.integration).toHaveLength(1);
    });

    it('should analyze common error patterns', () => {
      service.addManualFailure({
        testName: 'test1',
        testFile: 'test.ts',
        error: 'Cannot read property x of undefined',
        duration: 100,
        category: 'unit',
      });

      service.addManualFailure({
        testName: 'test2',
        testFile: 'test.ts',
        error: 'Cannot read property y of undefined',
        duration: 100,
        category: 'unit',
      });

      const patterns = service.analyzeCommonPatterns();

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toContain('UNDEFINED');
    });
  });

  describe('SeverityAssessorService', () => {
    let service: SeverityAssessorService;

    beforeEach(() => {
      service = new SeverityAssessorService();
    });

    it('should assess CRITICAL severity for core module failures', () => {
      const failure = {
        testName: 'should extract data',
        testFile: 'src/core/extraction-engine.test.ts',
        error: 'Extraction failed',
        duration: 1000,
        category: 'unit' as const,
        timestamp: new Date().toISOString(),
      };

      const context = {
        totalTests: 100,
        passRate: 70,
        coverage: 50,
        hasRegressions: true,
        affectedModules: ['core'],
      };

      const assessment = service.assessFailure(failure, context);

      expect(assessment.level).toBe(SeverityLevel.CRITICAL);
      expect(assessment.blocksRelease).toBe(true);
      expect(assessment.affectedSystems).toContain('ExtractionEngine');
    });

    it('should assess coverage impact on severity', () => {
      const coverageLevel = service.assessCoverageImpact(60, 80);

      expect(coverageLevel).toBe(SeverityLevel.CRITICAL);
    });

    it('should assess flakiness correctly', () => {
      const level1 = service.assessFlakiness(75);
      const level2 = service.assessFlakiness(40);
      const level3 = service.assessFlakiness(5);

      expect(level1).toBe(SeverityLevel.CRITICAL);
      expect(level2).toBe(SeverityLevel.MEDIUM);
      expect(level3).toBe(SeverityLevel.INFO);
    });
  });

  describe('RecommendationEngineService', () => {
    let service: RecommendationEngineService;

    beforeEach(() => {
      service = new RecommendationEngineService();
    });

    it('should generate critical recommendations for high failure rate', () => {
      const severityAssessment = {
        timestamp: new Date().toISOString(),
        totalIssues: 20,
        byLevel: {
          [SeverityLevel.CRITICAL]: 5,
          [SeverityLevel.HIGH]: 10,
          [SeverityLevel.MEDIUM]: 5,
          [SeverityLevel.LOW]: 0,
          [SeverityLevel.INFO]: 0,
        },
        criticalIssues: [],
        overallRisk: 'DANGER' as const,
        assessmentDetails: [],
      };

      const context = {
        failureCount: 15,
        passRate: 60,
        coverage: 50,
        flakynessIndex: 45,
        regressionDetected: true,
        lintIssues: 25,
        typeScriptErrors: 10,
        slowTests: [],
      };

      const recommendations = service.generateRecommendations(severityAssessment, context);

      expect(recommendations.length).toBeGreaterThan(0);
      const criticals = recommendations.filter(r => r.severity === SeverityLevel.CRITICAL);
      expect(criticals.length).toBeGreaterThan(0);
    });

    it('should create execution plan with 30/60/90 timeline', () => {
      const recommendations = [
        {
          id: 'REC-001',
          title: 'Fix critical issues',
          description: 'Critical failures',
          severity: SeverityLevel.CRITICAL,
          priority: 1,
          action: 'Debug and fix',
          expectedOutcome: 'All pass',
          estimatedEffort: 'QUICK' as const,
          affectedAreas: ['Testing'],
        },
        {
          id: 'REC-002',
          title: 'Improve coverage',
          description: 'Coverage gap',
          severity: SeverityLevel.MEDIUM,
          priority: 5,
          action: 'Add tests',
          expectedOutcome: '85% coverage',
          estimatedEffort: 'MEDIUM' as const,
          affectedAreas: ['Testing'],
        },
        {
          id: 'REC-003',
          title: 'Refactor slow tests',
          description: 'Performance',
          severity: SeverityLevel.LOW,
          priority: 8,
          action: 'Optimize',
          expectedOutcome: 'Faster tests',
          estimatedEffort: 'LONG' as const,
          affectedAreas: ['Infrastructure'],
        },
      ];

      const plan = service.generateExecutionPlan(recommendations);

      expect(plan.immediate.length).toBe(1);
      expect(plan.short_term.length).toBe(1);
      expect(plan.long_term.length).toBe(1);
    });
  });

  describe('RiskAnalyzerService', () => {
    let service: RiskAnalyzerService;

    beforeEach(() => {
      service = new RiskAnalyzerService();
    });

    it('should identify release readiness risk', () => {
      const severityAssessment = {
        timestamp: new Date().toISOString(),
        totalIssues: 0,
        byLevel: {
          [SeverityLevel.CRITICAL]: 0,
          [SeverityLevel.HIGH]: 0,
          [SeverityLevel.MEDIUM]: 0,
          [SeverityLevel.LOW]: 0,
          [SeverityLevel.INFO]: 0,
        },
        criticalIssues: [],
        overallRisk: 'SAFE' as const,
        assessmentDetails: [],
      };

      const context = {
        passRate: 98,
        coverage: 85,
        flakynessIndex: 8,
        hasRegressions: false,
        failedTests: [],
      };

      const risks = service.analyzeRisks(severityAssessment, context);

      expect(risks.length).toBeGreaterThan(0);
      const releaseRisk = risks.find(r => r.name.includes('Release'));
      expect(releaseRisk).toBeDefined();
    });

    it('should create ASCII risk matrix visualization', () => {
      const severityAssessment = {
        timestamp: new Date().toISOString(),
        totalIssues: 5,
        byLevel: {
          [SeverityLevel.CRITICAL]: 1,
          [SeverityLevel.HIGH]: 2,
          [SeverityLevel.MEDIUM]: 2,
          [SeverityLevel.LOW]: 0,
          [SeverityLevel.INFO]: 0,
        },
        criticalIssues: [],
        overallRisk: 'CAUTION' as const,
        assessmentDetails: [],
      };

      const context = {
        passRate: 85,
        coverage: 75,
        flakynessIndex: 25,
        hasRegressions: true,
        failedTests: [],
      };

      const risks = service.analyzeRisks(severityAssessment, context);
      const matrix = service.createRiskMatrix(risks);
      const visualization = service.visualizeRiskMatrix(matrix);

      expect(visualization).toContain('RISK ASSESSMENT MATRIX');
      expect(visualization).toContain('║');
    });
  });

  describe('ReleaseDecisionService', () => {
    let service: ReleaseDecisionService;

    beforeEach(() => {
      service = new ReleaseDecisionService();
    });

    it('should approve release when all metrics are excellent', () => {
      const severityAssessment = {
        timestamp: new Date().toISOString(),
        totalIssues: 0,
        byLevel: {
          [SeverityLevel.CRITICAL]: 0,
          [SeverityLevel.HIGH]: 0,
          [SeverityLevel.MEDIUM]: 0,
          [SeverityLevel.LOW]: 0,
          [SeverityLevel.INFO]: 0,
        },
        criticalIssues: [],
        overallRisk: 'SAFE' as const,
        assessmentDetails: [],
      };

      const context = {
        totalTests: 100,
        passedTests: 100,
        passRate: 100,
        coverage: 95,
        criticalIssues: 0,
        highIssues: 0,
        hasRegressions: false,
        flakynessIndex: 5,
        lintIssues: 0,
        typeScriptErrors: 0,
      };

      const decision = service.makeReleaseDecision(severityAssessment, context);

      expect(decision.canRelease).toBe(true);
      expect(decision.approvalLevel).toBe('APPROVED');
      expect(decision.releaseBlockers).toHaveLength(0);
    });

    it('should block release for critical issues', () => {
      const severityAssessment = {
        timestamp: new Date().toISOString(),
        totalIssues: 5,
        byLevel: {
          [SeverityLevel.CRITICAL]: 3,
          [SeverityLevel.HIGH]: 2,
          [SeverityLevel.MEDIUM]: 0,
          [SeverityLevel.LOW]: 0,
          [SeverityLevel.INFO]: 0,
        },
        criticalIssues: [],
        overallRisk: 'DANGER' as const,
        assessmentDetails: [],
      };

      const context = {
        totalTests: 100,
        passedTests: 60,
        passRate: 60,
        coverage: 50,
        criticalIssues: 3,
        highIssues: 2,
        hasRegressions: true,
        flakynessIndex: 55,
        lintIssues: 30,
        typeScriptErrors: 15,
      };

      const decision = service.makeReleaseDecision(severityAssessment, context);

      expect(decision.canRelease).toBe(false);
      expect(decision.approvalLevel).toBe('BLOCKED');
      expect(decision.releaseBlockers.length).toBeGreaterThan(0);
    });

    it('should generate comprehensive release checklist', () => {
      const context = {
        totalTests: 100,
        passedTests: 95,
        passRate: 95,
        coverage: 85,
        criticalIssues: 0,
        highIssues: 1,
        hasRegressions: false,
        flakynessIndex: 12,
        lintIssues: 3,
        typeScriptErrors: 0,
      };

      const checklist = service.createReleaseChecklist(context);

      expect(checklist.totalItems).toBeGreaterThan(0);
      expect(checklist.items.length).toEqual(checklist.totalItems);
      expect(checklist.passedItems + checklist.failedItems).toBeLessThanOrEqual(checklist.totalItems);
    });
  });

  describe('Report Export', () => {
    it('should export report as JSON', async () => {
      const testRunData = {
        testRunId: 'TEST-RUN-EXPORT',
        projectVersion: '0.26.1',
        totalTests: 100,
        passedTests: 95,
        failedTests: 5,
        coverage: 85,
        executionTime: 45000,
        flakynessIndex: 12,
        hasRegressions: false,
        lintIssues: 0,
        typeScriptErrors: 0,
      };

      const report = await framework.executeGovernanceWorkflow(testRunData);
      const json = JSON.parse(JSON.stringify(report));

      expect(json.reportId).toBeDefined();
      expect(json.timestamp).toBeDefined();
      expect(json.executiveSummary).toBeDefined();
      expect(json.releaseDecision).toBeDefined();
    });

    it('should generate management summary text', async () => {
      const testRunData = {
        testRunId: 'TEST-RUN-SUMMARY',
        projectVersion: '0.26.1',
        totalTests: 100,
        passedTests: 90,
        failedTests: 10,
        coverage: 80,
        executionTime: 50000,
        flakynessIndex: 15,
        hasRegressions: true,
        lintIssues: 5,
        typeScriptErrors: 2,
      };

      const report = await framework.executeGovernanceWorkflow(testRunData);
      const summary = framework.generateManagementSummary(report);

      expect(summary).toContain('RELEASE DECISION REPORT');
      expect(summary).toContain('QUALITY METRICS');
      expect(summary.length).toBeGreaterThan(100);
    });
  });
});
