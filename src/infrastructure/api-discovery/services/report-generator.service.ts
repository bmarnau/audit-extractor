/**
 * Report Generator Service
 * 
 * Generates comprehensive API discovery and smoke test reports
 * Creates JSON reports for machine consumption and analysis
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ApiInventory,
  ApiFunctionalReport,
  IReportGenerator,
  RecommendationGroup,
  RiskAnalysis,
  SmokeTestMethodStats,
  SmokeTestReport,
  SmokeTestResult,
} from '../api-discovery.types';

/**
 * Report Generator Service
 */
export class ReportGeneratorService implements IReportGenerator {
  /**
   * Generate smoke test report
   */
  async generateSmokeTestReport(results: SmokeTestResult[]): Promise<SmokeTestReport> {
    // This is handled by SmokeTestService.runAllTests()
    // This method is for external report generation if needed

    const passed = results.filter((r) => r.passed && !r.skipped).length;
    const failed = results.filter((r) => !r.passed && !r.skipped).length;
    const skipped = results.filter((r) => r.skipped).length;
    const total = results.length;

    const passRate = total > 0 ? (passed / (total - skipped)) * 100 : 0;

    // Calculate results by method
    const resultsByMethod: Record<string, SmokeTestMethodStats> = {
      GET: { method: 'GET', total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0 },
      POST: { method: 'POST', total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0 },
      PUT: { method: 'PUT', total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0 },
      PATCH: { method: 'PATCH', total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0 },
      DELETE: { method: 'DELETE', total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0 },
      HEAD: { method: 'HEAD', total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0 },
      OPTIONS: { method: 'OPTIONS', total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0 },
    };

    // Aggregate results by method
    for (const result of results) {
      const method = result.request.method;
      if (resultsByMethod[method]) {
        resultsByMethod[method].total++;
        if (result.skipped) {
          resultsByMethod[method].skipped++;
        } else if (result.passed) {
          resultsByMethod[method].passed++;
        } else {
          resultsByMethod[method].failed++;
        }
      }
    }

    // Calculate pass rates per method
    for (const method in resultsByMethod) {
      const stats = resultsByMethod[method];
      const testCount = stats.total - stats.skipped;
      stats.passRate = testCount > 0 ? (stats.passed / testCount) * 100 : 0;
    }

    return {
      reportId: `SMOKE-REPORT-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      totalTests: total,
      passedTests: passed,
      failedTests: failed,
      skippedTests: skipped,
      passRate,
      results,
      resultsByMethod: resultsByMethod as Record<any, SmokeTestMethodStats>,
      failures: results
        .filter((r) => !r.passed && !r.skipped)
        .map((r) => ({
          testId: r.testId,
          endpointId: r.endpointId,
          endpoint: r.request.endpoint,
          method: r.request.method,
          error: r.error || 'Unknown error',
          errorType: r.errorType || 'Unknown',
          failedChecks: r.checks.filter((c) => !c.passed).map((c) => c.name),
        })),
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
      averageDuration: Math.round(
        results.reduce((sum, r) => sum + r.duration, 0) / results.length
      ),
      maxDuration: Math.max(...results.map((r) => r.duration)),
      minDuration: Math.min(...results.map((r) => r.duration)),
      healthStatus: passRate >= 80 ? 'HEALTHY' : passRate >= 50 ? 'DEGRADED' : 'CRITICAL',
    };
  }

  /**
   * Generate functional report
   */
  async generateFunctionalReport(
    inventory: ApiInventory,
    smokeTestReport: SmokeTestReport,
    riskAnalyses: RiskAnalysis[]
  ): Promise<ApiFunctionalReport> {
    // Risk summary
    const riskSummary = {
      totalEndpointsAnalyzed: riskAnalyses.length,
      criticalRisks: riskAnalyses.filter((r) => r.riskLevel === 'CRITICAL').length,
      highRisks: riskAnalyses.filter((r) => r.riskLevel === 'HIGH').length,
      mediumRisks: riskAnalyses.filter((r) => r.riskLevel === 'MEDIUM').length,
      lowRisks: riskAnalyses.filter((r) => r.riskLevel === 'LOW').length,
    };

    // Top risks
    const topRisks = riskAnalyses
      .filter((r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH')
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    // Top failures
    const topFailures = (smokeTestReport.failures || []).slice(0, 10);

    // Generate recommendations
    const recommendationMap = new Map<string, RecommendationGroup>();

    // By risk type
    const riskIssueMap = new Map<string, Set<string>>();
    for (const risk of riskAnalyses) {
      for (const issue of risk.issues) {
        if (!riskIssueMap.has(issue.type)) {
          riskIssueMap.set(issue.type, new Set());
        }
        riskIssueMap.get(issue.type)!.add(risk.endpointId);
      }
    }

    // Create recommendation groups
    for (const [issueType, endpointIds] of riskIssueMap) {
      const risk = riskAnalyses.find((r) =>
        r.issues.some((i) => i.type === issueType)
      );

      if (risk) {
        const group: RecommendationGroup = {
          category: issueType,
          priority:
            riskAnalyses.filter((r) =>
              r.issues.some((i) => i.type === issueType && i.severity === 'CRITICAL')
            ).length > 0
              ? 'CRITICAL'
              : 'HIGH',
          affectedEndpointCount: endpointIds.size,
          recommendations: risk.recommendations,
        };

        recommendationMap.set(issueType, group);
      }
    }

    // Sort by priority
    const prioritizedRecommendations = Array.from(recommendationMap.values())
      .sort((a, b) => {
        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    // Calculate overall health score
    const inventoryHealth = this.calculateInventoryHealth(inventory);
    const smokeTestHealth = smokeTestReport.passRate;
    const riskHealth = Math.max(0, 100 - (riskSummary.criticalRisks * 25 + riskSummary.highRisks * 10));

    const overallScore = Math.max(0, Math.min(100, Math.round((inventoryHealth + smokeTestHealth + riskHealth) / 3)));

    return {
      reportId: `FUNC-REPORT-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      inventorySummary: {
        totalEndpoints: inventory.totalEndpoints,
        totalControllers: inventory.totalControllers,
        publicEndpoints: inventory.publicEndpoints,
        protectedEndpoints: inventory.protectedEndpoints,
      },
      smokeTestSummary: {
        totalTests: smokeTestReport.totalTests,
        passedTests: smokeTestReport.passedTests,
        failedTests: smokeTestReport.failedTests,
        passRate: smokeTestReport.passRate,
      },
      riskSummary,
      topRisks,
      topFailures,
      prioritizedRecommendations,
      overallHealth: overallScore >= 80 ? 'HEALTHY' : overallScore >= 50 ? 'DEGRADED' : 'CRITICAL',
      apiHealthScore: overallScore,
    };
  }

  /**
   * Export reports to JSON files
   */
  async exportReports(
    smokeReport: SmokeTestReport,
    funcReport: ApiFunctionalReport,
    outputDir: string
  ): Promise<void> {
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Export smoke test report
    const smokeReportPath = path.join(outputDir, 'api-smoke-report.json');
    await fs.promises.writeFile(
      smokeReportPath,
      JSON.stringify(smokeReport, null, 2),
      'utf-8'
    );

    // Export functional report
    const funcReportPath = path.join(outputDir, 'api-functional-report.json');
    await fs.promises.writeFile(
      funcReportPath,
      JSON.stringify(funcReport, null, 2),
      'utf-8'
    );
  }

  /**
   * Export summary as text
   */
  async exportSummary(
    smokeReport: SmokeTestReport,
    funcReport: ApiFunctionalReport,
    filePath: string
  ): Promise<void> {
    let summary = '';

    summary += '='.repeat(60) + '\n';
    summary += 'API DISCOVERY & SMOKE TEST REPORT\n';
    summary += '='.repeat(60) + '\n\n';

    // Overall Status
    summary += `Overall Health: ${funcReport.overallHealth}\n`;
    summary += `API Health Score: ${funcReport.apiHealthScore}/100\n`;
    summary += `Generated: ${funcReport.generatedAt}\n\n`;

    // Inventory Summary
    summary += 'INVENTORY SUMMARY\n';
    summary += '-'.repeat(60) + '\n';
    summary += `Total Endpoints: ${funcReport.inventorySummary.totalEndpoints}\n`;
    summary += `Total Controllers: ${funcReport.inventorySummary.totalControllers}\n`;
    summary += `Public Endpoints: ${funcReport.inventorySummary.publicEndpoints}\n`;
    summary += `Protected Endpoints: ${funcReport.inventorySummary.protectedEndpoints}\n\n`;

    // Smoke Test Summary
    summary += 'SMOKE TEST SUMMARY\n';
    summary += '-'.repeat(60) + '\n';
    summary += `Total Tests: ${smokeReport.totalTests}\n`;
    summary += `Passed: ${smokeReport.passedTests}\n`;
    summary += `Failed: ${smokeReport.failedTests}\n`;
    summary += `Pass Rate: ${smokeReport.passRate.toFixed(1)}%\n`;
    summary += `Health: ${smokeReport.healthStatus}\n\n`;

    // Risk Summary
    summary += 'RISK ANALYSIS SUMMARY\n';
    summary += '-'.repeat(60) + '\n';
    summary += `Critical Issues: ${funcReport.riskSummary.criticalRisks}\n`;
    summary += `High Issues: ${funcReport.riskSummary.highRisks}\n`;
    summary += `Medium Issues: ${funcReport.riskSummary.mediumRisks}\n`;
    summary += `Low Issues: ${funcReport.riskSummary.lowRisks}\n\n`;

    // Top Recommendations
    if (funcReport.prioritizedRecommendations.length > 0) {
      summary += 'TOP RECOMMENDATIONS\n';
      summary += '-'.repeat(60) + '\n';

      for (const rec of funcReport.prioritizedRecommendations.slice(0, 5)) {
        summary += `\n[${rec.priority}] ${rec.category}\n`;
        summary += `Affects: ${rec.affectedEndpointCount} endpoint(s)\n`;
        for (const r of rec.recommendations.slice(0, 2)) {
          summary += `  • ${r}\n`;
        }
      }
    }

    // Top Failures
    if (smokeReport.failures.length > 0) {
      summary += '\n\nTOP FAILURES\n';
      summary += '-'.repeat(60) + '\n';

      for (const failure of smokeReport.failures.slice(0, 5)) {
        summary += `\n${failure.endpoint} (${failure.method})\n`;
        summary += `Error: ${failure.error}\n`;
      }
    }

    summary += '\n' + '='.repeat(60) + '\n';

    await fs.promises.writeFile(filePath, summary, 'utf-8');
  }

  /**
   * Helper: Calculate inventory health score
   */
  private calculateInventoryHealth(inventory: ApiInventory): number {
    let score = 100;

    // Guard against undefined values
    const totalEndpoints = inventory.totalEndpoints || 1; // Avoid division by zero
    const untestedEndpoints = inventory.untestedEndpoints || 0;
    const deprecatedEndpoints = inventory.deprecatedEndpoints || 0;
    const protectedEndpoints = inventory.protectedEndpoints || 0;
    const publicEndpoints = inventory.publicEndpoints || 0;

    // Deduct for unimplemented endpoints
    score -= (untestedEndpoints / totalEndpoints) * 20;

    // Deduct for deprecated endpoints
    score -= (deprecatedEndpoints / totalEndpoints) * 10;

    // Bonus for well-protected APIs
    if (protectedEndpoints > publicEndpoints) {
      score += 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate HTML report
   */
  async generateHtmlReport(
    inventory: ApiInventory,
    smokeReport: SmokeTestReport,
    funcReport: ApiFunctionalReport,
    filePath: string
  ): Promise<void> {
    const html = this.buildHtmlReport(inventory, smokeReport, funcReport);

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(filePath, html, 'utf-8');
  }

  /**
   * Helper: Build HTML report
   */
  private buildHtmlReport(
    _inventory: ApiInventory,
    smokeReport: SmokeTestReport,
    funcReport: ApiFunctionalReport
  ): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Discovery Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { opacity: 0.9; }
    .content { padding: 40px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
    .card { background: #f9f9f9; border-radius: 8px; padding: 20px; text-align: center; border-left: 4px solid #667eea; }
    .card h3 { font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 10px; }
    .card .value { font-size: 32px; font-weight: bold; color: #333; }
    .card.healthy { border-left-color: #10b981; }
    .card.degraded { border-left-color: #f59e0b; }
    .card.critical { border-left-color: #ef4444; }
    .section { margin-bottom: 40px; }
    .section h2 { font-size: 20px; margin-bottom: 20px; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; color: #333; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    tr:hover { background: #f9f9f9; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-pass { background: #d1fae5; color: #065f46; }
    .status-fail { background: #fee2e2; color: #991b1b; }
    .status-warn { background: #fef3c7; color: #92400e; }
    .bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-top: 8px; }
    .bar-fill { height: 100%; background: #667eea; }
    .footer { background: #f9f9f9; padding: 20px 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 API Discovery & Smoke Test Report</h1>
      <p>Generated: ${funcReport.generatedAt}</p>
    </div>
    
    <div class="content">
      <!-- Status Cards -->
      <div class="grid">
        <div class="card ${funcReport.overallHealth === 'HEALTHY' ? 'healthy' : funcReport.overallHealth === 'DEGRADED' ? 'degraded' : 'critical'}">
          <h3>Overall Health</h3>
          <div class="value">${funcReport.overallHealth}</div>
        </div>
        <div class="card">
          <h3>API Health Score</h3>
          <div class="value">${funcReport.apiHealthScore}/100</div>
          <div class="bar"><div class="bar-fill" style="width: ${funcReport.apiHealthScore}%"></div></div>
        </div>
        <div class="card">
          <h3>Test Pass Rate</h3>
          <div class="value">${smokeReport.passRate.toFixed(1)}%</div>
          <div class="bar"><div class="bar-fill" style="width: ${smokeReport.passRate}%"></div></div>
        </div>
        <div class="card">
          <h3>Critical Issues</h3>
          <div class="value">${funcReport.riskSummary.criticalRisks}</div>
        </div>
      </div>

      <!-- Inventory Summary -->
      <div class="section">
        <h2>📋 API Inventory Summary</h2>
        <table>
          <tr>
            <th>Metric</th>
            <th>Count</th>
          </tr>
          <tr>
            <td>Total Endpoints</td>
            <td><strong>${funcReport.inventorySummary.totalEndpoints}</strong></td>
          </tr>
          <tr>
            <td>Total Controllers</td>
            <td><strong>${funcReport.inventorySummary.totalControllers}</strong></td>
          </tr>
          <tr>
            <td>Public Endpoints</td>
            <td><span class="status-badge">${funcReport.inventorySummary.publicEndpoints}</span></td>
          </tr>
          <tr>
            <td>Protected Endpoints</td>
            <td><span class="status-badge status-pass">${funcReport.inventorySummary.protectedEndpoints}</span></td>
          </tr>
        </table>
      </div>

      <!-- Smoke Test Summary -->
      <div class="section">
        <h2>✅ Smoke Test Results</h2>
        <table>
          <tr>
            <th>Status</th>
            <th>Count</th>
          </tr>
          <tr>
            <td>Passed</td>
            <td><span class="status-badge status-pass">${smokeReport.passedTests}</span></td>
          </tr>
          <tr>
            <td>Failed</td>
            <td><span class="status-badge status-fail">${smokeReport.failedTests}</span></td>
          </tr>
          <tr>
            <td>Skipped</td>
            <td><span class="status-badge status-warn">${smokeReport.skippedTests}</span></td>
          </tr>
          <tr>
            <td>Total Duration</td>
            <td>${smokeReport.totalDuration}ms</td>
          </tr>
        </table>
      </div>

      <!-- Risk Summary -->
      <div class="section">
        <h2>⚠️ Risk Analysis</h2>
        <table>
          <tr>
            <th>Severity</th>
            <th>Count</th>
          </tr>
          <tr>
            <td>Critical</td>
            <td><span class="status-badge" style="background: #fee2e2; color: #991b1b;">${funcReport.riskSummary.criticalRisks}</span></td>
          </tr>
          <tr>
            <td>High</td>
            <td><span class="status-badge status-warn">${funcReport.riskSummary.highRisks}</span></td>
          </tr>
          <tr>
            <td>Medium</td>
            <td><span class="status-badge status-warn">${funcReport.riskSummary.mediumRisks}</span></td>
          </tr>
          <tr>
            <td>Low</td>
            <td><span class="status-badge">${funcReport.riskSummary.lowRisks}</span></td>
          </tr>
        </table>
      </div>
    </div>

    <div class="footer">
      <p>🔐 Confidential - API Discovery Framework Report</p>
    </div>
  </div>
</body>
</html>`;
  }
}
