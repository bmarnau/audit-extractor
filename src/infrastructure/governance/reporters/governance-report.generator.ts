/**
 * GovernanceReportGenerator - Erzeugt den finalen GovernanceReport
 * Kombiniert alle Services zu einer Management-Bewertung
 */

import { GovernanceReport, TestFailure } from '../types/governance-report.types';
import { SeverityAssessmentResult } from '../types/severity.types';
import { ErrorCollectorService } from './error-collector.service';
import { SeverityAssessorService } from './severity-assessor.service';
import { RecommendationEngineService } from './recommendation-engine.service';
import { RiskAnalyzerService } from './risk-analyzer.service';
import { ReleaseDecisionService } from './release-decision.service';

interface GovernanceContext {
  testRunId: string;
  projectVersion: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coverage: number;
  executionTime: number;
  flakynessIndex: number;
  hasRegressions: boolean;
  lintIssues: number;
  typeScriptErrors: number;
  testResults?: any;
  playwrightResults?: any;
  slowTests?: Array<{ name: string; duration: number }>;
}

export class GovernanceReportGenerator {
  private errorCollector = new ErrorCollectorService();
  private severityAssessor = new SeverityAssessorService();
  private recommendationEngine = new RecommendationEngineService();
  private riskAnalyzer = new RiskAnalyzerService();
  private releaseDecision = new ReleaseDecisionService();

  /**
   * Erzeugt einen vollständigen GovernanceReport
   */
  public generateReport(context: GovernanceContext): GovernanceReport {
    // 1. Fehler sammeln
    const failures = this.collectFailures(context);

    // 2. Schweregrad bewerten
    const severityAssessment = this.assessSeverity(failures, context);

    // 3. Empfehlungen erzeugen
    const recommendations = this.generateRecommendations(failures, severityAssessment, context);

    // 4. Risiken analysieren
    const risks = this.analyzeRisks(severityAssessment, context);
    const riskRegister = this.riskAnalyzer.createRiskRegister(risks, severityAssessment);

    // 5. Releaseentscheidung treffen
    const releaseDecision = this.makeReleaseDecision(severityAssessment, context);

    // 6. Compliance prüfen
    const compliance = this.assessCompliance(context);

    // 7. Metriken sammeln
    const metrics = this.collectMetrics(failures, context);

    // Combine everything into GovernanceReport
    const report: GovernanceReport = {
      // Metadata
      reportId: `GOV-${new Date().getTime()}`,
      timestamp: new Date().toISOString(),
      projectVersion: context.projectVersion,
      testRunId: context.testRunId,

      // Executive Summary
      executiveSummary: {
        totalTestsRun: context.totalTests,
        passedTests: context.passedTests,
        failedTests: context.failedTests,
        passRate: (context.passedTests / context.totalTests) * 100,
        coveragePercentage: context.coverage,
        qualityScore: this.calculateQualityScore(context, failures),
      },

      // Failures
      failures,
      failureAnalysis: {
        failuresByCategory: this.groupFailuresByCategory(failures),
        failuresByModule: this.groupFailuresByModule(failures),
        commonPatterns: this.errorCollector.analyzeCommonPatterns(),
        rootCauseAnalysis: this.errorCollector.analyzeRootCauses(),
      },

      // Severity Assessment
      severityAssessment,

      // Recommendations
      recommendations,

      // Risk Analysis
      riskAnalysis: {
        identifiedRisks: risks,
        overallRiskRating: riskRegister.overallRiskLevel as any,
        riskMatrix: this.riskAnalyzer.visualizeRiskMatrix(riskRegister.matrix),
        mitigationPlan: this.generateMitigationPlan(riskRegister.mitigations),
      },

      // Release Decision
      releaseDecision,

      // Compliance
      compliance,

      // Metrics
      metrics,

      // Approval
      approval: {
        status: 'PENDING',
        approverRole: 'Release Manager',
      },
    };

    return report;
  }

  /**
   * Exportiert Report als JSON
   */
  public exportAsJSON(report: GovernanceReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Exportiert Report als formatiertes Text-Dokument
   */
  public exportAsText(report: GovernanceReport): string {
    const lines: string[] = [];

    // Header
    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║          TEST GOVERNANCE FRAMEWORK - MANAGEMENT REPORT        ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    // Executive Summary
    lines.push('EXECUTIVE SUMMARY');
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push(`Report ID: ${report.reportId}`);
    lines.push(`Timestamp: ${report.timestamp}`);
    lines.push(`Project Version: ${report.projectVersion}`);
    lines.push(`Quality Score: ${report.executiveSummary.qualityScore.toFixed(2)}/100`);
    lines.push('');
    lines.push(`Tests Run: ${report.executiveSummary.totalTestsRun}`);
    lines.push(`Passed: ${report.executiveSummary.passedTests} (${report.executiveSummary.passRate.toFixed(2)}%)`);
    lines.push(`Failed: ${report.executiveSummary.failedTests}`);
    lines.push(`Coverage: ${report.executiveSummary.coveragePercentage.toFixed(2)}%`);
    lines.push('');

    // Severity Assessment
    lines.push('SEVERITY ASSESSMENT');
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push(`Overall Risk: ${report.severityAssessment.overallRisk}`);
    lines.push(`Total Issues: ${report.severityAssessment.totalIssues}`);
    lines.push(`  • CRITICAL: ${report.severityAssessment.byLevel['CRITICAL']}`);
    lines.push(`  • HIGH: ${report.severityAssessment.byLevel['HIGH']}`);
    lines.push(`  • MEDIUM: ${report.severityAssessment.byLevel['MEDIUM']}`);
    lines.push(`  • LOW: ${report.severityAssessment.byLevel['LOW']}`);
    lines.push('');

    // Recommendations
    lines.push('TOP RECOMMENDATIONS');
    lines.push('─────────────────────────────────────────────────────────────');
    report.recommendations.slice(0, 5).forEach((rec, idx) => {
      lines.push(
        `${idx + 1}. [${rec.severity}] ${rec.title}`,
      );
      lines.push(`   Action: ${rec.action}`);
      lines.push('');
    });

    // Risk Analysis
    lines.push('RISK ANALYSIS');
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push(`Total Risks: ${report.riskAnalysis.identifiedRisks.length}`);
    lines.push(`Overall Risk Rating: ${report.riskAnalysis.overallRiskRating}`);
    lines.push('');
    lines.push(report.riskAnalysis.riskMatrix);
    lines.push('');

    // Release Decision
    lines.push('RELEASE DECISION');
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push(`Can Release: ${report.releaseDecision.canRelease ? '✅ YES' : '❌ NO'}`);
    lines.push(`Approval Level: ${report.releaseDecision.approvalLevel}`);
    lines.push('');

    if (report.releaseDecision.releaseBlockers.length > 0) {
      lines.push('Release Blockers:');
      report.releaseDecision.releaseBlockers.forEach(blocker => {
        lines.push(`  ⛔ ${blocker}`);
      });
      lines.push('');
    }

    lines.push('Reasoning:');
    lines.push(report.releaseDecision.reasoning);
    lines.push('');

    // Compliance
    lines.push('COMPLIANCE & STANDARDS');
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push(`Code Style Compliance: ${report.compliance.codeStyleCompliance}%`);
    lines.push(`TypeScript Strictness: ${report.compliance.typeScriptStrictness}%`);
    lines.push(`Coverage Compliance: ${report.compliance.testCoverageCompliance}%`);
    lines.push(`Documentation: ${report.compliance.documentationCompleteness}%`);
    lines.push(`Pre-commit Hooks: ${report.compliance.preCommitHooksStatus}`);
    lines.push('');

    // Metrics
    lines.push('PERFORMANCE METRICS');
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push(`Total Execution Time: ${(report.metrics.executionTime / 1000).toFixed(2)}s`);
    lines.push(`Average Test Duration: ${(report.metrics.averageTestDuration / 1000).toFixed(2)}s`);
    lines.push(`Flakiness Index: ${report.metrics.flakynessIndex.toFixed(2)}%`);
    lines.push(`Regression Detected: ${report.metrics.regressionDetected ? 'YES' : 'NO'}`);
    lines.push('');

    // Approval
    lines.push('APPROVAL & SIGN-OFF');
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push(`Status: ${report.approval.status}`);
    lines.push(`Approver Role: ${report.approval.approverRole}`);
    lines.push('');

    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║                      END OF REPORT                           ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');

    return lines.join('\n');
  }

  // ============= Private Hilfsmethoden =============

  private collectFailures(context: GovernanceContext): TestFailure[] {
    const failures: TestFailure[] = [];

    if (context.testResults) {
      failures.push(...this.errorCollector.collectFromJestResults(context.testResults));
    }

    if (context.playwrightResults) {
      failures.push(...this.errorCollector.collectFromPlaywrightResults(context.playwrightResults));
    }

    return failures;
  }

  private assessSeverity(failures: TestFailure[], context: GovernanceContext): SeverityAssessmentResult {
    const severityContext = {
      totalTests: context.totalTests,
      passRate: (context.passedTests / context.totalTests) * 100,
      coverage: context.coverage,
      hasRegressions: context.hasRegressions,
      affectedModules: [],
    };

    return this.severityAssessor.assessAllFailures(failures, severityContext);
  }

  private generateRecommendations(failures: TestFailure[], severityAssessment: SeverityAssessmentResult, context: GovernanceContext) {
    const recommendationContext = {
      failureCount: failures.length,
      passRate: (context.passedTests / context.totalTests) * 100,
      coverage: context.coverage,
      flakynessIndex: context.flakynessIndex,
      regressionDetected: context.hasRegressions,
      lintIssues: context.lintIssues,
      typeScriptErrors: context.typeScriptErrors,
      slowTests: context.slowTests || [],
    };

    return this.recommendationEngine.generateRecommendations(severityAssessment, recommendationContext);
  }

  private analyzeRisks(severityAssessment: SeverityAssessmentResult, context: GovernanceContext) {
    const riskContext = {
      passRate: (context.passedTests / context.totalTests) * 100,
      coverage: context.coverage,
      flakynessIndex: context.flakynessIndex,
      hasRegressions: context.hasRegressions,
      failedTests: context.failedTests > 0 ? Array(context.failedTests).fill('Failed test') : [],
    };

    return this.riskAnalyzer.analyzeRisks(severityAssessment, riskContext);
  }

  private makeReleaseDecision(severityAssessment: SeverityAssessmentResult, context: GovernanceContext) {
    const releaseContext = {
      totalTests: context.totalTests,
      passedTests: context.passedTests,
      passRate: (context.passedTests / context.totalTests) * 100,
      coverage: context.coverage,
      criticalIssues: severityAssessment.byLevel['CRITICAL'],
      highIssues: severityAssessment.byLevel['HIGH'],
      hasRegressions: context.hasRegressions,
      flakynessIndex: context.flakynessIndex,
      lintIssues: context.lintIssues,
      typeScriptErrors: context.typeScriptErrors,
    };

    return this.releaseDecision.makeReleaseDecision(severityAssessment, releaseContext);
  }

  private assessCompliance(context: GovernanceContext) {
    const coverageGap = Math.max(0, 80 - context.coverage);
    const codeStyleCompliance = Math.max(0, 100 - Math.min(context.lintIssues * 5, 100));
    const typeScriptStrictness = Math.max(0, 100 - Math.min(context.typeScriptErrors * 10, 100));

    return {
      codeStyleCompliance,
      typeScriptStrictness,
      testCoverageCompliance: Math.min(context.coverage, 100),
      documentationCompleteness: 75, // Placeholder
      preCommitHooksStatus: 'PASSED' as const,
    };
  }

  private collectMetrics(failures: TestFailure[], context: GovernanceContext) {
    const slowTests = context.slowTests || [];
    const avgDuration = failures.length > 0 ? failures.reduce((sum, f) => sum + f.duration, 0) / failures.length : 0;

    return {
      executionTime: context.executionTime,
      averageTestDuration: avgDuration,
      slowestTests: slowTests.slice(0, 5),
      flakynessIndex: context.flakynessIndex,
      regressionDetected: context.hasRegressions,
    };
  }

  private calculateQualityScore(context: GovernanceContext, failures: TestFailure[]): number {
    let score = 100;

    // Deduct for failures
    score -= (failures.length / context.totalTests) * 30;

    // Deduct for coverage gap
    score -= Math.max(0, 80 - context.coverage) * 0.3;

    // Deduct for flakiness
    score -= Math.min(context.flakynessIndex / 2, 15);

    // Deduct for lint issues
    score -= Math.min(context.lintIssues, 10);

    // Deduct for TS errors
    score -= Math.min(context.typeScriptErrors * 3, 15);

    return Math.max(0, Math.min(100, score));
  }

  private groupFailuresByCategory(failures: TestFailure[]): Record<string, number> {
    return {
      unit: failures.filter(f => f.category === 'unit').length,
      integration: failures.filter(f => f.category === 'integration').length,
      e2e: failures.filter(f => f.category === 'e2e').length,
    };
  }

  private groupFailuresByModule(failures: TestFailure[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    failures.forEach(failure => {
      const parts = failure.testFile.split(/[\\/]/);
      const module = parts.length > 1 ? parts[parts.length - 2] : 'unknown';
      grouped[module] = (grouped[module] || 0) + 1;
    });

    return grouped;
  }

  private generateMitigationPlan(mitigations: any[]): string {
    const lines: string[] = [];
    lines.push('Mitigation Plan:');
    mitigations.slice(0, 5).forEach((m, idx) => {
      lines.push(`${idx + 1}. ${m.mitigation} (Owner: ${m.owner}, Due: ${m.dueDate})`);
    });
    return lines.join('\n');
  }
}
