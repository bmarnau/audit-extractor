/**
 * Environment Test Suite - Module Exports
 * 
 * Central module exports and singleton instances
 * Provides convenient access to all environment testing services
 */

import path from 'path';

// Re-export all types
export * from './environment.types';

// Export services
export { EnvironmentCheckerService } from './services/environment-check.service';
export { EnvironmentErrorClassifierService } from './services/environment-error-classifier.service';
export { EnvironmentReporterService } from './services/environment-reporter.service';

// Service imports
import { EnvironmentCheckerService } from './services/environment-check.service';
import { EnvironmentErrorClassifierService } from './services/environment-error-classifier.service';
import { EnvironmentReporterService } from './services/environment-reporter.service';

/**
 * Initialize singleton instances
 */
const projectRoot = process.cwd();

export const environmentChecker = new EnvironmentCheckerService(projectRoot);
export const environmentClassifier = new EnvironmentErrorClassifierService();
export const environmentReporter = new EnvironmentReporterService();

/**
 * Convenience function: Run complete environment test suite
 */
export async function runEnvironmentTests(
  environment: 'development' | 'staging' | 'production' | 'local' = 'development'
) {
  console.log('🔍 Running Environment Test Suite...\n');

  // Run all checks
  const checks = await environmentChecker.runAllChecks();

  // Generate report
  const report = await environmentReporter.generateReport(checks, environment);

  // Export report to JSON
  const reportPath = path.join(process.cwd(), 'test-results', 'environment-report.json');
  
  // Ensure directory exists
  const reportDir = path.dirname(reportPath);
  if (!require('fs').existsSync(reportDir)) {
    require('fs').mkdirSync(reportDir, { recursive: true });
  }

  // Save JSON report
  await environmentReporter.exportAsJSON(report, reportPath);

  // Also save HTML and Markdown reports
  const htmlPath = reportPath.replace('.json', '.html');
  const markdownPath = reportPath.replace('.json', '.md');

  await environmentReporter.exportAsHTML(report, htmlPath);
  await environmentReporter.exportAsMarkdown(report, markdownPath);

  // Print summary
  console.log(environmentReporter.generateSummary(report));
  console.log(`\n✅ Reports generated:`);
  console.log(`   - JSON: ${reportPath}`);
  console.log(`   - HTML: ${htmlPath}`);
  console.log(`   - Markdown: ${markdownPath}`);

  return report;
}

/**
 * Export types and services for convenience
 */
export type {
  EnvironmentCheckResult,
  EnvironmentReport,
  EnvironmentSeverity,
  EnvironmentCheckCategory,
  EnvironmentErrorType,
  IEnvironmentChecker,
  IEnvironmentErrorClassifier,
  IEnvironmentReporter,
} from './environment.types';
