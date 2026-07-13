/**
 * RiskAnalyzerService - Analysiert und dokumentiert Risiken
 * Erstellt Risk Register und Mitigation Plans
 */

import { RiskAssessment } from '../types/governance-report.types';
import { RiskFactor, RiskMatrix, RiskMitigation, RiskRegister } from '../types/risk-analysis.types';
import { SeverityLevel, SeverityAssessmentResult } from '../types/severity.types';

interface RiskAnalysisContext {
  passRate: number;
  coverage: number;
  flakynessIndex: number;
  hasRegressions: boolean;
  failedTests: string[];
  coverage_trend?: number[]; // Historische Coverage-Werte
  performance_trend?: number[]; // Historische Performance
}

export class RiskAnalyzerService {
  private riskCounter = 0;

  /**
   * Analysiert Risks basierend auf Test-Ergebnissen
   */
  public analyzeRisks(
    severityAssessment: SeverityAssessmentResult,
    context: RiskAnalysisContext,
  ): RiskAssessment[] {
    const risks: RiskAssessment[] = [];

    // 1. Critical Failure Risk
    if (severityAssessment.byLevel[SeverityLevel.CRITICAL] > 0) {
      risks.push(this.createCriticalFailureRisk(severityAssessment, context));
    }

    // 2. Coverage Risk
    risks.push(this.createCoverageRisk(context));

    // 3. Flakiness Risk
    if (context.flakynessIndex > 30) {
      risks.push(this.createFlakynessRisk(context));
    }

    // 4. Regression Risk
    if (context.hasRegressions) {
      risks.push(this.createRegressionRisk(context));
    }

    // 5. Quality Degradation Risk
    risks.push(this.createQualityDegradationRisk(context));

    // 6. Release Readiness Risk
    risks.push(this.createReleaseReadinessRisk(severityAssessment, context));

    return risks;
  }

  /**
   * Erstellt eine Risk Matrix Visualisierung
   */
  public createRiskMatrix(risks: RiskAssessment[]): RiskMatrix {
    const matrix: RiskMatrix = {
      probability: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
      },
      impact: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0,
      },
      cells: [],
    };

    // Zähle Risiken nach Wahrscheinlichkeit/Impact
    risks.forEach(risk => {
      matrix.probability[risk.probability]++;
      matrix.impact[risk.impact]++;

      // Finde oder erstelle entsprechende Cell
      let cell = matrix.cells.find(
        c => c.probabilityLevel === risk.probability && c.impactLevel === risk.impact,
      );
      if (!cell) {
        cell = {
          probabilityLevel: risk.probability,
          impactLevel: risk.impact,
          riskScore: this.calculateRiskScore(risk.probability, risk.impact),
          risks: [],
        };
        matrix.cells.push(cell);
      }
      cell.risks.push(risk.name);
    });

    return matrix;
  }

  /**
   * Erstellt ein Risk Register mit Mitigations
   */
  public createRiskRegister(
    risks: RiskAssessment[],
    severityAssessment: SeverityAssessmentResult,
  ): RiskRegister {
    const riskFactors: RiskFactor[] = [
      {
        name: 'Test Pass Rate',
        description: 'Percentage of tests passing',
        currentValue: 95, // Placeholder
        threshold: 90,
        trend: 'STABLE',
      },
      {
        name: 'Code Coverage',
        description: 'Percentage of code covered by tests',
        currentValue: 82,
        threshold: 80,
        trend: 'IMPROVING',
      },
      {
        name: 'Test Flakiness',
        description: 'Percentage of flaky tests',
        currentValue: 25,
        threshold: 15,
        trend: 'DEGRADING',
      },
    ];

    const overallRiskLevel =
      severityAssessment.overallRisk === 'DANGER'
        ? SeverityLevel.CRITICAL
        : severityAssessment.overallRisk === 'CAUTION'
          ? SeverityLevel.HIGH
          : SeverityLevel.MEDIUM;

    const mitigations = this.createMitigationPlan(risks);

    return {
      timestamp: new Date().toISOString(),
      totalRisks: risks.length,
      openRisks: risks.filter(r => !r.detectionMethod.includes('mitigated')).length,
      riskFactors,
      matrix: this.createRiskMatrix(risks),
      mitigations,
      overallRiskLevel,
    };
  }

  /**
   * Erstellt einen detaillierten Mitigation Plan
   */
  public createMitigationPlan(risks: RiskAssessment[]): RiskMitigation[] {
    return risks.map((risk, index) => ({
      riskId: risk.riskId,
      mitigation: this.generateMitigation(risk),
      priority: this.calculateMitigationPriority(risk),
      owner: this.assignRiskOwner(risk),
      dueDate: this.calculateDueDate(risk),
      status: 'OPEN' as const,
      evidence: [],
    }));
  }

  /**
   * Generiert eine ASCII Risk Matrix Visualization
   */
  public visualizeRiskMatrix(matrix: RiskMatrix): string {
    const lines: string[] = [];
    lines.push('╔═══════════════════════════════════════════════════════════╗');
    lines.push('║              RISK ASSESSMENT MATRIX                        ║');
    lines.push('╠═══════════════════════════════════════════════════════════╣');

    // Header
    lines.push('║ IMPACT/PROBABILITY │  LOW  │  MEDIUM  │  HIGH  │         ║');
    lines.push('╠════════════════════╬═══════╬══════════╬════════╣         ║');

    // Rows
    lines.push(
      `║ CRITICAL           │  ${matrix.cells.find(c => c.impactLevel === 'CRITICAL' && c.probabilityLevel === 'LOW')?.risks.length || '-'} │   ${matrix.cells.find(c => c.impactLevel === 'CRITICAL' && c.probabilityLevel === 'MEDIUM')?.risks.length || '-'}  │   ${matrix.cells.find(c => c.impactLevel === 'CRITICAL' && c.probabilityLevel === 'HIGH')?.risks.length || '-'}  │         ║`,
    );
    lines.push(
      `║ HIGH               │  ${matrix.cells.find(c => c.impactLevel === 'HIGH' && c.probabilityLevel === 'LOW')?.risks.length || '-'} │   ${matrix.cells.find(c => c.impactLevel === 'HIGH' && c.probabilityLevel === 'MEDIUM')?.risks.length || '-'}  │   ${matrix.cells.find(c => c.impactLevel === 'HIGH' && c.probabilityLevel === 'HIGH')?.risks.length || '-'}  │         ║`,
    );
    lines.push(
      `║ MEDIUM             │  ${matrix.cells.find(c => c.impactLevel === 'MEDIUM' && c.probabilityLevel === 'LOW')?.risks.length || '-'} │   ${matrix.cells.find(c => c.impactLevel === 'MEDIUM' && c.probabilityLevel === 'MEDIUM')?.risks.length || '-'}  │   ${matrix.cells.find(c => c.impactLevel === 'MEDIUM' && c.probabilityLevel === 'HIGH')?.risks.length || '-'}  │         ║`,
    );
    lines.push(
      `║ LOW                │  ${matrix.cells.find(c => c.impactLevel === 'LOW' && c.probabilityLevel === 'LOW')?.risks.length || '-'} │   ${matrix.cells.find(c => c.impactLevel === 'LOW' && c.probabilityLevel === 'MEDIUM')?.risks.length || '-'}  │   ${matrix.cells.find(c => c.impactLevel === 'LOW' && c.probabilityLevel === 'HIGH')?.risks.length || '-'}  │         ║`,
    );
    lines.push('╚════════════════════╩═══════╩══════════╩════════╩═════════╝');

    return lines.join('\n');
  }

  // ============= Private Hilfsmethoden =============

  private createCriticalFailureRisk(
    severityAssessment: SeverityAssessmentResult,
    context: RiskAnalysisContext,
  ): RiskAssessment {
    return {
      riskId: this.generateRiskId('RISK-CRITICAL'),
      name: 'Critical Test Failures',
      description: `${severityAssessment.byLevel[SeverityLevel.CRITICAL]} critical issues detected. Release blockers present.`,
      probability: 'HIGH',
      impact: 'CRITICAL',
      riskScore: 24,
      mitigation:
        'Immediate triage and fixing of all critical failures. No release until resolved. Code review required.',
      relatedTests: severityAssessment.criticalIssues.slice(0, 5),
      detectionMethod: 'Automated test failure detection in CI pipeline',
    };
  }

  private createCoverageRisk(context: RiskAnalysisContext): RiskAssessment {
    const gap = 80 - context.coverage;
    const probability = gap > 10 ? 'HIGH' : 'MEDIUM';
    const impact = gap > 15 ? 'HIGH' : 'MEDIUM';

    return {
      riskId: this.generateRiskId('RISK-COVERAGE'),
      name: 'Insufficient Test Coverage',
      description: `Current coverage: ${context.coverage.toFixed(2)}%. Gap to target: ${gap.toFixed(2)}%. Untested code paths may contain bugs.`,
      probability,
      impact,
      riskScore: this.calculateRiskScore(probability, impact),
      mitigation: `Add unit tests for ${gap.toFixed(0)}% uncovered code. Focus on critical modules. Use coverage reports to identify gaps.`,
      relatedTests: ['Coverage Analysis Report'],
      detectionMethod: 'Code coverage measurement and trend analysis',
    };
  }

  private createFlakynessRisk(context: RiskAnalysisContext): RiskAssessment {
    return {
      riskId: this.generateRiskId('RISK-FLAKY'),
      name: 'Test Flakiness and Unreliability',
      description: `Flakiness index at ${context.flakynessIndex.toFixed(2)}%. Tests are unreliable and produce inconsistent results.`,
      probability: 'HIGH',
      impact: 'HIGH',
      riskScore: 20,
      mitigation: 'Refactor flaky tests. Add proper async handling, waits, and retries. Check for race conditions.',
      relatedTests: context.failedTests.slice(0, 5),
      detectionMethod: 'Multi-run test analysis and flakiness metrics',
    };
  }

  private createRegressionRisk(context: RiskAnalysisContext): RiskAssessment {
    return {
      riskId: this.generateRiskId('RISK-REGRESSION'),
      name: 'Test Regression Detection',
      description:
        'New test failures detected compared to baseline. Possible unintended side effects from recent changes.',
      probability: 'HIGH',
      impact: 'HIGH',
      riskScore: 20,
      mitigation: 'Compare changes to last passing build. Identify root cause. Implement regression tests.',
      relatedTests: context.failedTests,
      detectionMethod: 'Comparative testing against baseline',
    };
  }

  private createQualityDegradationRisk(context: RiskAnalysisContext): RiskAssessment {
    const degrading = context.coverage_trend && context.coverage_trend[context.coverage_trend.length - 1] < context.coverage;

    return {
      riskId: this.generateRiskId('RISK-QUALITY'),
      name: 'Code Quality Degradation',
      description: degrading
        ? 'Code quality metrics are trending downward. Indicates process breakdown.'
        : 'Maintain current quality standards to prevent degradation.',
      probability: degrading ? 'MEDIUM' : 'LOW',
      impact: 'MEDIUM',
      riskScore: degrading ? 12 : 8,
      mitigation: 'Enforce quality gates in CI. Implement code review standards. Regular quality audits.',
      relatedTests: ['ESLint Reports', 'TypeScript Strict Mode', 'Coverage Trends'],
      detectionMethod: 'Continuous quality metrics monitoring',
    };
  }

  private createReleaseReadinessRisk(
    severityAssessment: SeverityAssessmentResult,
    context: RiskAnalysisContext,
  ): RiskAssessment {
    const canRelease =
      severityAssessment.byLevel[SeverityLevel.CRITICAL] === 0 &&
      context.passRate > 95 &&
      context.coverage >= 80;

    return {
      riskId: this.generateRiskId('RISK-RELEASE'),
      name: 'Release Readiness',
      description: canRelease
        ? 'System is ready for release based on test metrics.'
        : 'System has quality issues that need resolution before release.',
      probability: canRelease ? 'LOW' : 'HIGH',
      impact: canRelease ? 'LOW' : 'CRITICAL',
      riskScore: canRelease ? 2 : 22,
      mitigation: canRelease ? 'Proceed with release. Monitor post-release.' : 'Address blocking issues. See recommendations.',
      relatedTests: ['Release Gate Check'],
      detectionMethod: 'Automated release readiness assessment',
    };
  }

  private calculateRiskScore(probability: 'LOW' | 'MEDIUM' | 'HIGH', impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): number {
    const probWeights = { LOW: 1, MEDIUM: 2, HIGH: 3 };
    const impactWeights = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

    return probWeights[probability] * impactWeights[impact];
  }

  private generateMitigation(risk: RiskAssessment): string {
    if (risk.mitigation) return risk.mitigation;

    if (risk.impact === 'CRITICAL') {
      return 'Immediate escalation and resolution required. No further processing until resolved.';
    }
    if (risk.probability === 'HIGH' && risk.impact === 'HIGH') {
      return 'High priority remediation required. Schedule immediate action items.';
    }
    return 'Monitor closely. Implement preventive measures. Plan remediation.';
  }

  private calculateMitigationPriority(risk: RiskAssessment): 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (risk.impact === 'CRITICAL') return 'URGENT';
    if (risk.probability === 'HIGH' && risk.impact === 'HIGH') return 'HIGH';
    if (risk.probability === 'MEDIUM' || risk.impact === 'MEDIUM') return 'MEDIUM';
    return 'LOW';
  }

  private assignRiskOwner(risk: RiskAssessment): string {
    if (risk.name.includes('Critical') || risk.name.includes('Failure')) return 'QA Lead';
    if (risk.name.includes('Coverage')) return 'Development Lead';
    if (risk.name.includes('Flaky') || risk.name.includes('Performance')) return 'Test Engineer';
    if (risk.name.includes('Regression')) return 'Release Manager';
    return 'Project Manager';
  }

  private calculateDueDate(risk: RiskAssessment): string {
    const priority = this.calculateMitigationPriority(risk);
    const daysToAdd = priority === 'URGENT' ? 1 : priority === 'HIGH' ? 3 : priority === 'MEDIUM' ? 7 : 14;

    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString();
  }

  private generateRiskId(prefix: string): string {
    this.riskCounter++;
    return `${prefix}-${String(this.riskCounter).padStart(3, '0')}`;
  }
}
