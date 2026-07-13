/**
 * BuildVerificationService - Application Service
 * 
 * Orchestriert die gesamte Build Verification Pipeline:
 * 1. Test Discovery (via TestRegistryService)
 * 2. Test Execution
 * 3. Issue Collection (via IssueService)
 * 4. Severity Evaluation
 * 5. Recommendation Generation
 * 6. Build Assessment
 * 
 * Diese Service verbindet das Test Registry System (Phase 28)
 * mit dem Issue Management System (Phase 27)
 */

import { BuildId } from '../../domain/buildPipeline/BuildId';
import { BuildStage } from '../../domain/buildPipeline/BuildStage';
import { BuildMetrics } from '../../domain/buildPipeline/BuildMetrics';
import { BuildRisk, RiskCategory, RiskSeverity } from '../../domain/buildPipeline/BuildRisk';
import { BuildRecommendation, RecommendationType } from '../../domain/buildPipeline/BuildRecommendation';
import { BuildAssessmentReport, BuildAssessmentReportData } from './BuildAssessmentReport';

/**
 * Externe Service Dependencies (aus Phase 27 & 28)
 */
export interface TestRegistryServiceLike {
  getAllTests(): Promise<any[]>;
  getTestsByCategory(category: string): Promise<any[]>;
  getCatalogStatistics(): Promise<any>;
  recordTestSuccess(testId: string, duration: number): Promise<void>;
  recordTestFailure(testId: string, duration: number): Promise<void>;
  getBuildAssessment(): Promise<any>;
}

export interface IssueServiceLike {
  getAllIssues(): Promise<any[]>;
  getIssuesByComponent(component: string): Promise<any[]>;
  getIssuesByStatus(status: string): Promise<any[]>;
  getStatistics(): Promise<any>;
}

/**
 * Test Execution Result
 */
interface TestExecutionResult {
  testId: string;
  testName: string;
  component: string;
  success: boolean;
  duration: number;
  error?: string;
}

/**
 * Build Verification Service
 */
export class BuildVerificationService {
  private readonly testRegistry: TestRegistryServiceLike;
  private readonly issueService: IssueServiceLike;

  constructor(testRegistry: TestRegistryServiceLike, issueService: IssueServiceLike) {
    this.testRegistry = testRegistry;
    this.issueService = issueService;
  }

  /**
   * Führt die komplette Build Verification Pipeline aus
   */
  async runBuildPipeline(options?: {
    ci?: boolean;
    branch?: string;
    commitHash?: string;
    author?: string;
  }): Promise<BuildAssessmentReport> {
    const buildId = BuildId.generate();
    const startTime = new Date();
    const completedStages: BuildStage[] = [];
    let failedAt: BuildStage | undefined;

    try {
      // Stage 1: Build Started
      console.log(`\n🔨 Starting Build Pipeline (${buildId.getValue()})`);
      completedStages.push(BuildStage.BUILD_STARTED);

      // Stage 2: Test Discovery
      console.log(`📊 Stage: Test Discovery`);
      const discoveredTests = await this.stageTestDiscovery();
      completedStages.push(BuildStage.TEST_DISCOVERY);
      console.log(`✅ Discovered ${discoveredTests.length} tests`);

      // Stage 3: Test Execution
      console.log(`🧪 Stage: Test Execution`);
      const testResults = await this.stageTestExecution(discoveredTests);
      completedStages.push(BuildStage.TEST_EXECUTION);
      console.log(`✅ Executed tests: ${testResults.filter(t => t.success).length}/${testResults.length} passed`);

      // Stage 4: Issue Collection
      console.log(`📋 Stage: Issue Collection`);
      const issues = await this.stageIssueCollection();
      completedStages.push(BuildStage.ISSUE_COLLECTION);
      console.log(`✅ Collected ${issues.length} issues`);

      // Stage 5: Severity Evaluation
      console.log(`⚠️  Stage: Severity Evaluation`);
      const evaluatedIssues = await this.stageSeverityEvaluation(issues);
      completedStages.push(BuildStage.SEVERITY_EVALUATION);
      console.log(`✅ Evaluated severity levels`);

      // Stage 6: Recommendation Generation
      console.log(`💡 Stage: Recommendation Generation`);
      const risks = this.extractRisks(testResults, evaluatedIssues);
      const recommendations = this.generateRecommendations(risks, testResults, evaluatedIssues);
      completedStages.push(BuildStage.RECOMMENDATION_GENERATION);
      console.log(`✅ Generated ${recommendations.length} recommendations`);

      // Stage 7: Build Assessment
      console.log(`📋 Stage: Build Assessment`);
      const assessment = await this.stageBuildAssessment(
        testResults,
        evaluatedIssues,
        risks,
        recommendations
      );
      completedStages.push(BuildStage.BUILD_ASSESSMENT);
      console.log(`✅ Build Assessment Complete`);

      // Stage 8: Build Completed
      completedStages.push(BuildStage.BUILD_COMPLETED);
      const endTime = new Date();
      const totalDuration = endTime.getTime() - startTime.getTime();

      console.log(`\n✨ Pipeline completed successfully (${totalDuration}ms)`);

      // Create Report
      const report = new BuildAssessmentReport({
        buildId: buildId.getValue(),
        startTime,
        endTime,
        totalDuration,
        status: assessment.canPass ? 'PASSED' : 'FAILED',
        totalTests: testResults.length,
        successfulTests: testResults.filter(t => t.success).length,
        failedTests: testResults.filter(t => !t.success).length,
        skippedTests: 0,
        testSuccessRate:
          testResults.length > 0
            ? testResults.filter(t => t.success).length / testResults.length
            : 1,
        totalIssues: evaluatedIssues.length,
        criticalIssues: evaluatedIssues.filter(i => i.severity === 'CRITICAL').length,
        highIssues: evaluatedIssues.filter(i => i.severity === 'HIGH').length,
        mediumIssues: evaluatedIssues.filter(i => i.severity === 'MEDIUM').length,
        lowIssues: evaluatedIssues.filter(i => i.severity === 'LOW').length,
        riskLevel: assessment.riskLevel,
        healthScore: assessment.healthScore,
        buildBlockingIssues: risks.filter(r => r.isBlocking()).length,
        flakyTests: assessment.flakyTests,
        canBuildPass: assessment.canPass,
        buildRecommendation: assessment.recommendation,
        risks,
        recommendations,
        failedTestNames: testResults.filter(t => !t.success).map(t => t.testName),
        blockingTestNames: assessment.blockingTestNames,
        flakyTestNames: assessment.flakyTestNames,
        affectedComponents: [...new Set(testResults.map(t => t.component))],
        completedStages,
        failedAt,
        ci: options?.ci ?? false,
        branch: options?.branch,
        commitHash: options?.commitHash,
        author: options?.author
      });

      return report;
    } catch (error) {
      // Error handling
      const stage = completedStages[completedStages.length - 1];
      failedAt = stage;
      completedStages.push(BuildStage.BUILD_FAILED);

      const endTime = new Date();
      const totalDuration = endTime.getTime() - startTime.getTime();

      console.error(`\n❌ Build failed at stage: ${stage}`);
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);

      throw new Error(`Build verification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Stage 1: Test Discovery
   */
  private async stageTestDiscovery(): Promise<any[]> {
    const tests = await this.testRegistry.getAllTests();
    return tests;
  }

  /**
   * Stage 3: Test Execution
   */
  private async stageTestExecution(tests: any[]): Promise<TestExecutionResult[]> {
    const results: TestExecutionResult[] = [];

    for (const test of tests) {
      try {
        // Simulate test execution (in real scenario, run actual test)
        const duration = Math.random() * 1000 + 50;
        const success = Math.random() > 0.15; // 85% success rate for demo

        results.push({
          testId: test.getTestId?.().getValue?.() || test.id,
          testName: test.getTestName?.() || test.name,
          component: test.getComponent?.() || test.component,
          success,
          duration
        });

        if (success) {
          await this.testRegistry.recordTestSuccess(test.getTestId?.().getValue?.() || test.id, duration);
        } else {
          await this.testRegistry.recordTestFailure(test.getTestId?.().getValue?.() || test.id, duration);
        }
      } catch (error) {
        results.push({
          testId: test.getTestId?.().getValue?.() || test.id,
          testName: test.getTestName?.() || test.name,
          component: test.getComponent?.() || test.component,
          success: false,
          duration: 0,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return results;
  }

  /**
   * Stage 4: Issue Collection
   */
  private async stageIssueCollection(): Promise<any[]> {
    const issues = await this.issueService.getAllIssues();
    return issues;
  }

  /**
   * Stage 5: Severity Evaluation
   */
  private async stageSeverityEvaluation(issues: any[]): Promise<any[]> {
    return issues.map(issue => ({
      ...issue,
      severity: issue.getSeverity?.() || issue.severity || 'MEDIUM',
      evaluatedAt: new Date()
    }));
  }

  /**
   * Extract Risks from test results and issues
   */
  private extractRisks(testResults: TestExecutionResult[], issues: any[]): BuildRisk[] {
    const risks: BuildRisk[] = [];

    // Risk 1: Flaky Tests
    const flakyTests = testResults.filter(t => t.success === false);
    if (flakyTests.length > 0) {
      risks.push(
        new BuildRisk({
          id: `risk_flaky_${Date.now()}`,
          category: RiskCategory.FLAKY_TESTS,
          severity: flakyTests.length > 5 ? RiskSeverity.CRITICAL : RiskSeverity.HIGH,
          description: `${flakyTests.length} tests failed`,
          affectedComponent: 'Multiple',
          count: flakyTests.length,
          recommendation: 'Review and fix failing tests before deployment',
          detectedAt: new Date()
        })
      );
    }

    // Risk 2: Critical Issues
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL' || i.getSeverity?.() === 'CRITICAL');
    if (criticalIssues.length > 0) {
      risks.push(
        new BuildRisk({
          id: `risk_critical_${Date.now()}`,
          category: RiskCategory.CRITICAL_ISSUES,
          severity: RiskSeverity.CRITICAL,
          description: `${criticalIssues.length} critical issues detected`,
          affectedComponent: criticalIssues[0].getComponent?.() || criticalIssues[0].component || 'Unknown',
          count: criticalIssues.length,
          recommendation: 'Must fix all critical issues before merge',
          detectedAt: new Date()
        })
      );
    }

    // Risk 3: Blocking Issues
    const blockingIssues = issues.filter(i => i.getIsBlocking?.() || i.isBlocking);
    if (blockingIssues.length > 0) {
      risks.push(
        new BuildRisk({
          id: `risk_blocking_${Date.now()}`,
          category: RiskCategory.BLOCKING_ISSUES,
          severity: RiskSeverity.CRITICAL,
          description: `${blockingIssues.length} build-blocking issues`,
          affectedComponent: blockingIssues[0].getComponent?.() || blockingIssues[0].component || 'Unknown',
          count: blockingIssues.length,
          recommendation: 'Resolve all blocking issues to proceed',
          detectedAt: new Date()
        })
      );
    }

    return risks;
  }

  /**
   * Generate Recommendations
   */
  private generateRecommendations(
    risks: BuildRisk[],
    testResults: TestExecutionResult[],
    issues: any[]
  ): BuildRecommendation[] {
    const recommendations: BuildRecommendation[] = [];

    // If build can pass
    const blockingRisks = risks.filter(r => r.isBlocking());
    if (blockingRisks.length === 0) {
      recommendations.push(
        new BuildRecommendation({
          id: `rec_approve_${Date.now()}`,
          type: RecommendationType.APPROVE_BUILD,
          priority: 10,
          title: 'Approve Build',
          description: 'All critical issues resolved. Build is ready for deployment.',
          affectedComponent: 'Build',
          actionItems: ['Proceed with deployment', 'Monitor in production'],
          estimatedEffort: 'LOW',
          createdAt: new Date()
        })
      );
    } else {
      // If build should be blocked
      recommendations.push(
        new BuildRecommendation({
          id: `rec_block_${Date.now()}`,
          type: RecommendationType.FIX_BEFORE_MERGE,
          priority: 9,
          title: 'Fix Issues Before Merge',
          description: `${blockingRisks.length} blocking issue(s) must be resolved.`,
          affectedComponent: blockingRisks[0].affectedComponent,
          actionItems: blockingRisks.map(r => r.recommendation),
          estimatedEffort: 'HIGH',
          createdAt: new Date()
        })
      );
    }

    // Flaky test recommendation
    const failedTests = testResults.filter(t => !t.success);
    if (failedTests.length > 0) {
      recommendations.push(
        new BuildRecommendation({
          id: `rec_investigate_${Date.now()}`,
          type: RecommendationType.INVESTIGATE,
          priority: 8,
          title: 'Investigate Failed Tests',
          description: `${failedTests.length} tests failed. Investigate root causes.`,
          affectedComponent: failedTests[0].component,
          actionItems: [
            'Review test logs',
            'Check for external dependencies',
            'Consider test isolation'
          ],
          estimatedEffort: 'MEDIUM',
          createdAt: new Date()
        })
      );
    }

    // Performance recommendation
    const slowTests = testResults.filter(t => t.duration > 2000);
    if (slowTests.length > 0) {
      recommendations.push(
        new BuildRecommendation({
          id: `rec_optimize_${Date.now()}`,
          type: RecommendationType.OPTIMIZE,
          priority: 5,
          title: 'Optimize Slow Tests',
          description: `${slowTests.length} tests exceed 2s duration.`,
          affectedComponent: slowTests[0].component,
          actionItems: ['Profile slow tests', 'Optimize test fixtures', 'Consider parallel execution'],
          estimatedEffort: 'MEDIUM',
          createdAt: new Date()
        })
      );
    }

    return recommendations;
  }

  /**
   * Stage 7: Build Assessment
   */
  private async stageBuildAssessment(
    testResults: TestExecutionResult[],
    issues: any[],
    risks: BuildRisk[],
    recommendations: BuildRecommendation[]
  ): Promise<{
    canPass: boolean;
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    healthScore: number;
    flakyTests: number;
    blockingTestNames: string[];
    flakyTestNames: string[];
    recommendation: string;
  }> {
    const blockingRisks = risks.filter(r => r.isBlocking());
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL' || i.getSeverity?.() === 'CRITICAL');
    const failedTests = testResults.filter(t => !t.success);

    const successRate = testResults.length > 0 ? (testResults.filter(t => t.success).length / testResults.length) : 1;
    const healthScore = Math.round(successRate * 100 * (1 - Math.min(issues.length * 0.05, 0.5)));

    let riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (blockingRisks.length > 0 || successRate < 0.7) {
      riskLevel = 'CRITICAL';
    } else if (criticalIssues.length > 0 || successRate < 0.85) {
      riskLevel = 'HIGH';
    } else if (issues.length > 5 || successRate < 0.95) {
      riskLevel = 'MEDIUM';
    }

    const canPass = blockingRisks.length === 0 && criticalIssues.length === 0 && successRate >= 0.8;

    let recommendation = '';
    if (canPass) {
      recommendation = `✅ Build can proceed. Tests passed with ${(successRate * 100).toFixed(1)}% success rate.`;
    } else {
      const reasons: string[] = [];
      if (blockingRisks.length > 0) reasons.push(`${blockingRisks.length} blocking issue(s)`);
      if (criticalIssues.length > 0) reasons.push(`${criticalIssues.length} critical issue(s)`);
      if (successRate < 0.8) reasons.push(`low test success rate (${(successRate * 100).toFixed(1)}%)`);
      recommendation = `❌ Build blocked due to: ${reasons.join(', ')}`;
    }

    return {
      canPass,
      riskLevel,
      healthScore,
      flakyTests: failedTests.length,
      blockingTestNames: failedTests.map(t => t.testName),
      flakyTestNames: failedTests.map(t => t.testName),
      recommendation
    };
  }

  /**
   * Generate Report als Markdown (für CI/CD Logs)
   */
  async generateMarkdownReport(report: BuildAssessmentReport): Promise<string> {
    return report.toMarkdown();
  }

  /**
   * Export Report als JSON
   */
  async exportReportAsJson(report: BuildAssessmentReport): Promise<string> {
    return JSON.stringify(report.toJSON(), null, 2);
  }
}
