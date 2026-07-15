/**
 * Unified HTML Report Generator - Phase 38E
 * 
 * Generiert professionelle HTML-Reports aus unified Test Result Model.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { TestRunMetadata, TestRunSummary, TestRunFindings } from '../models/TestResultModel.js';
import { Severity } from '../models/TestRegistry.js';

/**
 * HTML Report Generator mit modernem, responsivem Design
 */
export class HtmlReportGenerator {
  constructor(private runDir: string) {}

  /**
   * Generiert HTML Report aus JSON Dateien
   */
  async generate(): Promise<string> {
    const metadata = this.loadJson<TestRunMetadata>('metadata.json');
    const summary = this.loadJson<TestRunSummary>('summary.json');
    const findings = this.loadJson<TestRunFindings>('findings.json');

    if (!metadata || !summary || !findings) {
      throw new Error('Missing required JSON files');
    }

    const html = this.buildHtml(metadata, summary, findings);
    const outputPath = path.join(this.runDir, 'report.html');
    fs.writeFileSync(outputPath, html);

    return outputPath;
  }

  /**
   * Lädt JSON Datei
   */
  private loadJson<T>(filename: string): T | null {
    const filePath = path.join(this.runDir, filename);
    if (!fs.existsSync(filePath)) {
      console.error(`Missing: ${filePath}`);
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  /**
   * Buildet komplettes HTML Document
   */
  private buildHtml(metadata: TestRunMetadata, summary: TestRunSummary, findings: TestRunFindings): string {
    const css = this.getStyles();
    const body = this.getBody(metadata, summary, findings);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Technical Test Report - ${metadata.runId}</title>
  <style>
${css}
  </style>
</head>
<body>
${body}
</body>
</html>`;
  }

  /**
   * CSS Styles (Inline für Portabilität)
   */
  private getStyles(): string {
    return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 8px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }

    .header-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
      font-size: 14px;
    }

    .header-info-item {
      padding: 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }

    .header-info-label {
      font-weight: 600;
      opacity: 0.9;
    }

    /* Executive Summary */
    .executive-summary {
      background: #f9f9f9;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin-bottom: 30px;
      border-radius: 4px;
    }

    .executive-summary h2 {
      margin-bottom: 15px;
      color: #667eea;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }

    .summary-stat {
      text-align: center;
      padding: 15px;
      background: white;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }

    .summary-stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 5px;
    }

    .summary-stat-label {
      font-size: 12px;
      color: #999;
      text-transform: uppercase;
    }

    /* Status Badges */
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      margin-right: 10px;
    }

    .status-pass {
      background: #d4edda;
      color: #155724;
    }

    .status-degraded {
      background: #fff3cd;
      color: #856404;
    }

    .status-fail {
      background: #f8d7da;
      color: #721c24;
    }

    .deployment-status {
      padding: 15px;
      border-radius: 4px;
      margin-top: 15px;
      font-weight: 600;
    }

    .deployment-ready {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .deployment-blocked {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .deployment-degraded {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }

    /* Sections */
    .section {
      margin-bottom: 40px;
    }

    .section h2 {
      font-size: 24px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
      color: #333;
    }

    /* Health Matrix */
    .health-matrix {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }

    .health-card {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 15px;
      background: white;
    }

    .health-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .health-card-title {
      font-weight: 600;
      color: #333;
    }

    .health-card-status {
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-excellent { background: #d4edda; color: #155724; }
    .status-good { background: #d1ecf1; color: #0c5460; }
    .status-warning { background: #fff3cd; color: #856404; }
    .status-critical { background: #f8d7da; color: #721c24; }

    .health-card-stats {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      font-size: 14px;
    }

    .health-card-stat {
      text-align: center;
    }

    .health-card-stat-value {
      font-weight: bold;
      color: #667eea;
    }

    .health-card-stat-label {
      color: #999;
      font-size: 12px;
    }

    .health-bar {
      width: 100%;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 10px;
    }

    .health-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transition: width 0.3s;
    }

    /* Severity Dashboard */
    .severity-dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }

    .severity-card {
      border-left: 4px solid;
      padding: 15px;
      border-radius: 4px;
      background: white;
      border: 1px solid #e0e0e0;
    }

    .severity-critical { border-left-color: #dc3545; background: #fff5f5; }
    .severity-high { border-left-color: #fd7e14; background: #fff9f5; }
    .severity-medium { border-left-color: #ffc107; background: #fffbf0; }
    .severity-low { border-left-color: #17a2b8; background: #f0f8fb; }

    .severity-count {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .severity-critical .severity-count { color: #dc3545; }
    .severity-high .severity-count { color: #fd7e14; }
    .severity-medium .severity-count { color: #ffc107; }
    .severity-low .severity-count { color: #17a2b8; }

    .severity-label {
      font-size: 12px;
      color: #999;
      text-transform: uppercase;
      font-weight: 600;
    }

    /* Findings */
    .findings-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .finding {
      border-left: 4px solid;
      padding: 15px;
      border-radius: 4px;
      background: white;
      border: 1px solid #e0e0e0;
    }

    .finding.critical { border-left-color: #dc3545; background: #fff5f5; }
    .finding.high { border-left-color: #fd7e14; background: #fff9f5; }
    .finding.medium { border-left-color: #ffc107; background: #fffbf0; }
    .finding.low { border-left-color: #17a2b8; background: #f0f8fb; }

    .finding-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }

    .finding-title {
      font-weight: 600;
      color: #333;
      flex: 1;
    }

    .finding-id {
      font-size: 12px;
      color: #999;
      background: #f5f5f5;
      padding: 2px 8px;
      border-radius: 3px;
    }

    .finding-meta {
      display: flex;
      gap: 20px;
      margin: 8px 0;
      font-size: 12px;
      color: #666;
    }

    .finding-description {
      color: #666;
      margin: 10px 0;
      line-height: 1.5;
    }

    .finding-impact {
      background: rgba(0, 0, 0, 0.02);
      padding: 10px;
      border-radius: 3px;
      margin: 10px 0;
      border-left: 2px solid #667eea;
    }

    .finding-impact-label {
      font-weight: 600;
      color: #667eea;
      font-size: 12px;
      text-transform: uppercase;
    }

    .finding-recommendation {
      background: rgba(102, 126, 234, 0.05);
      padding: 10px;
      border-radius: 3px;
      margin: 10px 0;
      border-left: 2px solid #667eea;
    }

    .finding-recommendation-label {
      font-weight: 600;
      color: #667eea;
      font-size: 12px;
      text-transform: uppercase;
    }

    /* Performance Section */
    .performance-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
    }

    .metric-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 15px;
      text-align: center;
    }

    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 5px;
    }

    .metric-label {
      font-size: 12px;
      color: #999;
      text-transform: uppercase;
    }

    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #999;
      font-size: 12px;
    }

    /* Print Styles */
    @media print {
      body {
        background: white;
      }

      .container {
        padding: 0;
        box-shadow: none;
      }

      .header {
        background: white;
        color: #333;
        border: 1px solid #e0e0e0;
      }

      .header h1 {
        color: #333;
      }

      .section {
        page-break-inside: avoid;
      }

      .finding {
        page-break-inside: avoid;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .container {
        padding: 10px;
      }

      .header {
        padding: 20px;
      }

      .header h1 {
        font-size: 20px;
      }

      .header-info {
        grid-template-columns: 1fr;
      }

      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .health-matrix {
        grid-template-columns: 1fr;
      }

      .severity-dashboard {
        grid-template-columns: repeat(2, 1fr);
      }

      .finding-header {
        flex-direction: column;
      }

      .finding-id {
        margin-top: 5px;
      }
    }
    `;
  }

  /**
   * Buildet Body Content
   */
  private getBody(metadata: TestRunMetadata, summary: TestRunSummary, findings: TestRunFindings): string {
    return `
    <div class="container">
      <!-- Header -->
      ${this.renderHeader(metadata, summary)}

      <!-- Executive Summary -->
      ${this.renderExecutiveSummary(summary)}

      <!-- Health Matrix -->
      <div class="section">
        <h2>📊 Health Matrix by Category</h2>
        <div class="health-matrix">
          ${this.renderHealthMatrix(summary)}
        </div>
      </div>

      <!-- Severity Dashboard -->
      <div class="section">
        <h2>🚨 Severity Dashboard</h2>
        <div class="severity-dashboard">
          ${this.renderSeverityDashboard(summary, findings)}
        </div>
      </div>

      <!-- Critical Findings -->
      ${findings.findingsBySeverity.critical.length > 0 ? `
      <div class="section">
        <h2>🔴 Critical Findings (${findings.findingsBySeverity.critical.length})</h2>
        <div class="findings-list">
          ${findings.findingsBySeverity.critical.map(f => this.renderFinding(f)).join('')}
        </div>
      </div>
      ` : ''}

      <!-- High Findings -->
      ${findings.findingsBySeverity.high.length > 0 ? `
      <div class="section">
        <h2>🟠 High Priority Findings (${findings.findingsBySeverity.high.length})</h2>
        <div class="findings-list">
          ${findings.findingsBySeverity.high.map(f => this.renderFinding(f)).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Error Analysis -->
      ${Object.keys(findings.errorGroups).length > 0 ? `
      <div class="section">
        <h2>📋 Error Analysis & Grouping</h2>
        ${this.renderErrorGroups(findings.errorGroups)}
      </div>
      ` : ''}

      <!-- Performance Metrics -->
      <div class="section">
        <h2>⚡ Performance Metrics</h2>
        <div class="performance-metrics">
          ${this.renderPerformanceMetrics(summary)}
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>Generated: ${new Date().toISOString()}</p>
        <p>Run ID: ${metadata.runId} | Duration: ${(summary.durationMs / 1000).toFixed(1)}s</p>
        <p style="margin-top: 10px; font-style: italic;">This report contains sensitive system information. Handle with care.</p>
      </div>
    </div>
    `;
  }

  /**
   * Rendert Header
   */
  private renderHeader(metadata: TestRunMetadata, summary: TestRunSummary): string {
    const startTime = new Date(metadata.startTime).toLocaleString();
    const endTime = new Date(metadata.endTime).toLocaleString();

    return `
    <div class="header">
      <h1>📋 Technical Test Report</h1>
      <div class="header-info">
        <div class="header-info-item">
          <div class="header-info-label">Run ID</div>
          <div>${metadata.runId}</div>
        </div>
        <div class="header-info-item">
          <div class="header-info-label">Execution Mode</div>
          <div>${metadata.executionMode}</div>
        </div>
        <div class="header-info-item">
          <div class="header-info-label">Start Time</div>
          <div>${startTime}</div>
        </div>
        <div class="header-info-item">
          <div class="header-info-label">Duration</div>
          <div>${(summary.durationMs / 1000).toFixed(1)}s</div>
        </div>
      </div>
    </div>
    `;
  }

  /**
   * Rendert Executive Summary
   */
  private renderExecutiveSummary(summary: TestRunSummary): string {
    const { stats, passRate, executive } = summary;
    const statusClass =
      summary.status === 'PASS'
        ? 'status-pass'
        : summary.status === 'DEGRADED'
          ? 'status-degraded'
          : 'status-fail';

    const deploymentClass =
      executive.canDeploy && executive.criticalIssuesCount === 0
        ? 'deployment-ready'
        : executive.canDeploy && executive.criticalIssuesCount > 0
          ? 'deployment-degraded'
          : 'deployment-blocked';

    return `
    <div class="executive-summary">
      <h2>Executive Summary</h2>
      <div style="margin-bottom: 15px;">
        <span class="status-badge ${statusClass}">${summary.status}</span>
        <span style="color: #999; font-size: 14px;">Pass Rate: ${passRate.toFixed(1)}%</span>
      </div>

      <div class="summary-grid">
        <div class="summary-stat">
          <div class="summary-stat-value">${stats.total}</div>
          <div class="summary-stat-label">Total Tests</div>
        </div>
        <div class="summary-stat">
          <div class="summary-stat-value" style="color: #28a745;">${stats.passed}</div>
          <div class="summary-stat-label">Passed</div>
        </div>
        <div class="summary-stat">
          <div class="summary-stat-value" style="color: #dc3545;">${stats.failed}</div>
          <div class="summary-stat-label">Failed</div>
        </div>
        <div class="summary-stat">
          <div class="summary-stat-value" style="color: #ffc107;">${stats.skipped}</div>
          <div class="summary-stat-label">Skipped</div>
        </div>
      </div>

      <div class="deployment-status ${deploymentClass}">
        ${executive.criticalIssuesCount === 0 && executive.canDeploy ? '✅ Ready for Deployment' : executive.canDeploy ? '⚠️ Deployment Allowed (Degraded)' : '🛑 Deployment Blocked'}
        <div style="font-size: 12px; margin-top: 5px; font-weight: normal;">
          ${executive.recommendedAction}
        </div>
      </div>
    </div>
    `;
  }

  /**
   * Rendert Health Matrix Cards
   */
  private renderHealthMatrix(summary: TestRunSummary): string {
    return Object.entries(summary.byCategory)
      .map(
        ([category, data]) => `
      <div class="health-card">
        <div class="health-card-header">
          <div class="health-card-title">${category}</div>
          <div class="health-card-status status-${data.passRate >= 95 ? 'excellent' : data.passRate >= 80 ? 'good' : data.passRate >= 60 ? 'warning' : 'critical'}">
            ${data.passRate.toFixed(0)}%
          </div>
        </div>
        <div class="health-card-stats">
          <div class="health-card-stat">
            <div class="health-card-stat-value">${data.passed}</div>
            <div class="health-card-stat-label">Passed</div>
          </div>
          <div class="health-card-stat">
            <div class="health-card-stat-value">${data.failed}</div>
            <div class="health-card-stat-label">Failed</div>
          </div>
        </div>
        <div class="health-bar">
          <div class="health-bar-fill" style="width: ${data.passRate}%"></div>
        </div>
      </div>
      `
      )
      .join('');
  }

  /**
   * Rendert Severity Dashboard
   */
  private renderSeverityDashboard(summary: TestRunSummary, findings: TestRunFindings): string {
    const { critical, high, medium, low, info } = findings.findingsBySeverity;

    return `
      <div class="severity-card severity-critical">
        <div class="severity-count">${critical.length}</div>
        <div class="severity-label">Critical</div>
      </div>
      <div class="severity-card severity-high">
        <div class="severity-count">${high.length}</div>
        <div class="severity-label">High</div>
      </div>
      <div class="severity-card severity-medium">
        <div class="severity-count">${medium.length}</div>
        <div class="severity-label">Medium</div>
      </div>
      <div class="severity-card severity-low">
        <div class="severity-count">${low.length}</div>
        <div class="severity-label">Low</div>
      </div>
    `;
  }

  /**
   * Rendert einzelnes Finding
   */
  private renderFinding(finding: any): string {
    const severityClass = finding.severity.toLowerCase();

    return `
    <div class="finding ${severityClass}">
      <div class="finding-header">
        <div class="finding-title">${finding.title}</div>
        <div class="finding-id">${finding.id}</div>
      </div>
      <div class="finding-meta">
        <span>Test: ${finding.testId}</span>
        <span>Category: ${finding.category}</span>
        <span>Type: ${finding.type}</span>
      </div>
      <div class="finding-description">${finding.description}</div>
      ${
        finding.impact
          ? `
      <div class="finding-impact">
        <div class="finding-impact-label">Impact</div>
        <div>${finding.impact}</div>
      </div>
      `
          : ''
      }
      ${
        finding.recommendation
          ? `
      <div class="finding-recommendation">
        <div class="finding-recommendation-label">Recommendation</div>
        <div>${finding.recommendation}</div>
      </div>
      `
          : ''
      }
    </div>
    `;
  }

  /**
   * Rendert Error Groups
   */
  private renderErrorGroups(errorGroups: any): string {
    return Object.entries(errorGroups)
      .map(
        ([type, group]: [string, any]) => `
      <div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
        <h4 style="margin-bottom: 10px; color: #333;">${type}</h4>
        <div style="font-size: 14px; color: #666; line-height: 1.6;">
          <p><strong>Count:</strong> ${group.findings.length} occurrences</p>
          <p><strong>Common Cause:</strong> ${group.commonCause}</p>
          <p><strong>Suggested Fix:</strong> ${group.suggestedFix}</p>
        </div>
      </div>
      `
      )
      .join('');
  }

  /**
   * Rendert Performance Metrics
   */
  private renderPerformanceMetrics(summary: TestRunSummary): string {
    return `
      <div class="metric-card">
        <div class="metric-value">${summary.performance.averageTestDurationMs}ms</div>
        <div class="metric-label">Average Duration</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${summary.performance.fastestTestMs}ms</div>
        <div class="metric-label">Fastest Test</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${summary.performance.slowestTestMs}ms</div>
        <div class="metric-label">Slowest Test</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${((summary.durationMs / 1000) / 60).toFixed(2)}m</div>
        <div class="metric-label">Total Duration</div>
      </div>
    `;
  }
}

/**
 * CLI Entry Point
 */
async function main() {
  const runDir = process.argv[2];

  if (!runDir) {
    console.error('Usage: ts-node HtmlReportGenerator.ts <run-directory>');
    process.exit(1);
  }

  try {
    const generator = new HtmlReportGenerator(runDir);
    const outputPath = await generator.generate();
    console.log(`✅ HTML Report generated: ${outputPath}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating report:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default HtmlReportGenerator;
