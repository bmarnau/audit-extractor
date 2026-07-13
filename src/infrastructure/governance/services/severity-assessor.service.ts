/**
 * SeverityAssessorService - Bestimmt Schweregrad von Testfehlern
 * Ordnet Fehler nach Kritikalität für Release-Entscheidungen
 */

import { SeverityLevel, SeverityMetrics, SeverityAssessmentResult } from '../types/severity.types';
import { TestFailure } from '../types/governance-report.types';

interface SeverityContext {
  totalTests: number;
  passRate: number;
  coverage: number;
  hasRegressions: boolean;
  affectedModules: string[];
}

export class SeverityAssessorService {
  private readonly CRITICAL_MODULES = ['core', 'infrastructure', 'validation', 'extraction-engine'];
  private readonly INTEGRATION_MODULES = ['integration', 'api', 'database'];
  private readonly OPTIONAL_MODULES = ['docs', 'examples', 'scripts'];

  /**
   * Bewertet Schweregrad für einen einzelnen Fehler
   */
  public assessFailure(failure: TestFailure, context: SeverityContext): SeverityMetrics {
    const score = this.calculateSeverityScore(failure, context);
    const level = this.scoreToLevel(score);
    const affectedSystems = this.identifyAffectedSystems(failure);
    const impactArea = this.classifyImpactArea(failure.testFile);

    return {
      level,
      score,
      affectedSystems,
      impactArea,
      blocksRelease: level === SeverityLevel.CRITICAL,
      requiresHotfix: level === SeverityLevel.HIGH,
    };
  }

  /**
   * Bewertet alle Fehler und erzeugt einen SeverityAssessmentResult
   */
  public assessAllFailures(failures: TestFailure[], context: SeverityContext): SeverityAssessmentResult {
    const assessments = failures.map(f => this.assessFailure(f, context));

    const byLevel = {
      [SeverityLevel.CRITICAL]: 0,
      [SeverityLevel.HIGH]: 0,
      [SeverityLevel.MEDIUM]: 0,
      [SeverityLevel.LOW]: 0,
      [SeverityLevel.INFO]: 0,
    };

    assessments.forEach(assessment => {
      byLevel[assessment.level]++;
    });

    const criticalIssues = assessments
      .filter(a => a.level === SeverityLevel.CRITICAL)
      .map((a, i) => failures[i].error);

    const overallRisk = this.calculateOverallRisk(byLevel, context);

    return {
      timestamp: new Date().toISOString(),
      totalIssues: failures.length,
      byLevel,
      criticalIssues,
      overallRisk,
      assessmentDetails: assessments,
    };
  }

  /**
   * Bewertet Compliance-Status
   */
  public assessCompliance(
    lintErrors: number,
    typeErrors: number,
    coverageGap: number,
  ): SeverityLevel {
    if (lintErrors > 50 || typeErrors > 20 || coverageGap > 20) {
      return SeverityLevel.CRITICAL;
    }
    if (lintErrors > 20 || typeErrors > 10 || coverageGap > 10) {
      return SeverityLevel.HIGH;
    }
    if (lintErrors > 5 || typeErrors > 3 || coverageGap > 5) {
      return SeverityLevel.MEDIUM;
    }
    return SeverityLevel.INFO;
  }

  /**
   * Bewertet Code Coverage Impact
   */
  public assessCoverageImpact(coverage: number, targetCoverage: number = 80): SeverityLevel {
    const gap = targetCoverage - coverage;

    if (gap > 20) return SeverityLevel.CRITICAL;
    if (gap > 10) return SeverityLevel.HIGH;
    if (gap > 5) return SeverityLevel.MEDIUM;
    if (gap > 0) return SeverityLevel.LOW;
    return SeverityLevel.INFO;
  }

  /**
   * Bewertet Performance/Flakiness
   */
  public assessFlakiness(flakynessIndex: number): SeverityLevel {
    // flakynessIndex: 0-100, höher = flakier
    if (flakynessIndex > 70) return SeverityLevel.CRITICAL;
    if (flakynessIndex > 50) return SeverityLevel.HIGH;
    if (flakynessIndex > 30) return SeverityLevel.MEDIUM;
    if (flakynessIndex > 10) return SeverityLevel.LOW;
    return SeverityLevel.INFO;
  }

  /**
   * Erzeugt einen Schweregrad-Report für Management
   */
  public generateSeverityReport(assessmentResult: SeverityAssessmentResult): {
    summary: string;
    actionItems: string[];
    escalationRequired: boolean;
  } {
    const critical = assessmentResult.byLevel[SeverityLevel.CRITICAL];
    const high = assessmentResult.byLevel[SeverityLevel.HIGH];

    let summary = `Test Governance Assessment: ${assessmentResult.totalIssues} issues identified.\n`;
    summary += `Risk Level: ${assessmentResult.overallRisk}\n`;
    summary += `Critical: ${critical} | High: ${high} | Medium: ${assessmentResult.byLevel[SeverityLevel.MEDIUM]} | Low: ${assessmentResult.byLevel[SeverityLevel.LOW]} | Info: ${assessmentResult.byLevel[SeverityLevel.INFO]}\n`;

    const actionItems: string[] = [];
    if (critical > 0) {
      actionItems.push(`🔴 CRITICAL: ${critical} issue(s) MUST be fixed before release`);
    }
    if (high > 0) {
      actionItems.push(`🟠 HIGH: ${high} issue(s) should be addressed`);
    }
    if (assessmentResult.overallRisk === 'DANGER') {
      actionItems.push('⚠️ Overall risk assessment: DANGER - Recommend blocking release');
    }

    return {
      summary,
      actionItems,
      escalationRequired: critical > 0 || assessmentResult.overallRisk === 'DANGER',
    };
  }

  // ============= Private Hilfsmethoden =============

  private calculateSeverityScore(failure: TestFailure, context: SeverityContext): number {
    let score = 30; // Basis

    // Test-Kategorie Impact
    if (failure.category === 'unit') score += 10;
    if (failure.category === 'integration') score += 20;
    if (failure.category === 'e2e') score += 25;

    // Modul-Kritikalität
    const isCriticalModule = this.CRITICAL_MODULES.some(m => failure.testFile.includes(m));
    if (isCriticalModule) score += 30;

    // Pass Rate Impact
    if (context.passRate < 80) score += 20;
    if (context.passRate < 60) score += 20;

    // Coverage Impact
    if (context.coverage < 50) score += 15;
    if (context.coverage < 70) score += 10;

    // Regression
    if (context.hasRegressions) score += 15;

    // Fehlertyp-Spezifik
    if (failure.error.includes('CRITICAL') || failure.error.includes('SECURITY')) score += 20;
    if (failure.error.includes('async') || failure.error.includes('timeout')) score += 10;

    return Math.min(score, 100);
  }

  private scoreToLevel(score: number): SeverityLevel {
    if (score >= 90) return SeverityLevel.CRITICAL;
    if (score >= 70) return SeverityLevel.HIGH;
    if (score >= 50) return SeverityLevel.MEDIUM;
    if (score >= 30) return SeverityLevel.LOW;
    return SeverityLevel.INFO;
  }

  private identifyAffectedSystems(failure: TestFailure): string[] {
    const affected: string[] = [];

    if (failure.testFile.includes('extraction')) affected.push('ExtractionEngine');
    if (failure.testFile.includes('validation')) affected.push('ValidationLayer');
    if (failure.testFile.includes('api') || failure.testFile.includes('server')) affected.push('API');
    if (failure.testFile.includes('database') || failure.testFile.includes('postgres')) affected.push('Database');
    if (failure.testFile.includes('frontend') || failure.testFile.includes('component')) affected.push('Frontend');
    if (failure.testFile.includes('governance')) affected.push('GovernanceFramework');

    return affected.length > 0 ? affected : ['Unknown'];
  }

  private classifyImpactArea(filePath: string): 'core' | 'integration' | 'optional' | 'documentation' {
    if (filePath.includes('docs') || filePath.includes('documentation')) return 'documentation';
    if (this.CRITICAL_MODULES.some(m => filePath.includes(m))) return 'core';
    if (this.INTEGRATION_MODULES.some(m => filePath.includes(m))) return 'integration';
    return 'optional';
  }

  private calculateOverallRisk(
    byLevel: Record<SeverityLevel, number>,
    context: SeverityContext,
  ): 'SAFE' | 'CAUTION' | 'DANGER' {
    // DANGER: Critical issues oder sehr niedriger PassRate
    if (byLevel[SeverityLevel.CRITICAL] > 0 || context.passRate < 70) {
      return 'DANGER';
    }

    // CAUTION: High issues oder Coverage Gap
    if (byLevel[SeverityLevel.HIGH] > 2 || (80 - context.coverage) > 10) {
      return 'CAUTION';
    }

    // SAFE: Alles unter Kontrolle
    return 'SAFE';
  }
}
