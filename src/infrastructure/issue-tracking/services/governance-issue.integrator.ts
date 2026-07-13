/**
 * GOVERNANCE-ISSUE INTEGRATION
 * 
 * Connects TestGovernanceFramework with central issue tracking
 * Automatically creates issues for test failures, coverage gaps, etc.
 */

import { GovernanceReport } from '../../governance/types/governance-report.types';
import { SeverityLevel } from '../../governance/types/severity.types';
import {
  IssueCategory,
  IssuePriority,
  ImpactArea,
  RootCauseType,
} from '../types/issue.types';
import { IssueManagerService } from '../services/issue-manager.service';

export class GovernanceIssueIntegrator {
  constructor(private issueManager: IssueManagerService) {}

  /**
   * Process governance report and create issues for findings
   */
  processGovernanceReport(report: GovernanceReport, buildVersion: string): string[] {
    const createdIssueIds: string[] = [];

    // Create issues from test failures
    report.failures.forEach(failure => {
      const issue = this.issueManager.createFromTestFailure(
        failure.testName,
        failure.testFile,
        failure.error,
        '',
        buildVersion,
        this.categorizeTestFailure(failure.testFile),
        this.extractComponent(failure.testFile),
        this.mapTestCategoryToSeverity(failure.category)
      );
      createdIssueIds.push(issue.issueId);
    });

    // Create issues for coverage gaps
    if (report.executiveSummary.coveragePercentage < 80) {
      const coverageGap = 80 - report.executiveSummary.coveragePercentage;
      const issue = this.issueManager.createFromCoverageGap(
        'Overall Project',
        Math.round(coverageGap * 100),
        80,
        report.executiveSummary.coveragePercentage,
        buildVersion
      );
      createdIssueIds.push(issue.issueId);
    }

    // Create issues for regressions
    if (report.metrics.regressionDetected) {
      const issue = this.issueManager.createFromRegression(
        'Regression Detected',
        'Previous Build',
        buildVersion,
        'One or more tests that previously passed are now failing'
      );
      createdIssueIds.push(issue.issueId);
    }

    // Create issues for recommendations
    report.recommendations.forEach(rec => {
      if (rec.severity === SeverityLevel.CRITICAL || rec.severity === SeverityLevel.HIGH) {
        const issue = this.issueManager.getRepository().createIssue({
          issueId: `ISS-REC-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          category: IssueCategory.UNKNOWN,
          priority: this.mapSeverityToPriority(rec.severity),
          severity: rec.severity,
          status: 'OPEN',
          title: rec.title,
          description: rec.description || rec.action,
          rootCause: RootCauseType.MISSING_VALIDATION,
          impactAreas: [ImpactArea.BUILD_PIPELINE],
          affectedComponents: rec.affectedAreas,
          consequenceIfNotFixed: `Ignoring this recommendation may result in ${rec.severity} level issues`,
          recommendedAction: rec.action,
          buildVersion,
          detectionMethod: 'AUTOMATED_TEST',
          discoveredAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
        createdIssueIds.push(issue.issueId);
      }
    });

    // Create issues for identified risks
    report.riskAnalysis.identifiedRisks.forEach(risk => {
      const issue = this.issueManager.getRepository().createIssue({
        issueId: `ISS-RISK-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        category: this.categorizeRisk(risk.name),
        priority: this.mapRiskToPriority(risk.probability, risk.impact),
        severity: this.mapRiskToSeverity(risk.probability, risk.impact),
        status: 'OPEN',
        title: risk.name,
        description: `Risk identified during governance assessment:\n${risk.description || ''}\n\nProbability: ${risk.probability || 'Unknown'}\nImpact: ${risk.impact || 'Unknown'}`,
        rootCause: RootCauseType.UNKNOWN,
        impactAreas: [ImpactArea.BUILD_PIPELINE],
        affectedComponents: [],
        consequenceIfNotFixed: `Unmitigated risk: ${risk.mitigationStrategy || 'Unknown'}`,
        recommendedAction: risk.mitigationStrategy || 'Investigate and implement risk mitigation',
        buildVersion,
        detectionMethod: 'AUTOMATED_TEST',
        discoveredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      createdIssueIds.push(issue.issueId);
    });

    return createdIssueIds;
  }

  /**
   * Categorize test failure
   */
  private categorizeTestFailure(testFile: string): IssueCategory {
    if (testFile.includes('integration')) return IssueCategory.TEST_FAILURE;
    if (testFile.includes('e2e')) return IssueCategory.TEST_FAILURE;
    if (testFile.includes('unit')) return IssueCategory.TEST_FAILURE;
    return IssueCategory.TEST_FAILURE;
  }

  /**
   * Extract component from test file path
   */
  private extractComponent(testFile: string): string {
    const parts = testFile.split('/');
    if (parts.length > 1) {
      return parts[1]; // Return the second part of path (e.g., 'extraction-engine')
    }
    return 'unknown';
  }

  /**
   * Map test category to severity
   */
  private mapTestCategoryToSeverity(
    category: 'unit' | 'integration' | 'e2e'
  ): SeverityLevel {
    switch (category) {
      case 'e2e':
        return SeverityLevel.HIGH;
      case 'integration':
        return SeverityLevel.HIGH;
      case 'unit':
        return SeverityLevel.MEDIUM;
      default:
        return SeverityLevel.MEDIUM;
    }
  }

  /**
   * Map severity level to priority
   */
  private mapSeverityToPriority(severity: SeverityLevel): IssuePriority {
    switch (severity) {
      case SeverityLevel.CRITICAL:
        return IssuePriority.CRITICAL;
      case SeverityLevel.HIGH:
        return IssuePriority.HIGH;
      case SeverityLevel.MEDIUM:
        return IssuePriority.MEDIUM;
      case SeverityLevel.LOW:
        return IssuePriority.LOW;
      case SeverityLevel.INFO:
        return IssuePriority.TRIVIAL;
      default:
        return IssuePriority.MEDIUM;
    }
  }

  /**
   * Categorize risk
   */
  private categorizeRisk(riskName: string): IssueCategory {
    if (riskName.includes('Coverage')) return IssueCategory.COVERAGE_GAP;
    if (riskName.includes('Flakiness')) return IssueCategory.TEST_FLAKINESS;
    if (riskName.includes('Failure')) return IssueCategory.TEST_FAILURE;
    if (riskName.includes('Regression')) return IssueCategory.TEST_REGRESSION;
    if (riskName.includes('Quality')) return IssueCategory.CODE_STYLE;
    return IssueCategory.UNKNOWN;
  }

  /**
   * Map risk to priority
   */
  private mapRiskToPriority(
    probability?: 'LOW' | 'MEDIUM' | 'HIGH',
    impact?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): IssuePriority {
    if (!probability || !impact) return IssuePriority.MEDIUM;

    if (
      (probability === 'HIGH' && impact === 'CRITICAL') ||
      (probability === 'HIGH' && impact === 'HIGH')
    ) {
      return IssuePriority.CRITICAL;
    }

    if (probability === 'HIGH' || impact === 'CRITICAL') {
      return IssuePriority.HIGH;
    }

    if (probability === 'MEDIUM' || impact === 'HIGH') {
      return IssuePriority.MEDIUM;
    }

    return IssuePriority.LOW;
  }

  /**
   * Map risk to severity
   */
  private mapRiskToSeverity(
    probability?: 'LOW' | 'MEDIUM' | 'HIGH',
    impact?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): SeverityLevel {
    if (!probability || !impact) return SeverityLevel.MEDIUM;

    if (
      (probability === 'HIGH' && impact === 'CRITICAL') ||
      (probability === 'HIGH' && impact === 'HIGH')
    ) {
      return SeverityLevel.CRITICAL;
    }

    if (probability === 'HIGH' || impact === 'CRITICAL') {
      return SeverityLevel.HIGH;
    }

    if (probability === 'MEDIUM' || impact === 'HIGH') {
      return SeverityLevel.MEDIUM;
    }

    return SeverityLevel.LOW;
  }

  /**
   * Check if release is blocked by issues
   */
  checkReleaseBlocked(buildVersion: string): { blocked: boolean; blockers: string[] } {
    const blockers = this.issueManager.getReleaseBlocers(buildVersion);
    return {
      blocked: blockers.length > 0,
      blockers: blockers.map(b => `${b.issueId}: ${b.title}`),
    };
  }

  /**
   * Generate release approval report
   */
  generateReleaseApprovalReport(buildVersion: string): string {
    const repository = this.issueManager.getRepository();
    const versionIssues = repository.filterIssues({ buildVersions: [buildVersion] });
    const blockers = this.issueManager.getReleaseBlocers(buildVersion);
    const summary = this.issueManager.getSummary();

    let report = '';
    report += '═══════════════════════════════════════════════════════════\n';
    report += `RELEASE APPROVAL REPORT - Build ${buildVersion}\n`;
    report += '═══════════════════════════════════════════════════════════\n\n';

    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Issues in Build: ${versionIssues.length}\n`;
    report += `Critical Blockers: ${blockers.length}\n\n`;

    if (blockers.length > 0) {
      report += '⛔ RELEASE BLOCKED - Critical issues must be resolved:\n';
      report += '───────────────────────────────────────────────────────────\n';
      blockers.forEach(issue => {
        report += `  • ${issue.issueId}: ${issue.title}\n`;
        report += `    Component: ${issue.affectedComponents.join(', ')}\n`;
        report += `    Action: ${issue.recommendedAction}\n\n`;
      });
    } else {
      report += '✓ NO CRITICAL BLOCKERS - Release is approved\n\n';
    }

    report += 'Issue Summary:\n';
    report += `  Open: ${summary.openCount} | Critical: ${summary.criticalCount}\n`;
    report += `  Resolved: ${versionIssues.filter(i => i.status === 'CLOSED').length}\n`;
    report += '\n═══════════════════════════════════════════════════════════\n';

    return report;
  }
}
