/**
 * Governance Framework Adapter
 * 
 * Connects API Discovery Framework output to Governance Report Format
 * Exports API risks in governance-compatible format
 */

import {
  ApiFunctionalReport,
  SmokeTestReport,
} from '../api-discovery.types';

/**
 * Simple adapter to generate governance-compatible reports from API Discovery
 */
export class GovernanceAdapterService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_projectName: string = 'API Discovery Analysis') {}

  /**
   * Generate governance report from API analysis
   */
  async generateGovernanceReport(
    report: ApiFunctionalReport,
    smokeReport: SmokeTestReport
  ): Promise<{
    failures: number;
    criticalRisks: number;
    highRisks: number;
    canRelease: boolean;
    healthScore: number;
    summary: string;
  }> {
    // Calculate release decision
    const passRate = smokeReport.passRate || 0;
    const criticalRisks = report.riskSummary?.criticalRisks || 0;
    const highRisks = report.riskSummary?.highRisks || 0;

    const canRelease = passRate > 80 && criticalRisks === 0;

    return {
      failures: smokeReport.failedTests || 0,
      criticalRisks,
      highRisks,
      canRelease,
      healthScore: report.apiHealthScore || 0,
      summary: `API Health: ${report.overallHealth} | Tests: ${smokeReport.passRate?.toFixed(1) || 0}% | Risks: ${criticalRisks} Critical, ${highRisks} High`,
    };
  }

  /**
   * Make release decision
   */
  async makeReleaseDecision(
    report: ApiFunctionalReport,
    threshold: 'STRICT' | 'NORMAL' | 'RELAXED' = 'NORMAL'
  ): Promise<{ canRelease: boolean; reason: string }> {
    const passRate = report.smokeTestSummary?.passRate || 0;
    const criticalRisks = report.riskSummary?.criticalRisks || 0;
    const highRisks = report.riskSummary?.highRisks || 0;

    const canRelease =
      threshold === 'STRICT'
        ? passRate > 95 && criticalRisks === 0 && highRisks === 0
        : threshold === 'NORMAL'
          ? passRate > 80 && criticalRisks === 0
          : passRate > 50 && criticalRisks < 5;

    const reason = [
      `Pass Rate: ${passRate.toFixed(1)}%`,
      `Critical Risks: ${criticalRisks}`,
      `High Risks: ${highRisks}`,
      `Health Score: ${report.apiHealthScore}/100`,
    ].join(' | ');

    return { canRelease, reason };
  }
}

/**
 * Factory: Create adapter instance
 */
export async function createGovernanceAdapter(
  projectName?: string
): Promise<GovernanceAdapterService> {
  return new GovernanceAdapterService(projectName);
}
