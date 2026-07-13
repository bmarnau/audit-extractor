/**
 * ReleaseDecisionService - Trifft Releaseentscheidungen
 * Basiert auf Test-Qualität, Risikoanalyse und Management-Vorgaben
 */

import { ReleaseDecision } from '../types/governance-report.types';
import { SeverityLevel, SeverityAssessmentResult } from '../types/severity.types';

interface ReleaseContext {
  totalTests: number;
  passedTests: number;
  passRate: number;
  coverage: number;
  criticalIssues: number;
  highIssues: number;
  hasRegressions: boolean;
  flakynessIndex: number;
  lintIssues: number;
  typeScriptErrors: number;
  requireAllChecksPass?: boolean; // Strict mode
  allowConditionalRelease?: boolean;
}

export class ReleaseDecisionService {
  private readonly PASS_RATE_THRESHOLD = 95;
  private readonly COVERAGE_THRESHOLD = 80;
  private readonly FLAKINESS_THRESHOLD = 15;
  private readonly MAX_LINT_ISSUES = 5;
  private readonly MAX_TS_ERRORS = 2;

  /**
   * Trifft die finale Release-Entscheidung
   */
  public makeReleaseDecision(
    severityAssessment: SeverityAssessmentResult,
    context: ReleaseContext,
  ): ReleaseDecision {
    const releaseBlockers = this.identifyReleaseBlockers(severityAssessment, context);
    const warnings = this.identifyWarnings(context);
    const recommendedActions = this.generateRecommendedActions(context);

    const canRelease = releaseBlockers.length === 0 && !context.requireAllChecksPass;
    const approvalLevel = this.determineApprovalLevel(releaseBlockers, warnings, context);
    const reasoning = this.generateReasoning(canRelease, releaseBlockers, warnings, context);

    return {
      canRelease,
      releaseBlockers,
      warnings,
      recommendedActions,
      approvalLevel,
      reasoning,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Erstellt einen Release Checklist
   */
  public createReleaseChecklist(context: ReleaseContext): {
    items: Array<{ name: string; status: 'PASS' | 'FAIL' | 'WARNING' }>;
    passedItems: number;
    failedItems: number;
    totalItems: number;
  } {
    const items: Array<{ name: string; status: 'PASS' | 'FAIL' | 'WARNING' }> = [];

    // Test Pass Rate
    if (context.passRate >= this.PASS_RATE_THRESHOLD) {
      items.push({ name: `Test Pass Rate: ${context.passRate.toFixed(2)}%`, status: 'PASS' });
    } else if (context.passRate >= 90) {
      items.push({ name: `Test Pass Rate: ${context.passRate.toFixed(2)}% (below 95%)`, status: 'WARNING' });
    } else {
      items.push({ name: `Test Pass Rate: ${context.passRate.toFixed(2)}% (CRITICAL)`, status: 'FAIL' });
    }

    // Code Coverage
    if (context.coverage >= this.COVERAGE_THRESHOLD) {
      items.push({ name: `Code Coverage: ${context.coverage.toFixed(2)}%`, status: 'PASS' });
    } else if (context.coverage >= 75) {
      items.push({ name: `Code Coverage: ${context.coverage.toFixed(2)}% (below 80%)`, status: 'WARNING' });
    } else {
      items.push({ name: `Code Coverage: ${context.coverage.toFixed(2)}% (CRITICAL)`, status: 'FAIL' });
    }

    // Critical Issues
    items.push({
      name: `Critical Issues: ${context.criticalIssues}`,
      status: context.criticalIssues === 0 ? 'PASS' : 'FAIL',
    });

    // High Issues
    items.push({
      name: `High Priority Issues: ${context.highIssues}`,
      status: context.highIssues === 0 ? 'PASS' : context.highIssues <= 2 ? 'WARNING' : 'FAIL',
    });

    // Regressions
    items.push({
      name: `Regressions: ${context.hasRegressions ? 'DETECTED' : 'None'}`,
      status: context.hasRegressions ? 'FAIL' : 'PASS',
    });

    // Test Flakiness
    if (context.flakynessIndex <= this.FLAKINESS_THRESHOLD) {
      items.push({ name: `Test Flakiness: ${context.flakynessIndex.toFixed(2)}%`, status: 'PASS' });
    } else if (context.flakynessIndex <= 25) {
      items.push({ name: `Test Flakiness: ${context.flakynessIndex.toFixed(2)}% (HIGH)`, status: 'WARNING' });
    } else {
      items.push({ name: `Test Flakiness: ${context.flakynessIndex.toFixed(2)}% (CRITICAL)`, status: 'FAIL' });
    }

    // Code Quality (Lint)
    if (context.lintIssues <= this.MAX_LINT_ISSUES) {
      items.push({ name: `Lint Issues: ${context.lintIssues}`, status: 'PASS' });
    } else if (context.lintIssues <= 10) {
      items.push({ name: `Lint Issues: ${context.lintIssues} (above threshold)`, status: 'WARNING' });
    } else {
      items.push({ name: `Lint Issues: ${context.lintIssues} (CRITICAL)`, status: 'FAIL' });
    }

    // TypeScript Errors
    if (context.typeScriptErrors === 0) {
      items.push({ name: `TypeScript Errors: ${context.typeScriptErrors}`, status: 'PASS' });
    } else if (context.typeScriptErrors <= this.MAX_TS_ERRORS) {
      items.push({
        name: `TypeScript Errors: ${context.typeScriptErrors} (above threshold)`,
        status: 'WARNING',
      });
    } else {
      items.push({ name: `TypeScript Errors: ${context.typeScriptErrors} (CRITICAL)`, status: 'FAIL' });
    }

    const passedItems = items.filter(i => i.status === 'PASS').length;
    const failedItems = items.filter(i => i.status === 'FAIL').length;

    return {
      items,
      passedItems,
      failedItems,
      totalItems: items.length,
    };
  }

  /**
   * Erstellt einen Release Plan
   */
  public generateReleasePlan(decision: ReleaseDecision): {
    steps: Array<{ step: number; action: string; owner: string; duration: string }>;
    totalDuration: string;
    rollbackPlan: string;
  } {
    const steps: Array<{ step: number; action: string; owner: string; duration: string }> = [];

    if (decision.canRelease || decision.approvalLevel === 'CONDITIONAL') {
      steps.push(
        { step: 1, action: 'Execute final integration tests', owner: 'QA', duration: '30 min' },
        { step: 2, action: 'Prepare release notes and changelogs', owner: 'Release Manager', duration: '20 min' },
        { step: 3, action: 'Tag release in version control', owner: 'DevOps', duration: '5 min' },
        {
          step: 4,
          action: 'Build and sign release artifacts',
          owner: 'DevOps',
          duration: '15 min',
        },
        {
          step: 5,
          action: 'Deploy to staging environment',
          owner: 'DevOps',
          duration: '20 min',
        },
        {
          step: 6,
          action: 'Smoke test on staging',
          owner: 'QA',
          duration: '30 min',
        },
        {
          step: 7,
          action: 'Get release approval',
          owner: 'Release Manager',
          duration: '10 min',
        },
        {
          step: 8,
          action: 'Deploy to production',
          owner: 'DevOps',
          duration: '30 min',
        },
        {
          step: 9,
          action: 'Monitor production health metrics',
          owner: 'Operations',
          duration: '60 min',
        },
      );
    } else {
      steps.push(
        { step: 1, action: 'Address release blockers (see recommendations)', owner: 'Development', duration: 'Variable' },
        { step: 2, action: 'Re-run full test suite', owner: 'QA', duration: '30 min' },
        { step: 3, action: 'Reassess release readiness', owner: 'Release Manager', duration: '10 min' },
      );
    }

    return {
      steps,
      totalDuration: decision.canRelease ? '~3 hours' : 'Until blockers resolved',
      rollbackPlan: 'Maintain previous version container image. Document rollback triggers.',
    };
  }

  /**
   * Erstellt einen Management Summary
   */
  public generateManagementSummary(decision: ReleaseDecision, context: ReleaseContext): string {
    const lines: string[] = [];

    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('                  RELEASE DECISION REPORT                   ');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('');

    lines.push(`RECOMMENDATION: ${decision.approvalLevel}`);
    lines.push(`Status: ${decision.canRelease ? '✅ APPROVED FOR RELEASE' : '❌ BLOCKED - DO NOT RELEASE'}`);
    lines.push('');

    lines.push('QUALITY METRICS:');
    lines.push(`  • Pass Rate: ${context.passRate.toFixed(2)}% (Target: ${this.PASS_RATE_THRESHOLD}%)`);
    lines.push(`  • Coverage: ${context.coverage.toFixed(2)}% (Target: ${this.COVERAGE_THRESHOLD}%)`);
    lines.push(`  • Critical Issues: ${context.criticalIssues}`);
    lines.push(`  • High Issues: ${context.highIssues}`);
    lines.push('');

    if (decision.releaseBlockers.length > 0) {
      lines.push('BLOCKING ISSUES:');
      decision.releaseBlockers.forEach(blocker => {
        lines.push(`  ⛔ ${blocker}`);
      });
      lines.push('');
    }

    if (decision.warnings.length > 0) {
      lines.push('WARNINGS:');
      decision.warnings.forEach(warning => {
        lines.push(`  ⚠️ ${warning}`);
      });
      lines.push('');
    }

    lines.push('REASONING:');
    lines.push(decision.reasoning);
    lines.push('');

    if (decision.recommendedActions.length > 0) {
      lines.push('RECOMMENDED ACTIONS:');
      decision.recommendedActions.forEach((action, idx) => {
        lines.push(`  ${idx + 1}. ${action}`);
      });
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  // ============= Private Hilfsmethoden =============

  private identifyReleaseBlockers(severityAssessment: SeverityAssessmentResult, context: ReleaseContext): string[] {
    const blockers: string[] = [];

    if (context.criticalIssues > 0) {
      blockers.push(`${context.criticalIssues} CRITICAL issue(s) must be resolved`);
    }

    if (context.passRate < 85) {
      blockers.push(`Pass rate at ${context.passRate.toFixed(2)}% (minimum required: 85%)`);
    }

    if (context.coverage < 75) {
      blockers.push(`Code coverage at ${context.coverage.toFixed(2)}% (minimum required: 75%)`);
    }

    if (context.hasRegressions) {
      blockers.push('Test regressions detected - must be investigated and fixed');
    }

    if (context.typeScriptErrors > this.MAX_TS_ERRORS) {
      blockers.push(`TypeScript errors: ${context.typeScriptErrors} (maximum allowed: ${this.MAX_TS_ERRORS})`);
    }

    return blockers;
  }

  private identifyWarnings(context: ReleaseContext): string[] {
    const warnings: string[] = [];

    if (context.passRate < this.PASS_RATE_THRESHOLD) {
      warnings.push(`Pass rate below optimal threshold (${context.passRate.toFixed(2)}% vs ${this.PASS_RATE_THRESHOLD}%)`);
    }

    if (context.coverage < this.COVERAGE_THRESHOLD) {
      warnings.push(
        `Code coverage below target (${context.coverage.toFixed(2)}% vs ${this.COVERAGE_THRESHOLD}%)`,
      );
    }

    if (context.flakynessIndex > this.FLAKINESS_THRESHOLD) {
      warnings.push(`Test flakiness elevated (${context.flakynessIndex.toFixed(2)}% vs ${this.FLAKINESS_THRESHOLD}%)`);
    }

    if (context.highIssues > 0) {
      warnings.push(`${context.highIssues} high-priority issues should be addressed`);
    }

    if (context.lintIssues > this.MAX_LINT_ISSUES) {
      warnings.push(`Lint issues present (${context.lintIssues} vs ${this.MAX_LINT_ISSUES} threshold)`);
    }

    return warnings;
  }

  private generateRecommendedActions(context: ReleaseContext): string[] {
    const actions: string[] = [];

    if (context.passRate < 90) {
      actions.push('Schedule debugging session for failing tests');
    }

    if (context.coverage < 80) {
      actions.push('Add unit tests for uncovered code paths');
    }

    if (context.flakynessIndex > 20) {
      actions.push('Refactor flaky tests to improve reliability');
    }

    if (context.lintIssues > 5) {
      actions.push('Run linter auto-fix and review remaining issues');
    }

    actions.push('Run full regression test suite before deployment');
    actions.push('Prepare production monitoring dashboard');
    actions.push('Notify stakeholders of release timeline');

    return actions;
  }

  private determineApprovalLevel(
    blockers: string[],
    warnings: string[],
    context: ReleaseContext,
  ): 'APPROVED' | 'CONDITIONAL' | 'BLOCKED' {
    if (blockers.length > 0) {
      return 'BLOCKED';
    }

    if (warnings.length > 0 && context.allowConditionalRelease) {
      return 'CONDITIONAL';
    }

    if (warnings.length > 0) {
      return 'BLOCKED';
    }

    return 'APPROVED';
  }

  private generateReasoning(canRelease: boolean, blockers: string[], warnings: string[], context: ReleaseContext): string {
    if (blockers.length > 0) {
      return `Release is BLOCKED due to critical issues: ${blockers.join('; ')}. Address all blockers before attempting release.`;
    }

    if (warnings.length > 0) {
      return `Release can proceed with CAUTION. ${warnings.length} warnings identified: ${warnings.slice(0, 2).join('; ')}. Monitor these metrics post-release.`;
    }

    return `All release criteria met. System quality is at acceptable levels for production deployment. ${context.passRate.toFixed(2)}% pass rate, ${context.coverage.toFixed(2)}% coverage. Proceed with deployment.`;
  }
}
