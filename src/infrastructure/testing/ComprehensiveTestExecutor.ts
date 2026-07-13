/**
 * Phase 31: Comprehensive Test Execution & Reporting
 * 
 * Orchestriert:
 * 1. All Test Execution (Unit, Integration, E2E, Component)
 * 2. Result Aggregation & Severity Classification
 * 3. Compact Report Generation
 * 4. Performance Metrics
 * 5. Failure Analysis & Recommendations
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type TestSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type TestStatus = 'PASSED' | 'FAILED' | 'SKIPPED' | 'TIMEOUT' | 'ERROR';
export type ComponentType = 'endpoint' | 'controller' | 'service' | 'repository' | 'page' | 'component';

export interface TestResult {
  testId: string;
  componentId: string;
  componentName: string;
  componentType: ComponentType;
  testName: string;
  testType: 'unit' | 'integration' | 'e2e' | 'component' | 'contract';
  status: TestStatus;
  severity: TestSeverity;
  duration: number; // milliseconds
  error?: string;
  stackTrace?: string;
  timestamp: Date;
}

export interface ComponentTestResults {
  componentId: string;
  componentName: string;
  componentType: ComponentType;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  timeoutTests: number;
  errorTests: number;
  successRate: number; // percentage
  duration: number; // milliseconds
  criticalFailures: number;
  highFailures: number;
  mediumFailures: number;
  lowFailures: number;
  status: 'PASS' | 'FAIL' | 'PARTIAL'; // overall
  highestSeverity: TestSeverity;
}

export interface TestExecutionReport {
  executionId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  
  // Summary
  totalTests: number;
  totalComponents: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  overallSuccessRate: number;
  
  // Severity Distribution
  criticalFailures: number;
  highFailures: number;
  mediumFailures: number;
  lowFailures: number;
  
  // Component-level
  passingComponents: number;
  failingComponents: number;
  partialComponents: number;
  
  // Results sorted by severity
  testResults: TestResult[];
  componentResults: ComponentTestResults[];
  
  // Recommendations
  recommendations: string[];
  blockers: string[];
}

// ============================================================
// SEVERITY CLASSIFICATION ENGINE
// ============================================================

export class TestSeverityClassifier {
  /**
   * Classify test failure severity based on component type and failure context
   */
  static classifyFailure(
    componentType: ComponentType,
    testType: string,
    error: string,
    _duration?: number
  ): TestSeverity {
    // Critical: API endpoints, essential services, data layer
    if (componentType === 'endpoint' || componentType === 'controller') {
      if (testType === 'integration' || testType === 'e2e') return 'CRITICAL';
      return 'HIGH';
    }

    // High: Business logic services, repositories
    if (componentType === 'service' || componentType === 'repository') {
      if (error.includes('null') || error.includes('undefined')) return 'CRITICAL';
      if (error.includes('database') || error.includes('connection')) return 'CRITICAL';
      return 'HIGH';
    }

    // Medium: Pages, components
    if (componentType === 'page') return 'MEDIUM';
    if (componentType === 'component') {
      if (error.includes('render')) return 'HIGH';
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Map test status to severity
   */
  static mapStatusToInitialSeverity(status: TestStatus, componentType: ComponentType): TestSeverity {
    if (status === 'PASSED' || status === 'SKIPPED') return 'INFO';
    if (status === 'TIMEOUT') return 'CRITICAL';
    if (status === 'ERROR') return 'HIGH';
    if (status === 'FAILED') {
      return componentType === 'endpoint' ? 'CRITICAL' : 'HIGH';
    }
    return 'LOW';
  }
}

// ============================================================
// TEST RESULT AGGREGATOR
// ============================================================

export class TestResultAggregator {
  private results: TestResult[] = [];
  private componentResults: Map<string, ComponentTestResults> = new Map();

  /**
   * Add a test result
   */
  addResult(result: TestResult): void {
    this.results.push(result);
    this.updateComponentResult(result);
  }

  /**
   * Add multiple results
   */
  addResults(results: TestResult[]): void {
    results.forEach(r => this.addResult(r));
  }

  /**
   * Update component-level aggregation
   */
  private updateComponentResult(result: TestResult): void {
    let componentResult = this.componentResults.get(result.componentId);

    if (!componentResult) {
      componentResult = {
        componentId: result.componentId,
        componentName: result.componentName,
        componentType: result.componentType,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        timeoutTests: 0,
        errorTests: 0,
        successRate: 0,
        duration: 0,
        criticalFailures: 0,
        highFailures: 0,
        mediumFailures: 0,
        lowFailures: 0,
        status: 'PASS',
        highestSeverity: 'INFO',
      };
    }

    // Update counts
    componentResult.totalTests++;
    componentResult.duration += result.duration;

    switch (result.status) {
      case 'PASSED':
        componentResult.passedTests++;
        break;
      case 'FAILED':
        componentResult.failedTests++;
        if (result.severity === 'CRITICAL') componentResult.criticalFailures++;
        else if (result.severity === 'HIGH') componentResult.highFailures++;
        else if (result.severity === 'MEDIUM') componentResult.mediumFailures++;
        else if (result.severity === 'LOW') componentResult.lowFailures++;
        break;
      case 'SKIPPED':
        componentResult.skippedTests++;
        break;
      case 'TIMEOUT':
        componentResult.timeoutTests++;
        componentResult.criticalFailures++;
        break;
      case 'ERROR':
        componentResult.errorTests++;
        componentResult.highFailures++;
        break;
    }

    // Calculate metrics
    componentResult.successRate = (componentResult.passedTests / componentResult.totalTests) * 100;

    // Determine overall status
    if (componentResult.failedTests === 0 && componentResult.errorTests === 0 && componentResult.timeoutTests === 0) {
      componentResult.status = 'PASS';
    } else if (componentResult.passedTests === 0) {
      componentResult.status = 'FAIL';
    } else {
      componentResult.status = 'PARTIAL';
    }

    // Determine highest severity
    if (componentResult.criticalFailures > 0) componentResult.highestSeverity = 'CRITICAL';
    else if (componentResult.highFailures > 0) componentResult.highestSeverity = 'HIGH';
    else if (componentResult.mediumFailures > 0) componentResult.highestSeverity = 'MEDIUM';
    else if (componentResult.lowFailures > 0) componentResult.highestSeverity = 'LOW';

    this.componentResults.set(result.componentId, componentResult);
  }

  /**
   * Get results sorted by severity
   */
  getResultsSortedBySeverity(): TestResult[] {
    const severityOrder: Record<TestSeverity, number> = {
      CRITICAL: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
      INFO: 4,
    };

    return [...this.results].sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;

      const statusOrder: Record<TestStatus, number> = {
        FAILED: 0,
        ERROR: 1,
        TIMEOUT: 2,
        SKIPPED: 3,
        PASSED: 4,
      };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }

  /**
   * Get component results sorted by severity
   */
  getComponentsSortedBySeverity(): ComponentTestResults[] {
    const severityOrder: Record<TestSeverity, number> = {
      CRITICAL: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
      INFO: 4,
    };

    return Array.from(this.componentResults.values()).sort((a, b) => {
      const severityDiff = severityOrder[a.highestSeverity] - severityOrder[b.highestSeverity];
      if (severityDiff !== 0) return severityDiff;

      // Then by success rate (lower first)
      return a.successRate - b.successRate;
    });
  }

  /**
   * Generate comprehensive report
   */
  generateReport(executionId: string, startTime: Date, endTime: Date): TestExecutionReport {
    const testResults = this.getResultsSortedBySeverity();
    const componentResults = this.getComponentsSortedBySeverity();

    // Calculate summary metrics
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASSED').length;
    const failedTests = this.results.filter(r => r.status === 'FAILED').length;
    const skippedTests = this.results.filter(r => r.status === 'SKIPPED').length;

    // Count severity failures
    const failedByStatus = this.results.filter(r => r.status === 'FAILED');
    const criticalFailures = failedByStatus.filter(r => r.severity === 'CRITICAL').length;
    const highFailures = failedByStatus.filter(r => r.severity === 'HIGH').length;
    const mediumFailures = failedByStatus.filter(r => r.severity === 'MEDIUM').length;
    const lowFailures = failedByStatus.filter(r => r.severity === 'LOW').length;

    // Component status counts
    const passingComponents = componentResults.filter(c => c.status === 'PASS').length;
    const failingComponents = componentResults.filter(c => c.status === 'FAIL').length;
    const partialComponents = componentResults.filter(c => c.status === 'PARTIAL').length;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      failedTests,
      totalTests,
      criticalFailures,
      componentResults
    );

    // Generate blockers (critical issues)
    const blockers = failedByStatus
      .filter(r => r.severity === 'CRITICAL')
      .slice(0, 5)
      .map(r => `🔴 ${r.componentName}.${r.testName}: ${r.error || 'Unknown error'}`);

    return {
      executionId,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      totalTests,
      totalComponents: componentResults.length,
      passedTests,
      failedTests,
      skippedTests,
      overallSuccessRate: (passedTests / totalTests) * 100,
      criticalFailures,
      highFailures,
      mediumFailures,
      lowFailures,
      passingComponents,
      failingComponents,
      partialComponents,
      testResults,
      componentResults,
      recommendations,
      blockers,
    };
  }

  /**
   * Generate intelligent recommendations based on test results
   */
  private generateRecommendations(
    failedTests: number,
    totalTests: number,
    criticalFailures: number,
    componentResults: ComponentTestResults[]
  ): string[] {
    const recommendations: string[] = [];

    const failureRate = (failedTests / totalTests) * 100;

    // Critical recommendations
    if (criticalFailures > 0) {
      recommendations.push(
        `🔴 BLOCKER: ${criticalFailures} critical failures must be fixed before release`
      );
    }

    // High failure rate
    if (failureRate > 50) {
      recommendations.push(
        `⚠️  CRITICAL: ${failureRate.toFixed(1)}% test failure rate. Investigate failing components immediately.`
      );
    } else if (failureRate > 20) {
      recommendations.push(
        `🟡 WARNING: ${failureRate.toFixed(1)}% test failure rate. Address failing components before merge.`
      );
    }

    // Component analysis
    const failingComponents = componentResults.filter(c => c.status === 'FAIL');
    if (failingComponents.length > 0) {
      const topFailers = failingComponents.slice(0, 3).map(c => c.componentName).join(', ');
      recommendations.push(`🔗 Focus: Fix these components first: ${topFailers}`);
    }

    // Success message
    if (failedTests === 0) {
      recommendations.push(`✅ SUCCESS: All ${totalTests} tests passing!`);
    }

    return recommendations;
  }
}

// ============================================================
// COMPACT REPORT GENERATORS
// ============================================================

export class CompactReportGenerator {
  /**
   * Generate compact terminal report
   */
  static toTerminal(report: TestExecutionReport): string {
    let output = '\n';
    output += '╔════════════════════════════════════════════════════════════╗\n';
    output += '║              TEST EXECUTION REPORT                        ║\n';
    output += '╚════════════════════════════════════════════════════════════╝\n\n';

    // Summary metrics
    output += '📊 SUMMARY\n';
    output += `   Tests: ${report.passedTests}/${report.totalTests} passed (${report.overallSuccessRate.toFixed(1)}%)\n`;
    output += `   Components: ${report.passingComponents}/${report.totalComponents} passing\n`;
    output += `   Duration: ${(report.duration / 1000).toFixed(2)}s\n\n`;

    // Severity distribution
    output += '🎯 SEVERITY DISTRIBUTION\n';
    output += `   🔴 CRITICAL: ${report.criticalFailures}\n`;
    output += `   🟠 HIGH:     ${report.highFailures}\n`;
    output += `   🟡 MEDIUM:   ${report.mediumFailures}\n`;
    output += `   🟢 LOW:      ${report.lowFailures}\n\n`;

    // Blockers
    if (report.blockers.length > 0) {
      output += '🚫 BLOCKERS\n';
      report.blockers.forEach(blocker => {
        output += `   ${blocker}\n`;
      });
      output += '\n';
    }

    // Top failing components
    const topFailers = report.componentResults.filter(c => c.status === 'FAIL').slice(0, 5);
    if (topFailers.length > 0) {
      output += '❌ TOP FAILING COMPONENTS\n';
      topFailers.forEach(comp => {
        output += `   ${comp.componentName}: ${comp.failedTests}/${comp.totalTests} failed\n`;
      });
      output += '\n';
    }

    // Recommendations
    output += '💡 RECOMMENDATIONS\n';
    report.recommendations.forEach(rec => {
      output += `   ${rec}\n`;
    });

    output += '\n';
    return output;
  }

  /**
   * Generate compact JSON report
   */
  static toJSON(report: TestExecutionReport): string {
    const compact = {
      summary: {
        totalTests: report.totalTests,
        passed: report.passedTests,
        failed: report.failedTests,
        skipped: report.skippedTests,
        successRate: report.overallSuccessRate.toFixed(1) + '%',
        duration: (report.duration / 1000).toFixed(2) + 's',
      },
      severity: {
        CRITICAL: report.criticalFailures,
        HIGH: report.highFailures,
        MEDIUM: report.mediumFailures,
        LOW: report.lowFailures,
      },
      components: {
        passing: report.passingComponents,
        failing: report.failingComponents,
        partial: report.partialComponents,
      },
      blockers: report.blockers,
      recommendations: report.recommendations,
      failedTests: report.testResults
        .filter(t => t.status === 'FAILED')
        .map(t => ({
          component: t.componentName,
          test: t.testName,
          severity: t.severity,
          error: t.error,
        })),
    };

    return JSON.stringify(compact, null, 2);
  }

  /**
   * Generate compact Markdown report
   */
  static toMarkdown(report: TestExecutionReport): string {
    let output = `# Test Execution Report\n\n`;
    output += `**Execution ID**: ${report.executionId}\n`;
    output += `**Duration**: ${new Date(report.endTime.getTime() - report.startTime.getTime()).toISOString().substr(11, 8)}\n\n`;

    // Summary table
    output += `## 📊 Summary\n\n`;
    output += `| Metric | Value |\n`;
    output += `|--------|-------|\n`;
    output += `| Total Tests | ${report.totalTests} |\n`;
    output += `| Passed | ${report.passedTests} ✅ |\n`;
    output += `| Failed | ${report.failedTests} ❌ |\n`;
    output += `| Skipped | ${report.skippedTests} ⏭️  |\n`;
    output += `| Success Rate | ${report.overallSuccessRate.toFixed(1)}% |\n`;
    output += `| Duration | ${(report.duration / 1000).toFixed(2)}s |\n\n`;

    // Severity distribution
    output += `## 🎯 Severity Distribution\n\n`;
    output += `| Severity | Count |\n`;
    output += `|----------|-------|\n`;
    output += `| 🔴 CRITICAL | ${report.criticalFailures} |\n`;
    output += `| 🟠 HIGH | ${report.highFailures} |\n`;
    output += `| 🟡 MEDIUM | ${report.mediumFailures} |\n`;
    output += `| 🟢 LOW | ${report.lowFailures} |\n\n`;

    // Blockers
    if (report.blockers.length > 0) {
      output += `## 🚫 Blockers\n\n`;
      report.blockers.forEach(blocker => {
        output += `- ${blocker}\n`;
      });
      output += '\n';
    }

    // Recommendations
    output += `## 💡 Recommendations\n\n`;
    report.recommendations.forEach(rec => {
      output += `- ${rec}\n`;
    });

    return output;
  }
}

export default { TestSeverityClassifier, TestResultAggregator, CompactReportGenerator };
