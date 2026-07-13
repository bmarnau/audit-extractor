/**
 * Comprehensive Test Runner
 * 
 * Orchestriert:
 * 1. Alle Jest Tests sammeln und ausführen
 * 2. Test Results aggregieren
 * 3. Severity-basierte Klassifizierung
 * 4. Kompakte Reports generieren
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  TestResult,
  TestResultAggregator,
  CompactReportGenerator,
  TestSeverityClassifier,
  TestExecutionReport,
} from './ComprehensiveTestExecutor';

const execAsync = promisify(exec);

export interface JestTestResult {
  name: string;
  results: JestTestFileResult[];
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
}

export interface JestTestFileResult {
  numPassingTests: number;
  numFailingTests: number;
  numPendingTests: number;
  assertionResults: Array<{
    ancestorTitles: string[];
    fullName: string;
    status: 'passed' | 'failed' | 'pending';
    title: string;
    duration: number;
    failureMessages: string[];
  }>;
}

export class ComprehensiveTestRunner {
  private aggregator: TestResultAggregator;
  private executionId: string;
  private startTime: Date;

  constructor() {
    this.aggregator = new TestResultAggregator();
    this.executionId = `exec_${Date.now()}`;
    this.startTime = new Date();
  }

  /**
   * Führe alle Tests aus
   */
  async runAllTests(outputDir: string = './test-results'): Promise<TestExecutionReport> {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     Comprehensive Test Execution - All Components        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Stelle sicher, dass output directory existiert
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('🚀 Phase 1: Running all Jest tests...\n');

    try {
      // Führe alle Tests aus mit JSON-Output
      const { stdout, stderr } = await execAsync(
        'npm test -- --json --outputFile=test-output.json --passWithNoTests 2>&1',
        { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
      );

      console.log(stdout);
      if (stderr) console.error(stderr);

      // Lese Jest Output
      if (fs.existsSync('test-output.json')) {
        const jestResults = JSON.parse(fs.readFileSync('test-output.json', 'utf-8'));
        console.log('\n📋 Phase 2: Aggregating results...\n');
        this.processJestResults(jestResults);
      }
    } catch (error) {
      console.error('⚠️  Test execution error (continuing):', error instanceof Error ? error.message : error);
    }

    // Generiere Report
    console.log('\n📊 Phase 3: Generating report...\n');
    const endTime = new Date();
    const report = this.aggregator.generateReport(this.executionId, this.startTime, endTime);

    // Exportiere Reports
    console.log('💾 Phase 4: Exporting results...\n');
    this.exportResults(report, outputDir);

    // Drucke Summary
    console.log(CompactReportGenerator.toTerminal(report));

    return report;
  }

  /**
   * Verarbeite Jest Results
   */
  private processJestResults(jestResults: JestTestResult): void {
    if (!jestResults.testResults) return;

    let testCount = 0;

    jestResults.testResults.forEach(fileResult => {
      fileResult.assertionResults.forEach(assertion => {
        testCount++;

        // Determine component info from test name/path
        const componentName = this.extractComponentName(assertion.fullName);
        const componentType = this.inferComponentType(assertion.fullName);

        const status = assertion.status === 'passed' ? 'PASSED' : 
                      assertion.status === 'pending' ? 'SKIPPED' : 'FAILED';

        const severity = status === 'PASSED' 
          ? 'INFO' 
          : TestSeverityClassifier.classifyFailure(
              componentType as any,
              this.inferTestType(assertion.fullName),
              assertion.failureMessages.join('\n'),
              assertion.duration
            );

        const result: TestResult = {
          testId: `test_${testCount}`,
          componentId: `comp_${componentName}`,
          componentName,
          componentType: componentType as any,
          testName: assertion.title,
          testType: this.inferTestType(assertion.fullName) as any,
          status: status as any,
          severity: severity as any,
          duration: assertion.duration,
          error: assertion.failureMessages.join('\n') || undefined,
          timestamp: new Date(),
        };

        this.aggregator.addResult(result);

        // Log progress
        const statusIcon = status === 'PASSED' ? '✅' : status === 'SKIPPED' ? '⏭️' : '❌';
        console.log(`   ${statusIcon} ${componentName}.${assertion.title} [${severity}]`);
      });
    });
  }

  /**
   * Extract component name from test full name
   */
  private extractComponentName(fullName: string): string {
    // Try to extract from path/test structure
    const match = fullName.match(/(\w+)(?:Service|Controller|Repository|Component|Page)?/);
    return match ? match[1] : 'Unknown';
  }

  /**
   * Infer component type from test path/name
   */
  private inferComponentType(
    fullName: string
  ): 'endpoint' | 'controller' | 'service' | 'repository' | 'page' | 'component' {
    const lower = fullName.toLowerCase();
    if (lower.includes('controller')) return 'controller';
    if (lower.includes('service')) return 'service';
    if (lower.includes('repository')) return 'repository';
    if (lower.includes('page')) return 'page';
    if (lower.includes('component')) return 'component';
    if (lower.includes('endpoint') || lower.includes('route') || lower.includes('api')) return 'endpoint';
    return 'service';
  }

  /**
   * Infer test type from test name
   */
  private inferTestType(fullName: string): 'unit' | 'integration' | 'e2e' | 'component' | 'contract' {
    const lower = fullName.toLowerCase();
    if (lower.includes('e2e')) return 'e2e';
    if (lower.includes('integration')) return 'integration';
    if (lower.includes('component')) return 'component';
    if (lower.includes('contract')) return 'contract';
    return 'unit';
  }

  /**
   * Exportiere alle Reports
   */
  private exportResults(report: TestExecutionReport, outputDir: string): void {
    // JSON Report
    const jsonReport = {
      executionId: report.executionId,
      timestamp: report.startTime.toISOString(),
      duration: report.duration,
      summary: {
        totalTests: report.totalTests,
        passed: report.passedTests,
        failed: report.failedTests,
        skipped: report.skippedTests,
        successRate: report.overallSuccessRate.toFixed(1) + '%',
      },
      severity: {
        CRITICAL: report.criticalFailures,
        HIGH: report.highFailures,
        MEDIUM: report.mediumFailures,
        LOW: report.lowFailures,
      },
      components: {
        total: report.totalComponents,
        passing: report.passingComponents,
        failing: report.failingComponents,
        partial: report.partialComponents,
      },
      failedTests: report.testResults
        .filter(t => t.status === 'FAILED')
        .map(t => ({
          component: t.componentName,
          test: t.testName,
          severity: t.severity,
          error: t.error,
        })),
      blockers: report.blockers,
      recommendations: report.recommendations,
    };

    const jsonPath = path.join(outputDir, 'test-execution-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
    console.log(`  ✅ Execution Report: ${jsonPath}`);

    // Compact JSON
    const compactPath = path.join(outputDir, 'test-results-compact.json');
    fs.writeFileSync(compactPath, CompactReportGenerator.toJSON(report));
    console.log(`  ✅ Compact Report: ${compactPath}`);

    // Markdown Report
    const mdPath = path.join(outputDir, 'test-results.md');
    fs.writeFileSync(mdPath, CompactReportGenerator.toMarkdown(report));
    console.log(`  ✅ Markdown Report: ${mdPath}`);

    // Severity-sorted test results
    const severityPath = path.join(outputDir, 'test-results-by-severity.json');
    fs.writeFileSync(
      severityPath,
      JSON.stringify(
        report.testResults.map(t => ({
          severity: t.severity,
          status: t.status,
          component: t.componentName,
          test: t.testName,
          duration: t.duration,
          error: t.error,
        })),
        null,
        2
      )
    );
    console.log(`  ✅ Severity-sorted Results: ${severityPath}`);

    // Component failure report
    const compFailPath = path.join(outputDir, 'component-failures.json');
    const componentFailures = report.componentResults
      .filter(c => c.status !== 'PASS')
      .sort((a, b) => {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
        return severityOrder[a.highestSeverity] - severityOrder[b.highestSeverity];
      });

    fs.writeFileSync(compFailPath, JSON.stringify(componentFailures, null, 2));
    console.log(`  ✅ Component Failures: ${compFailPath}`);
  }
}

export default ComprehensiveTestRunner;
