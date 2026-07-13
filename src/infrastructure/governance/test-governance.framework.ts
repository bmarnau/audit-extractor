/**
 * TestGovernanceFramework - Main Framework
 * Orchestriert alle Services für vollständige Test-Governance
 * 
 * ZIEL: Jeder Testlauf erzeugt eine Management-Bewertung
 * 
 * FEATURES:
 * ✅ Fehler sammeln
 * ✅ Schweregrad bestimmen
 * ✅ Empfehlungen erzeugen
 * ✅ Risiken dokumentieren
 * ✅ Releaseentscheidung treffen
 */

import { GovernanceReport } from './types/governance-report.types';
import { GovernanceReportGenerator } from './reporters/governance-report.generator';
import { ReleaseDecisionService } from './services/release-decision.service';

interface TestRunData {
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
  testResults?: any; // Jest results
  playwrightResults?: any; // Playwright results
  slowTests?: Array<{ name: string; duration: number }>;
  executionEnvironment?: {
    node: string;
    npm: string;
    platform: string;
  };
}

export class TestGovernanceFramework {
  private reportGenerator = new GovernanceReportGenerator();
  private releaseDecisionService = new ReleaseDecisionService();
  private generatedReports: GovernanceReport[] = [];

  /**
   * HAUPTMETHODE: Führt kompletten Governance Workflow durch
   * Input: Test-Ergebnisse → Output: GovernanceReport
   */
  public async executeGovernanceWorkflow(testRunData: TestRunData): Promise<GovernanceReport> {
    console.log('🎯 [TestGovernanceFramework] Starting governance workflow...');
    console.log(`   Test Run ID: ${testRunData.testRunId}`);
    console.log(`   Tests: ${testRunData.passedTests}/${testRunData.totalTests} passed`);

    try {
      // 1. Generiere Report
      const report = this.reportGenerator.generateReport({
        testRunId: testRunData.testRunId,
        projectVersion: testRunData.projectVersion,
        totalTests: testRunData.totalTests,
        passedTests: testRunData.passedTests,
        failedTests: testRunData.failedTests,
        coverage: testRunData.coverage,
        executionTime: testRunData.executionTime,
        flakynessIndex: testRunData.flakynessIndex,
        hasRegressions: testRunData.hasRegressions,
        lintIssues: testRunData.lintIssues,
        typeScriptErrors: testRunData.typeScriptErrors,
        testResults: testRunData.testResults,
        playwrightResults: testRunData.playwrightResults,
        slowTests: testRunData.slowTests,
      });

      // 2. Speichere Report
      this.generatedReports.push(report);

      // 3. Gebe Zusammenfassung aus
      this.printGovernanceSummary(report);

      return report;
    } catch (error) {
      console.error('❌ [TestGovernanceFramework] Workflow failed:', error);
      throw error;
    }
  }

  /**
   * Gibt alle generierten Reports zurück
   */
  public getReports(): GovernanceReport[] {
    return [...this.generatedReports];
  }

  /**
   * Gibt letzten Report zurück
   */
  public getLatestReport(): GovernanceReport | null {
    return this.generatedReports.length > 0 ? this.generatedReports[this.generatedReports.length - 1] : null;
  }

  /**
   * Exportiert Report als JSON
   */
  public exportReportAsJSON(report: GovernanceReport, filePath: string): void {
    const fs = require('fs');
    const json = this.reportGenerator.exportAsJSON(report);
    fs.writeFileSync(filePath, json);
    console.log(`✅ Report exported to: ${filePath}`);
  }

  /**
   * Exportiert Report als Text-Dokument
   */
  public exportReportAsText(report: GovernanceReport, filePath: string): void {
    const fs = require('fs');
    const text = this.reportGenerator.exportAsText(report);
    fs.writeFileSync(filePath, text);
    console.log(`✅ Report exported to: ${filePath}`);
  }

  /**
   * Erstellt einen Release Checklist
   */
  public createReleaseChecklist(report: GovernanceReport) {
    const context = {
      totalTests: report.executiveSummary.totalTestsRun,
      passedTests: report.executiveSummary.passedTests,
      passRate: report.executiveSummary.passRate,
      coverage: report.executiveSummary.coveragePercentage,
      criticalIssues: report.severityAssessment.byLevel['CRITICAL'],
      highIssues: report.severityAssessment.byLevel['HIGH'],
      hasRegressions: report.metrics.regressionDetected,
      flakynessIndex: report.metrics.flakynessIndex,
      lintIssues: 0, // From compliance
      typeScriptErrors: 0, // From compliance
    };

    return this.releaseDecisionService.createReleaseChecklist(context);
  }

  /**
   * Generiert einen Release Plan
   */
  public generateReleasePlan(report: GovernanceReport) {
    return this.releaseDecisionService.generateReleasePlan(report.releaseDecision);
  }

  /**
   * Generiert einen Management Summary
   */
  public generateManagementSummary(report: GovernanceReport) {
    const context = {
      totalTests: report.executiveSummary.totalTestsRun,
      passedTests: report.executiveSummary.passedTests,
      passRate: report.executiveSummary.passRate,
      coverage: report.executiveSummary.coveragePercentage,
      criticalIssues: report.severityAssessment.byLevel['CRITICAL'],
      highIssues: report.severityAssessment.byLevel['HIGH'],
      hasRegressions: report.metrics.regressionDetected,
      flakynessIndex: report.metrics.flakynessIndex,
      lintIssues: 0,
      typeScriptErrors: 0,
    };

    return this.releaseDecisionService.generateManagementSummary(report.releaseDecision, context);
  }

  /**
   * Setzt den Framework zurück
   */
  public reset(): void {
    this.generatedReports = [];
    console.log('🔄 [TestGovernanceFramework] Reset completed');
  }

  // ============= Private Hilfsmethoden =============

  private printGovernanceSummary(report: GovernanceReport): void {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         TEST GOVERNANCE FRAMEWORK - ASSESSMENT SUMMARY      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    // Quality Score
    console.log(`📊 QUALITY SCORE: ${report.executiveSummary.qualityScore.toFixed(2)}/100`);
    console.log('');

    // Test Results
    console.log('🧪 TEST RESULTS:');
    console.log(
      `   Pass Rate: ${report.executiveSummary.passRate.toFixed(2)}% (${report.executiveSummary.passedTests}/${report.executiveSummary.totalTestsRun})`,
    );
    console.log(`   Coverage: ${report.executiveSummary.coveragePercentage.toFixed(2)}%`);
    console.log('');

    // Severity
    console.log('🔴 SEVERITY ASSESSMENT:');
    console.log(`   Risk Level: ${report.severityAssessment.overallRisk}`);
    console.log(`   Critical Issues: ${report.severityAssessment.byLevel['CRITICAL']}`);
    console.log(`   High Issues: ${report.severityAssessment.byLevel['HIGH']}`);
    console.log('');

    // Release Decision
    console.log('✅ RELEASE DECISION:');
    console.log(`   Can Release: ${report.releaseDecision.canRelease ? '✅ YES' : '❌ NO'}`);
    console.log(`   Approval Level: ${report.releaseDecision.approvalLevel}`);
    console.log('');

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log('💡 TOP 3 RECOMMENDATIONS:');
      report.recommendations.slice(0, 3).forEach((rec, idx) => {
        console.log(`   ${idx + 1}. [${rec.severity}] ${rec.title}`);
      });
      console.log('');
    }

    // Risks
    if (report.riskAnalysis.identifiedRisks.length > 0) {
      console.log('⚠️ IDENTIFIED RISKS:');
      console.log(`   Total Risks: ${report.riskAnalysis.identifiedRisks.length}`);
      console.log(`   Risk Rating: ${report.riskAnalysis.overallRiskRating}`);
      console.log('');
    }

    // Blockers
    if (report.releaseDecision.releaseBlockers.length > 0) {
      console.log('🚫 RELEASE BLOCKERS:');
      report.releaseDecision.releaseBlockers.forEach(blocker => {
        console.log(`   ⛔ ${blocker}`);
      });
      console.log('');
    }

    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
  }
}

// ============= EXPORT SINGLETON =============
export const testGovernanceFramework = new TestGovernanceFramework();
