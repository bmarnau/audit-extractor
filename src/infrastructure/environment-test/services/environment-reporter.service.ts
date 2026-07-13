/**
 * Environment Report Generator Service
 * 
 * Generates comprehensive environment reports in JSON, HTML, and Markdown formats
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  EnvironmentReport,
  EnvironmentCheckResult,
  EnvironmentReportSummary,
  EnvironmentClassification,
  OSInfo,
  SystemInfo,
  IEnvironmentReporter,
} from '../environment.types';

import { EnvironmentErrorClassifierService } from './environment-error-classifier.service';

/**
 * Environment Report Generator Service
 */
export class EnvironmentReporterService implements IEnvironmentReporter {
  private classifier = new EnvironmentErrorClassifierService();

  /**
   * Generate comprehensive environment report
   */
  async generateReport(
    checks: EnvironmentCheckResult[],
    environment: 'development' | 'staging' | 'production' | 'local' = 'development'
  ): Promise<EnvironmentReport> {
    const reportId = `ENV-REPORT-${Date.now()}`;
    const generatedAt = new Date().toISOString();

    // Gather system information
    const osInfo = this.getOSInfo();
    const systemInfo = this.getSystemInfo();

    // Calculate summary
    const summary = this.calculateSummary(checks);

    // Classify issues
    const classifications = this.classifyIssues(checks);

    // Determine health status
    const healthStatus = this.determineHealthStatus(checks, summary);

    // Calculate overall score
    const overallScore = this.calculateHealthScore(summary, checks);

    // Check if ready for build and deploy
    const buildReady = !checks.some((c) => c.isBlockingBuild && c.status === 'FAIL');
    const deployReady = !checks.some((c) => c.isBlockingDeploy && c.status === 'FAIL');

    // Generate recommendations
    const recommendations = this.generateRecommendations(checks);

    // Get critical and blocking issues
    const criticalIssues = checks.filter((c) => c.severity === 'CRITICAL' && c.status === 'FAIL');
    const blockingIssues = checks.filter(
      (c) => (c.isBlockingBuild || c.isBlockingDeploy) && c.status === 'FAIL'
    );

    const report: EnvironmentReport = {
      reportId,
      generatedAt,
      environment,
      osInfo,
      systemInfo,
      checks,
      summary,
      healthStatus,
      overallScore,
      buildReady,
      deployReady,
      recommendations,
      classifications,
      criticalIssues,
      blockingIssues,
    };

    return report;
  }

  /**
   * Export report as JSON
   */
  async exportAsJSON(report: EnvironmentReport, filePath: string): Promise<void> {
    const json = JSON.stringify(report, null, 2);
    await fs.promises.writeFile(filePath, json, 'utf-8');
  }

  /**
   * Export report as HTML
   */
  async exportAsHTML(report: EnvironmentReport, filePath: string): Promise<void> {
    const html = this.generateHTML(report);
    await fs.promises.writeFile(filePath, html, 'utf-8');
  }

  /**
   * Export report as Markdown
   */
  async exportAsMarkdown(report: EnvironmentReport, filePath: string): Promise<void> {
    const markdown = this.generateMarkdown(report);
    await fs.promises.writeFile(filePath, markdown, 'utf-8');
  }

  /**
   * Generate summary text
   */
  generateSummary(report: EnvironmentReport): string {
    const { summary, healthStatus, buildReady, deployReady, overallScore } = report;

    return `
Environment Health Report
==========================

Report ID: ${report.reportId}
Generated: ${report.generatedAt}
Environment: ${report.environment}

Overall Status: ${healthStatus}
Health Score: ${overallScore}/100
Build Ready: ${buildReady ? '✅ YES' : '❌ NO'}
Deploy Ready: ${deployReady ? '✅ YES' : '❌ NO'}

Summary:
--------
Total Checks: ${summary.totalChecks}
Passed: ${summary.passedChecks} (${summary.passRate.toFixed(1)}%)
Failed: ${summary.failedChecks} (${summary.failureRate.toFixed(1)}%)
Warnings: ${summary.warningChecks}
Skipped: ${summary.skippedChecks}

Issues by Severity:
- Critical: ${summary.criticalIssues}
- High: ${summary.highIssues}
- Medium: ${summary.mediumIssues}
- Low: ${summary.lowIssues}

Blockers:
- Build Blockers: ${summary.buildBlockers}
- Deploy Blockers: ${summary.deployBlockers}

Execution Time: ${summary.executionTime}ms
`.trim();
  }

  /**
   * Helper: Get OS information
   */
  private getOSInfo(): OSInfo {
    return {
      platform: process.platform,
      arch: process.arch,
      release: os.release(),
      kernel: os.version?.() || 'unknown',
      uptime: os.uptime(),
    };
  }

  /**
   * Helper: Get system information
   */
  private getSystemInfo(): SystemInfo {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const availableMemory = os.freemem();
    const memoryUsagePercentage = ((totalMemory - availableMemory) / totalMemory) * 100;

    return {
      hostname: os.hostname(),
      cpuCount: cpus.length,
      totalMemory,
      availableMemory,
      memoryUsagePercentage,
    };
  }

  /**
   * Helper: Calculate report summary
   */
  private calculateSummary(checks: EnvironmentCheckResult[]): EnvironmentReportSummary {
    const statuses = {
      pass: checks.filter((c) => c.status === 'PASS').length,
      fail: checks.filter((c) => c.status === 'FAIL').length,
      warning: checks.filter((c) => c.status === 'WARNING').length,
      skipped: checks.filter((c) => c.status === 'SKIPPED').length,
    };

    const severities = {
      critical: checks.filter((c) => c.severity === 'CRITICAL').length,
      high: checks.filter((c) => c.severity === 'HIGH').length,
      medium: checks.filter((c) => c.severity === 'MEDIUM').length,
      low: checks.filter((c) => c.severity === 'LOW').length,
      info: checks.filter((c) => c.severity === 'INFO').length,
    };

    const blockers = {
      build: checks.filter((c) => c.isBlockingBuild && c.status === 'FAIL').length,
      deploy: checks.filter((c) => c.isBlockingDeploy && c.status === 'FAIL').length,
    };

    const totalDuration = checks.reduce((sum, c) => sum + c.duration, 0);
    const passRate = (statuses.pass / checks.length) * 100;
    const failureRate = (statuses.fail / checks.length) * 100;

    return {
      totalChecks: checks.length,
      passedChecks: statuses.pass,
      failedChecks: statuses.fail,
      warningChecks: statuses.warning,
      skippedChecks: statuses.skipped,
      passRate,
      failureRate,
      criticalIssues: severities.critical,
      highIssues: severities.high,
      mediumIssues: severities.medium,
      lowIssues: severities.low,
      infoIssues: severities.info,
      buildBlockers: blockers.build,
      deployBlockers: blockers.deploy,
      executionTime: totalDuration,
    };
  }

  /**
   * Helper: Classify issues
   */
  private classifyIssues(checks: EnvironmentCheckResult[]): EnvironmentClassification[] {
    const classifications: EnvironmentClassification[] = [];

    for (const check of checks) {
      if (check.status === 'FAIL' && check.errorType) {
        const classification = this.classifier.classifyError(
          check.category,
          check.errorMessage || 'Unknown error',
          check.details
        );
        classifications.push(classification);
      }
    }

    return classifications;
  }

  /**
   * Helper: Determine health status
   */
  private determineHealthStatus(
    checks: EnvironmentCheckResult[],
    summary: EnvironmentReportSummary
  ): 'HEALTHY' | 'DEGRADED' | 'CRITICAL' {
    if (summary.criticalIssues > 0) {
      return 'CRITICAL';
    }

    if (summary.failedChecks > 0 || summary.warningChecks > 0) {
      return 'DEGRADED';
    }

    return 'HEALTHY';
  }

  /**
   * Helper: Calculate health score
   */
  private calculateHealthScore(summary: EnvironmentReportSummary, checks: EnvironmentCheckResult[]): number {
    let score = 100;

    // Deduct points for failures
    score -= summary.failedChecks * 10;

    // Deduct points for warnings
    score -= summary.warningChecks * 5;

    // Deduct points for critical issues
    score -= summary.criticalIssues * 20;

    // Deduct points for high severity issues
    score -= summary.highIssues * 10;

    // Deduct points for blocking issues
    score -= (summary.buildBlockers + summary.deployBlockers) * 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Helper: Generate recommendations
   */
  private generateRecommendations(checks: EnvironmentCheckResult[]): string[] {
    const recommendations = new Set<string>();

    for (const check of checks) {
      if (check.status === 'FAIL' || check.status === 'WARNING') {
        for (const action of check.recommendedActions) {
          recommendations.add(action);
        }
      }
    }

    return Array.from(recommendations);
  }

  /**
   * Helper: Generate HTML report
   */
  private generateHTML(report: EnvironmentReport): string {
    const { summary, healthStatus, overallScore, buildReady, deployReady } = report;

    const statusColor = {
      HEALTHY: '#4CAF50',
      DEGRADED: '#FF9800',
      CRITICAL: '#F44336',
    };

    const checkStatusColor = (status: string) => {
      switch (status) {
        case 'PASS':
          return '#4CAF50';
        case 'FAIL':
          return '#F44336';
        case 'WARNING':
          return '#FF9800';
        default:
          return '#9E9E9E';
      }
    };

    const checksHTML = report.checks
      .map(
        (check) => `
      <div style="border-left: 4px solid ${checkStatusColor(check.status)}; padding: 12px; margin-bottom: 10px; background: #f5f5f5;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <strong>${check.checkName}</strong>
          <span style="color: ${checkStatusColor(check.status)}; font-weight: bold;">${check.status}</span>
        </div>
        <div style="color: #666; font-size: 0.9em; margin-bottom: 6px;">
          <strong>Severity:</strong> ${check.severity} | <strong>Duration:</strong> ${check.duration}ms
        </div>
        <div style="color: #333; margin-bottom: 6px;">
          <strong>Findings:</strong>
          <ul style="margin: 4px 0; padding-left: 20px;">
            ${check.findings.map((f) => `<li>${f}</li>`).join('')}
          </ul>
        </div>
        ${
          check.recommendedActions.length > 0
            ? `
          <div style="color: #D32F2F; margin-top: 6px;">
            <strong>Recommended Actions:</strong>
            <ul style="margin: 4px 0; padding-left: 20px;">
              ${check.recommendedActions.map((a) => `<li>${a}</li>`).join('')}
            </ul>
          </div>
        `
            : ''
        }
      </div>
    `
      )
      .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Environment Test Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #fafafa; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { border-bottom: 2px solid #e0e0e0; padding-bottom: 20px; margin-bottom: 20px; }
    .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 20px 0; }
    .status-card { padding: 16px; border-radius: 4px; background: #f5f5f5; text-align: center; }
    .status-card h3 { margin: 0 0 8px 0; font-size: 0.9em; color: #666; text-transform: uppercase; }
    .status-card .value { font-size: 2em; font-weight: bold; margin: 8px 0; }
    .health-score { font-size: 3em; color: ${statusColor[healthStatus]}; font-weight: bold; }
    .section { margin-top: 30px; }
    .section h2 { border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e0e0e0; }
    th { background: #f5f5f5; font-weight: 600; }
    tr:hover { background: #fafafa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Environment Test Report</h1>
      <p><strong>Report ID:</strong> ${report.reportId}</p>
      <p><strong>Generated:</strong> ${report.generatedAt}</p>
      <p><strong>Environment:</strong> ${report.environment}</p>
    </div>

    <div class="status-grid">
      <div class="status-card">
        <h3>Overall Status</h3>
        <div style="font-size: 1.5em; color: ${statusColor[healthStatus]}; font-weight: bold;">${healthStatus}</div>
      </div>
      <div class="status-card">
        <h3>Health Score</h3>
        <div class="health-score">${overallScore}</div>
        <div style="font-size: 0.9em; color: #666;">/100</div>
      </div>
      <div class="status-card">
        <h3>Build Ready</h3>
        <div style="font-size: 1.5em; color: ${buildReady ? '#4CAF50' : '#F44336'}; font-weight: bold;">
          ${buildReady ? '✅ YES' : '❌ NO'}
        </div>
      </div>
      <div class="status-card">
        <h3>Deploy Ready</h3>
        <div style="font-size: 1.5em; color: ${deployReady ? '#4CAF50' : '#F44336'}; font-weight: bold;">
          ${deployReady ? '✅ YES' : '❌ NO'}
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Summary</h2>
      <table>
        <tr><td>Total Checks</td><td><strong>${summary.totalChecks}</strong></td></tr>
        <tr><td>Passed</td><td><strong style="color: #4CAF50;">${summary.passedChecks}</strong> (${summary.passRate.toFixed(1)}%)</td></tr>
        <tr><td>Failed</td><td><strong style="color: #F44336;">${summary.failedChecks}</strong> (${summary.failureRate.toFixed(1)}%)</td></tr>
        <tr><td>Warnings</td><td><strong style="color: #FF9800;">${summary.warningChecks}</strong></td></tr>
        <tr><td>Build Blockers</td><td><strong>${summary.buildBlockers}</strong></td></tr>
        <tr><td>Deploy Blockers</td><td><strong>${summary.deployBlockers}</strong></td></tr>
      </table>
    </div>

    <div class="section">
      <h2>System Information</h2>
      <table>
        <tr><td>Platform</td><td>${report.osInfo.platform} (${report.osInfo.arch})</td></tr>
        <tr><td>Hostname</td><td>${report.systemInfo.hostname}</td></tr>
        <tr><td>CPUs</td><td>${report.systemInfo.cpuCount}</td></tr>
        <tr><td>Memory Usage</td><td>${report.systemInfo.memoryUsagePercentage.toFixed(1)}%</td></tr>
      </table>
    </div>

    <div class="section">
      <h2>Check Results</h2>
      ${checksHTML}
    </div>

    ${
      report.recommendations.length > 0
        ? `
        <div class="section">
          <h2>Recommendations</h2>
          <ol>
            ${report.recommendations.map((r) => `<li>${r}</li>`).join('')}
          </ol>
        </div>
      `
        : ''
    }
  </div>
</body>
</html>
    `;
  }

  /**
   * Helper: Generate Markdown report
   */
  private generateMarkdown(report: EnvironmentReport): string {
    const { summary, healthStatus, overallScore, buildReady, deployReady } = report;

    return `# Environment Test Report

**Report ID:** ${report.reportId}  
**Generated:** ${report.generatedAt}  
**Environment:** ${report.environment}

## Overall Status

| Metric | Value |
|--------|-------|
| Status | **${healthStatus}** |
| Health Score | **${overallScore}/100** |
| Build Ready | **${buildReady ? '✅ YES' : '❌ NO'}** |
| Deploy Ready | **${deployReady ? '✅ YES' : '❌ NO'}** |

## Summary

| Metric | Value |
|--------|-------|
| Total Checks | ${summary.totalChecks} |
| Passed | ${summary.passedChecks} (${summary.passRate.toFixed(1)}%) |
| Failed | ${summary.failedChecks} (${summary.failureRate.toFixed(1)}%) |
| Warnings | ${summary.warningChecks} |
| Skipped | ${summary.skippedChecks} |
| Build Blockers | ${summary.buildBlockers} |
| Deploy Blockers | ${summary.deployBlockers} |

## System Information

| Property | Value |
|----------|-------|
| Platform | ${report.osInfo.platform} (${report.osInfo.arch}) |
| Release | ${report.osInfo.release} |
| Hostname | ${report.systemInfo.hostname} |
| CPU Count | ${report.systemInfo.cpuCount} |
| Memory Usage | ${report.systemInfo.memoryUsagePercentage.toFixed(1)}% |
| Uptime | ${(report.osInfo.uptime / 3600).toFixed(1)} hours |

## Check Results

${report.checks
  .map(
    (check) => `
### ${check.checkName}

**Status:** ${check.status}  
**Severity:** ${check.severity}  
**Duration:** ${check.duration}ms  
**Category:** ${check.category}

#### Findings
${check.findings.map((f) => `- ${f}`).join('\n')}

${
  check.recommendedActions.length > 0
    ? `#### Recommended Actions
${check.recommendedActions.map((a) => `- ${a}`).join('\n')}`
    : ''
}
`
  )
  .join('')}

${
  report.recommendations.length > 0
    ? `## Recommendations

${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
    : ''
}
`;
  }
}
