/**
 * RecommendationEngineService - Erzeugt Empfehlungen für Management
 * Basiert auf Test-Ergebnissen und definierten Best Practices
 */

import { Recommendation } from '../types/governance-report.types';
import { SeverityLevel, SeverityAssessmentResult } from '../types/severity.types';

interface RecommendationContext {
  failureCount: number;
  passRate: number;
  coverage: number;
  flakynessIndex: number;
  regressionDetected: boolean;
  lintIssues: number;
  typeScriptErrors: number;
  slowTests: Array<{ name: string; duration: number }>;
}

export class RecommendationEngineService {
  private recommendationCounter = 0;

  /**
   * Erzeugt Empfehlungen basierend auf Test-Ergebnissen
   */
  public generateRecommendations(
    severityAssessment: SeverityAssessmentResult,
    context: RecommendationContext,
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 1. Critical Issues Recommendations
    if (severityAssessment.byLevel[SeverityLevel.CRITICAL] > 0) {
      recommendations.push(...this.generateCriticalRecommendations(context));
    }

    // 2. Coverage Recommendations
    if (context.coverage < 80) {
      recommendations.push(...this.generateCoverageRecommendations(context));
    }

    // 3. Performance Recommendations
    if (context.flakynessIndex > 30 || context.slowTests.length > 0) {
      recommendations.push(...this.generatePerformanceRecommendations(context));
    }

    // 4. Code Quality Recommendations
    if (context.lintIssues > 0 || context.typeScriptErrors > 0) {
      recommendations.push(...this.generateQualityRecommendations(context));
    }

    // 5. Regression Recommendations
    if (context.regressionDetected) {
      recommendations.push(this.generateRegressionRecommendation());
    }

    // 6. General Best Practice Recommendations
    recommendations.push(...this.generateBestPracticeRecommendations(context));

    // Sortieren nach Priorität
    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Erzeugt prioritätsgeordnete Action Items für Management
   */
  public generateActionItems(recommendations: Recommendation[]): string[] {
    return recommendations
      .filter(r => r.severity === SeverityLevel.CRITICAL || r.severity === SeverityLevel.HIGH)
      .map(r => `[${r.severity}] ${r.title}: ${r.action}`);
  }

  /**
   * Erstellt einen 30/60/90-Tage-Plan basierend auf Empfehlungen
   */
  public generateExecutionPlan(recommendations: Recommendation[]): {
    immediate: Recommendation[];
    short_term: Recommendation[];
    long_term: Recommendation[];
  } {
    return {
      immediate: recommendations.filter(r => r.estimatedEffort === 'QUICK'),
      short_term: recommendations.filter(r => r.estimatedEffort === 'MEDIUM'),
      long_term: recommendations.filter(r => r.estimatedEffort === 'LONG'),
    };
  }

  // ============= Private Hilfsmethoden =============

  private generateCriticalRecommendations(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (context.failureCount > 5) {
      recommendations.push({
        id: this.generateId('REC-CRITICAL'),
        title: 'Immediate Test Failure Triage',
        description: `${context.failureCount} critical test failures detected. Requires immediate investigation.`,
        severity: SeverityLevel.CRITICAL,
        priority: 1,
        action: 'Schedule emergency debugging session. Review failing test stack traces and reproduction steps.',
        expectedOutcome: 'All critical test failures resolved and root causes documented',
        estimatedEffort: 'LONG',
        affectedAreas: ['Testing', 'QA', 'Development'],
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        ownerTeam: 'QA Engineering',
      });
    }

    if (context.passRate < 70) {
      recommendations.push({
        id: this.generateId('REC-CRITICAL'),
        title: 'Critical Pass Rate Degradation',
        description: `Pass rate fallen to ${context.passRate.toFixed(2)}%. This indicates systemic quality issues.`,
        severity: SeverityLevel.CRITICAL,
        priority: 2,
        action: 'Implement regression testing protocol. Run full test suite against last known good build.',
        expectedOutcome: 'Pass rate restored to minimum 90%',
        estimatedEffort: 'LONG',
        affectedAreas: ['Testing', 'CI/CD'],
        ownerTeam: 'QA Engineering',
      });
    }

    return recommendations;
  }

  private generateCoverageRecommendations(context: RecommendationContext): Recommendation[] {
    const gap = 80 - context.coverage;

    return [
      {
        id: this.generateId('REC-COVERAGE'),
        title: 'Increase Test Coverage',
        description: `Current coverage: ${context.coverage.toFixed(2)}%. Target: 80%. Gap: ${gap.toFixed(2)}%`,
        severity: gap > 10 ? SeverityLevel.HIGH : SeverityLevel.MEDIUM,
        priority: gap > 10 ? 3 : 5,
        action: `Add unit tests for uncovered modules. Focus on critical path code. Use coverage report to identify gaps.`,
        expectedOutcome: `Test coverage increased to 80% or above`,
        estimatedEffort: gap > 10 ? 'LONG' : 'MEDIUM',
        affectedAreas: ['Testing', 'Development'],
        ownerTeam: 'Development Team',
      },
    ];
  }

  private generatePerformanceRecommendations(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (context.flakynessIndex > 30) {
      recommendations.push({
        id: this.generateId('REC-FLAKY'),
        title: 'Reduce Test Flakiness',
        description: `Flakiness index: ${context.flakynessIndex}. Tests are unreliable and need stabilization.`,
        severity: SeverityLevel.HIGH,
        priority: 4,
        action: 'Review async test handling. Add proper waits and retries. Check for race conditions.',
        expectedOutcome: 'Flakiness index reduced below 15. All tests pass consistently.',
        estimatedEffort: 'MEDIUM',
        affectedAreas: ['Testing', 'Infrastructure'],
        ownerTeam: 'QA Engineering',
      });
    }

    if (context.slowTests.length > 0) {
      const slowestTest = context.slowTests[0];
      recommendations.push({
        id: this.generateId('REC-PERF'),
        title: 'Optimize Test Performance',
        description: `Slowest test takes ${slowestTest.duration}ms. Test suite execution is slow.`,
        severity: SeverityLevel.MEDIUM,
        priority: 7,
        action: `Optimize: ${slowestTest.name}. Consider parallel execution, mocking external calls, or test segmentation.`,
        expectedOutcome: 'Reduce average test execution time by 30%',
        estimatedEffort: 'MEDIUM',
        affectedAreas: ['Testing', 'Infrastructure'],
        ownerTeam: 'Infrastructure Team',
      });
    }

    return recommendations;
  }

  private generateQualityRecommendations(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (context.lintIssues > 10) {
      recommendations.push({
        id: this.generateId('REC-LINT'),
        title: 'Code Style Compliance',
        description: `${context.lintIssues} ESLint violations found. Code style standards not met.`,
        severity: SeverityLevel.MEDIUM,
        priority: 6,
        action: 'Run: npm run format && npm run lint:fix. Review and fix remaining issues.',
        expectedOutcome: 'Zero ESLint violations. All code passes style standards.',
        estimatedEffort: 'QUICK',
        affectedAreas: ['Code Quality', 'Development'],
        ownerTeam: 'Development Team',
      });
    }

    if (context.typeScriptErrors > 5) {
      recommendations.push({
        id: this.generateId('REC-TS'),
        title: 'TypeScript Type Safety',
        description: `${context.typeScriptErrors} TypeScript errors. Strict mode violations detected.`,
        severity: SeverityLevel.HIGH,
        priority: 5,
        action: 'Fix all TypeScript errors. No implicit any, check all return types.',
        expectedOutcome: 'Zero TypeScript compilation errors',
        estimatedEffort: 'MEDIUM',
        affectedAreas: ['Code Quality', 'Development'],
        ownerTeam: 'Development Team',
      });
    }

    return recommendations;
  }

  private generateRegressionRecommendation(): Recommendation {
    return {
      id: this.generateId('REC-REGRESSION'),
      title: 'Address Test Regressions',
      description: 'New test failures detected compared to previous run. Possible regression introduced.',
      severity: SeverityLevel.HIGH,
      priority: 3,
      action: 'Compare with baseline build. Identify changes that caused regression. Review commits and code changes.',
      expectedOutcome: 'All regressions identified and fixed. Baseline test suite passes.',
      estimatedEffort: 'MEDIUM',
      affectedAreas: ['Testing', 'Development'],
      ownerTeam: 'QA & Development',
    };
  }

  private generateBestPracticeRecommendations(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Continuous Integration Best Practice
    if (context.failureCount > 0) {
      recommendations.push({
        id: this.generateId('REC-CI'),
        title: 'Strengthen CI Pipeline',
        description: 'Test failures indicate CI pipeline gaps or inadequate test coverage.',
        severity: SeverityLevel.MEDIUM,
        priority: 8,
        action: 'Review CI configuration. Add pre-commit hooks. Implement test result notifications.',
        expectedOutcome: 'CI catches all regressions before merge. Zero surprises in production.',
        estimatedEffort: 'MEDIUM',
        affectedAreas: ['CI/CD', 'Infrastructure'],
        ownerTeam: 'DevOps Team',
      });
    }

    // Documentation
    recommendations.push({
      id: this.generateId('REC-DOCS'),
      title: 'Maintain Test Documentation',
      description: 'Ensure all test suites have clear documentation and are maintainable.',
      severity: SeverityLevel.LOW,
      priority: 9,
      action: 'Document test structure, setup/teardown logic, and common test patterns.',
      expectedOutcome: 'All tests have clear documentation. Onboarding faster for new developers.',
      estimatedEffort: 'QUICK',
      affectedAreas: ['Documentation', 'Knowledge Transfer'],
      ownerTeam: 'Development Team',
    });

    return recommendations;
  }

  private generateId(prefix: string): string {
    this.recommendationCounter++;
    return `${prefix}-${String(this.recommendationCounter).padStart(3, '0')}`;
  }
}
