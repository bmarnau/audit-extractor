/**
 * Test Result Formatter - Phase 38B
 * 
 * Hilft dabei, Test-Ergebnisse ins einheitliche Format umzuwandeln.
 */

import {
  TestRunMetadata,
  TestRunSummary,
  TestRunFindings,
  IndividualTestResult,
  TestFinding,
  generateRunId,
  calculatePassRate,
  determineStatus,
  createFinding,
  groupErrorsByType,
  RunId
} from '../models/TestResultModel';
import { Severity } from '../catalog';
import { severityEngine } from './SeverityEngine';

/**
 * Builder für TestRunMetadata
 */
export class MetadataBuilder {
  private runId: RunId;
  private startTime: Date;
  private endTime?: Date;
  private environment: any = {};
  private configuration: any = {};
  private context: any = {};
  private executionMode: 'FULL' | 'CRITICAL' | 'SMOKE' | 'SUBSET' = 'FULL';
  private notes?: string;

  constructor() {
    this.runId = generateRunId();
    this.startTime = new Date();
  }

  setRunId(runId: RunId): this {
    this.runId = runId;
    return this;
  }

  setEndTime(endTime: Date): this {
    this.endTime = endTime;
    return this;
  }

  setEnvironment(env: any): this {
    this.environment = env;
    return this;
  }

  setConfiguration(config: any): this {
    this.configuration = config;
    return this;
  }

  setContext(ctx: any): this {
    this.context = ctx;
    return this;
  }

  setExecutionMode(mode: 'FULL' | 'CRITICAL' | 'SMOKE' | 'SUBSET'): this {
    this.executionMode = mode;
    return this;
  }

  setNotes(notes: string): this {
    this.notes = notes;
    return this;
  }

  build(outputPaths: any): TestRunMetadata {
    const endTime = this.endTime || new Date();

    return {
      runId: this.runId,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalDurationMs: endTime.getTime() - this.startTime.getTime(),
      frameworkVersion: '1.0.0',
      catalogVersion: '1.0.0',
      environment: {
        host: this.environment.host || 'localhost',
        platform: this.environment.platform || process.platform,
        nodeVersion: this.environment.nodeVersion || process.version,
        workingDirectory: this.environment.workingDirectory || process.cwd(),
        ...this.environment
      },
      configuration: {
        parallel: this.configuration.parallel !== false,
        maxConcurrent: this.configuration.maxConcurrent || 4,
        timeoutMs: this.configuration.timeoutMs || 30000,
        ...this.configuration
      },
      context: {
        backendUrl: this.context.backendUrl || 'http://localhost:3000',
        frontendUrl: this.context.frontendUrl || 'http://localhost:5173',
        databaseUrl: this.context.databaseUrl || 'postgresql://localhost/extractor',
        redisUrl: this.context.redisUrl || 'redis://localhost:6379',
        ...this.context
      },
      executionMode: this.executionMode,
      notes: this.notes,
      outputPaths
    };
  }
}

/**
 * Builder für TestRunSummary
 */
export class SummaryBuilder {
  private runId: RunId;
  private results: IndividualTestResult[] = [];
  private byCategory: Map<string, IndividualTestResult[]> = new Map();

  constructor(runId: RunId) {
    this.runId = runId;
  }

  addResult(result: IndividualTestResult): this {
    this.results.push(result);

    if (!this.byCategory.has(result.category)) {
      this.byCategory.set(result.category, []);
    }
    this.byCategory.get(result.category)!.push(result);

    return this;
  }

  addResults(results: IndividualTestResult[]): this {
    results.forEach(r => this.addResult(r));
    return this;
  }

  build(): TestRunSummary {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    const skipped = this.results.filter(r => r.status === 'SKIPPED').length;
    const error = this.results.filter(r => r.status === 'ERROR').length;

    const passRate = calculatePassRate({ passed, total });

    // By Category
    const byCategory: { [key: string]: any } = {};
    this.byCategory.forEach((results, category) => {
      const catPassed = results.filter(r => r.status === 'PASSED').length;
      const catFailed = results.filter(r => r.status === 'FAILED').length;
      const catTotal = results.length;
      const catPassRate = calculatePassRate({ passed: catPassed, total: catTotal });

      byCategory[category] = {
        total: catTotal,
        passed: catPassed,
        failed: catFailed,
        skipped: results.filter(r => r.status === 'SKIPPED').length,
        passRate: catPassRate,
        status: determineStatus(
          catPassRate,
          results.filter(r => r.severity === Severity.CRITICAL && r.status === 'FAILED').length,
          results.filter(r => r.severity === Severity.HIGH && r.status === 'FAILED').length
        )
      };
    });

    // Findings by Severity
    const criticalFailed = this.results.filter(
      r => r.severity === Severity.CRITICAL && r.status === 'FAILED'
    ).length;
    const highFailed = this.results.filter(r => r.severity === Severity.HIGH && r.status === 'FAILED')
      .length;
    const mediumFailed = this.results.filter(
      r => r.severity === Severity.MEDIUM && r.status === 'FAILED'
    ).length;
    const lowFailed = this.results.filter(r => r.severity === Severity.LOW && r.status === 'FAILED')
      .length;
    const infoFailed = this.results.filter(r => r.severity === Severity.INFO && r.status === 'FAILED')
      .length;

    const status = determineStatus(passRate, criticalFailed, highFailed);

    const avgDuration = total > 0 ? this.results.reduce((sum, r) => sum + r.durationMs, 0) / total : 0;
    const durations = this.results.map(r => r.durationMs).sort((a, b) => a - b);

    return {
      runId: this.runId,
      timestamp: new Date().toISOString(),
      stats: { total, passed, failed, skipped, error },
      passRate,
      durationMs: this.results.reduce((sum, r) => sum + r.durationMs, 0),
      status,
      byCategory,
      findingsBySeverity: {
        critical: criticalFailed,
        high: highFailed,
        medium: mediumFailed,
        low: lowFailed,
        info: infoFailed
      },
      executive: {
        canDeploy: status === 'PASS' || status === 'DEGRADED',
        criticalIssuesCount: criticalFailed,
        actionRequired: status === 'FAIL',
        recommendedAction:
          status === 'FAIL'
            ? 'Fix critical and high severity issues before deployment.'
            : status === 'DEGRADED'
              ? 'Address high severity issues. System is usable but degraded.'
              : 'All tests passed. Ready for deployment.'
      },
      performance: {
        averageTestDurationMs: Math.round(avgDuration),
        fastestTestMs: durations[0] || 0,
        slowestTestMs: durations[durations.length - 1] || 0,
        totalParallelizationEfficiency: 100 // Placeholder
      }
    };
  }
}

/**
 * Builder für TestRunFindings
 */
export class FindingsBuilder {
  private runId: RunId;
  private findings: TestFinding[] = [];
  private findingsByTest: Map<string, TestFinding[]> = new Map();
  private findingsByCategory: Map<string, TestFinding[]> = new Map();
  private nextFindingIndex = 0;

  constructor(runId: RunId) {
    this.runId = runId;
  }

  addFinding(partial: Partial<TestFinding>): this {
    const finding: TestFinding = {
      id: `${this.runId}-${String(this.nextFindingIndex++).padStart(3, '0')}`,
      testId: partial.testId || 'UNKNOWN',
      category: partial.category || 'UNKNOWN',
      type: (partial.type as any) || 'ASSERTION_FAILURE',
      severity: partial.severity || Severity.MEDIUM,
      title: partial.title || 'Unknown Error',
      description: partial.description || 'Error details not available',
      impact: partial.impact || 'Unknown impact',
      recommendation: partial.recommendation || 'Investigate error',
      stackTrace: partial.stackTrace,
      context: partial.context || {},
      timestamp: partial.timestamp || new Date().toISOString(),
      occurrenceCount: partial.occurrenceCount || 1,
      rootCause: partial.rootCause
    };

    this.findings.push(finding);

    if (!this.findingsByTest.has(finding.testId)) {
      this.findingsByTest.set(finding.testId, []);
    }
    this.findingsByTest.get(finding.testId)!.push(finding);

    if (!this.findingsByCategory.has(finding.category)) {
      this.findingsByCategory.set(finding.category, []);
    }
    this.findingsByCategory.get(finding.category)!.push(finding);

    return this;
  }

  addFindings(partials: Array<Partial<TestFinding>>): this {
    partials.forEach(p => this.addFinding(p));
    return this;
  }

  build(): TestRunFindings {
    const findingsBySeverity = {
      critical: this.findings.filter(f => f.severity === Severity.CRITICAL),
      high: this.findings.filter(f => f.severity === Severity.HIGH),
      medium: this.findings.filter(f => f.severity === Severity.MEDIUM),
      low: this.findings.filter(f => f.severity === Severity.LOW),
      info: this.findings.filter(f => f.severity === Severity.INFO)
    };

    const byTestObj: { [key: string]: TestFinding[] } = {};
    this.findingsByTest.forEach((findings, testId) => {
      byTestObj[testId] = findings;
    });

    const byCategoryObj: { [key: string]: TestFinding[] } = {};
    this.findingsByCategory.forEach((findings, category) => {
      byCategoryObj[category] = findings;
    });

    const errorGroups = groupErrorsByType(this.findings);
    const groupedWithAnalysis: { [key: string]: any } = {};
    Object.entries(errorGroups).forEach(([type, findings]) => {
      groupedWithAnalysis[type] = {
        findings,
        commonCause: findings[0]?.rootCause?.category || 'Unknown',
        suggestedFix: findings[0]?.recommendation || 'Investigate'
      };
    });

    return {
      runId: this.runId,
      findings: this.findings,
      findingsByTest: byTestObj,
      findingsByCategory: byCategoryObj,
      findingsBySeverity,
      errorGroups: groupedWithAnalysis,
      regression: {
        newErrors: this.findings, // Placeholder
        recurringErrors: [],
        fixedErrors: []
      }
    };
  }
}

/**
 * Konvertiert beliebige Test-Fehler in ein Finding
 */
export function convertErrorToFinding(error: any): Partial<TestFinding> {
  const evaluation = severityEngine.evaluateError({
    testId: error.testId || 'UNKNOWN',
    category: error.category || 'UNKNOWN',
    errorType: error.errorType || 'EXCEPTION',
    message: error.message || error.toString()
  });

  return {
    testId: error.testId,
    category: error.category,
    type: error.errorType,
    severity: evaluation.severity,
    title: error.title || evaluation.impact,
    description: error.message || error.toString(),
    impact: evaluation.impact,
    recommendation: evaluation.recommendation,
    stackTrace: error.stack,
    context: error.context || {},
    rootCause: evaluation.matchedRule
      ? {
          category: evaluation.rootCauseCategory,
          description: evaluation.matchedRule.impact,
          confidence: 85
        }
      : undefined,
    timestamp: new Date().toISOString(),
    occurrenceCount: 1
  };
}
