/**
 * Build Pipeline Examples - 8 Real-World Scenarios
 *
 * This file demonstrates practical usage of the Build Verification Pipeline
 * across different scenarios: basic execution, CI/CD integration, risk analysis,
 * recommendation prioritization, health scoring, component impact, export/integration,
 * and GitHub Actions integration.
 *
 * Run any example with: npx ts-node examples/BuildPipelineExample.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  BuildVerificationService,
  BuildAssessmentReport,
  BuildMetrics,
  BuildRisk,
  BuildRecommendation,
  BuildId,
} from '../src/application/buildPipeline';

/**
 * Mock implementations for demonstration
 */

class MockTestRegistry {
  getAllTests() {
    return [
      { id: 'test_1', name: 'auth-login', component: 'auth', category: 'unit' },
      { id: 'test_2', name: 'auth-logout', component: 'auth', category: 'unit' },
      { id: 'test_3', name: 'payment-checkout', component: 'payment', category: 'integration' },
    ];
  }

  getTestsByCategory(category: string) {
    return this.getAllTests().filter(t => t.category === category);
  }

  getCatalogStatistics() {
    const tests = this.getAllTests();
    return {
      totalTests: tests.length,
      byCategory: { unit: 2, integration: 1 },
      byComponent: { auth: 2, payment: 1 },
    };
  }

  recordTestSuccess(testId: string) {
    console.log(`✅ Recorded success for test: ${testId}`);
  }

  recordTestFailure(testId: string, error: string) {
    console.log(`❌ Recorded failure for test: ${testId} - ${error}`);
  }

  getBuildAssessment() {
    return {
      totalTests: 3,
      successfulTests: 2,
      failedTests: 1,
      riskLevel: 'HIGH',
    };
  }
}

class MockIssueService {
  getAllIssues() {
    return [
      {
        id: 'issue_1',
        title: 'SQL injection vulnerability',
        component: 'auth',
        severity: 'CRITICAL',
        status: 'OPEN',
      },
      {
        id: 'issue_2',
        title: 'Missing input validation',
        component: 'payment',
        severity: 'HIGH',
        status: 'OPEN',
      },
    ];
  }

  getIssuesByComponent(component: string) {
    return this.getAllIssues().filter(i => i.component === component);
  }

  getIssuesByStatus(status: string) {
    return this.getAllIssues().filter(i => i.status === status);
  }

  getStatistics() {
    return {
      total: 2,
      bySeverity: { CRITICAL: 1, HIGH: 1, MEDIUM: 0, LOW: 0 },
      byStatus: { OPEN: 2, IN_PROGRESS: 0, RESOLVED: 0 },
    };
  }
}

/**
 * Example 1: Basic Pipeline Execution
 *
 * Simple, straightforward pipeline execution with default settings.
 * Shows core functionality and report generation.
 */
async function example1_BasicPipelineExecution() {
  console.log('\n' + '='.repeat(70));
  console.log('Example 1: Basic Pipeline Execution');
  console.log('='.repeat(70));

  const testRegistry = new MockTestRegistry() as any;
  const issueService = new MockIssueService() as any;
  const service = new BuildVerificationService(testRegistry, issueService);

  const { report, timing } = await service.runBuildPipeline();

  console.log('\n📊 Build Summary:');
  console.log(report.getSummary());

  console.log('\n⏱️  Timing:');
  console.log(`  Duration: ${timing.duration}ms`);
  console.log(`  Started: ${timing.startedAt}`);
  console.log(`  Completed: ${timing.completedAt}`);

  console.log('\n📈 Metrics:');
  console.log(`  Tests: ${report.successfulTests}/${report.totalTests}`);
  console.log(`  Success Rate: ${(report.successRate * 100).toFixed(1)}%`);
  console.log(`  Issues: ${report.totalIssues}`);
  console.log(`  Health Score: ${report.healthScore}/100`);
}

/**
 * Example 2: CI/CD Integration
 *
 * Pipeline execution with GitHub Actions context.
 * Demonstrates CI/CD tracking and report export.
 */
async function example2_CICDIntegration() {
  console.log('\n' + '='.repeat(70));
  console.log('Example 2: CI/CD Integration (GitHub Actions)');
  console.log('='.repeat(70));

  const testRegistry = new MockTestRegistry() as any;
  const issueService = new MockIssueService() as any;
  const service = new BuildVerificationService(testRegistry, issueService);

  const { report, timing, flakyTestNames } = await service.runBuildPipeline({
    ci: {
      branch: 'feature/auth-redesign',
      commitHash: 'abc123def456789',
      author: 'alice@example.com',
    },
  });

  console.log('\n🔄 CI/CD Context:');
  console.log(`  Branch: ${report.branch}`);
  console.log(`  Commit: ${report.commitHash}`);
  console.log(`  Author: ${report.author}`);

  console.log('\n📤 Exporting Reports:');

  // Export as Markdown
  const markdown = service.generateMarkdownReport(report);
  const mdFile = 'build-report.md';
  fs.writeFileSync(mdFile, markdown);
  console.log(`  ✅ Markdown report: ${mdFile} (${markdown.length} bytes)`);

  // Export as JSON
  const json = service.exportReportAsJson(report);
  const jsonFile = 'build-report.json';
  fs.writeFileSync(jsonFile, JSON.stringify(json, null, 2));
  console.log(`  ✅ JSON report: ${jsonFile} (${JSON.stringify(json).length} bytes)`);

  // Flaky test report
  if (flakyTestNames.length > 0) {
    console.log(`\n⚠️  Flaky Tests Detected: ${flakyTestNames.length}`);
    flakyTestNames.forEach(t => console.log(`  - ${t}`));
  }

  // CI decision
  const ciDecision = report.canBuildPass ? '✅ APPROVE' : '❌ BLOCK';
  console.log(`\n🚦 CI Decision: ${ciDecision}`);
  console.log(`  Recommendation: ${report.recommendation}`);
}

/**
 * Example 3: Risk Assessment Analysis
 *
 * Deep-dive into risk categorization and impact scoring.
 * Shows how to identify blocking vs. informational risks.
 */
async function example3_RiskAssessmentAnalysis() {
  console.log('\n' + '='.repeat(70));
  console.log('Example 3: Risk Assessment Analysis');
  console.log('='.repeat(70));

  const testRegistry = new MockTestRegistry() as any;
  const issueService = new MockIssueService() as any;
  const service = new BuildVerificationService(testRegistry, issueService);

  const { report } = await service.runBuildPipeline();

  console.log('\n📊 Risk Summary:');
  console.log(`  Total Risks: ${report.risks.length}`);

  // Identify blocking risks
  const blockingRisks = report.risks.filter(r => r.isBlocking());
  console.log(`  Blocking Risks: ${blockingRisks.length}`);

  if (blockingRisks.length > 0) {
    console.log('\n🚫 Blocking Risks (Must Fix):');
    blockingRisks.forEach(risk => {
      console.log(`  - [${risk.category}] ${risk.description}`);
      console.log(`    Severity: ${risk.severity}`);
      console.log(`    Impact Score: ${risk.getImpactScore()}`);
      console.log(`    Affected: ${risk.affectedComponent}`);
    });
  }

  // Analyze by category
  console.log('\n📋 Risks by Category:');
  const byCategory = new Map<string, any[]>();
  report.risks.forEach(risk => {
    if (!byCategory.has(risk.category)) {
      byCategory.set(risk.category, []);
    }
    byCategory.get(risk.category)!.push(risk);
  });

  Array.from(byCategory.entries()).forEach(([category, risks]) => {
    const avgImpact = risks.reduce((sum, r) => sum + r.getImpactScore(), 0) / risks.length;
    console.log(`  ${category}: ${risks.length} risks (avg impact: ${avgImpact.toFixed(1)})`);
  });

  // Decision impact
  console.log('\n🎯 Decision Impact:');
  if (blockingRisks.length > 0) {
    console.log('  ❌ Build CANNOT pass due to blocking risks');
  } else {
    console.log('  ✅ Build CAN pass (no blocking risks detected)');
  }
}

/**
 * Example 4: Recommendation Prioritization
 *
 * Shows how recommendations are prioritized and actioned.
 * Demonstrates the action item system.
 */
async function example4_RecommendationPrioritization() {
  console.log('\n' + '='.repeat(70));
  console.log('Example 4: Recommendation Prioritization');
  console.log('='.repeat(70));

  const testRegistry = new MockTestRegistry() as any;
  const issueService = new MockIssueService() as any;
  const service = new BuildVerificationService(testRegistry, issueService);

  const { report } = await service.runBuildPipeline();

  console.log(`\n📋 Total Recommendations: ${report.recommendations.length}`);

  // Sort by priority
  const sorted = [...report.recommendations].sort(
    (a, b) => b.priority - a.priority
  );

  console.log('\n🎯 Action Plan (by Priority):');
  sorted.forEach((rec, index) => {
    const blocking = rec.isBlocking() ? ' 🚫 BLOCKING' : '';
    console.log(
      `\n${index + 1}. [${rec.type}] ${rec.title}${blocking}`
    );
    console.log(`   Priority: ${rec.priority}/10`);
    console.log(`   Effort: ${rec.estimatedEffort}`);
    if (rec.actionItems && rec.actionItems.length > 0) {
      console.log('   Actions:');
      rec.actionItems.forEach(item => console.log(`     - ${item}`));
    }
  });

  // Blocking recommendations check
  const blocking = report.recommendations.filter(r => r.isBlocking());
  if (blocking.length > 0) {
    console.log(`\n⚠️  ${blocking.length} blocking recommendations require immediate action`);
  }
}

/**
 * Example 5: Health Score Calculation
 *
 * Demonstrates health score calculation with different metrics.
 * Shows threshold-based decision making.
 */
async function example5_HealthScoreCalculation() {
  console.log('\n' + '='.repeat(70));
  console.log('Example 5: Health Score Calculation & Interpretation');
  console.log('='.repeat(70));

  // Scenario A: Excellent build
  console.log('\n📊 Scenario A: Excellent Build');
  const metricsA = new BuildMetrics({
    totalTests: 100,
    successfulTests: 98,
    failedTests: 1,
    skippedTests: 1,
    totalIssues: 2,
    criticalIssues: 0,
    highIssues: 1,
    mediumIssues: 1,
    lowIssues: 0,
    testDuration: 45000,
    successRate: 0.98,
    buildBlockingIssues: 0,
    flakyTests: 0,
  });

  console.log(`  Health Score: ${metricsA.calculateHealthScore()}/100`);
  console.log(`  Risk Level: ${metricsA.determineRiskLevel()}`);
  console.log(`  Can Build Pass: ${metricsA.canBuildPass()}`);
  console.log(`  Interpretation: 🟢 Excellent - Deploy immediately`);

  // Scenario B: Fair build
  console.log('\n📊 Scenario B: Fair Build (Needs Review)');
  const metricsB = new BuildMetrics({
    totalTests: 100,
    successfulTests: 82,
    failedTests: 12,
    skippedTests: 6,
    totalIssues: 5,
    criticalIssues: 1,
    highIssues: 2,
    mediumIssues: 2,
    lowIssues: 0,
    testDuration: 75000,
    successRate: 0.82,
    buildBlockingIssues: 1,
    flakyTests: 2,
  });

  console.log(`  Health Score: ${metricsB.calculateHealthScore()}/100`);
  console.log(`  Risk Level: ${metricsB.determineRiskLevel()}`);
  console.log(`  Can Build Pass: ${metricsB.canBuildPass()}`);
  console.log(`  Interpretation: 🟡 Fair - Require review and fixes`);

  // Scenario C: Poor build
  console.log('\n📊 Scenario C: Poor Build (Critical Issues)');
  const metricsC = new BuildMetrics({
    totalTests: 100,
    successfulTests: 65,
    failedTests: 30,
    skippedTests: 5,
    totalIssues: 12,
    criticalIssues: 3,
    highIssues: 5,
    mediumIssues: 4,
    lowIssues: 0,
    testDuration: 120000,
    successRate: 0.65,
    buildBlockingIssues: 3,
    flakyTests: 8,
  });

  console.log(`  Health Score: ${metricsC.calculateHealthScore()}/100`);
  console.log(`  Risk Level: ${metricsC.determineRiskLevel()}`);
  console.log(`  Can Build Pass: ${metricsC.canBuildPass()}`);
  console.log(`  Interpretation: 🔴 Critical - Block deployment`);

  // Health score reference
  console.log('\n📚 Health Score Reference:');
  console.log('  90-100: 🟢 Excellent    - Deploy immediately');
  console.log('  70-89:  🟡 Good         - Monitor and merge');
  console.log('  50-69:  🟠 Fair         - Require review');
  console.log('  0-49:   🔴 Poor         - Block and fix');
}

/**
 * Example 6: Component Impact Analysis
 *
 * Analyzes which components are most affected by issues and risks.
 * Useful for determining team accountability.
 */
async function example6_ComponentImpactAnalysis() {
  console.log('\n' + '='.repeat(70));
  console.log('Example 6: Component Impact Analysis');
  console.log('='.repeat(70));

  const testRegistry = new MockTestRegistry() as any;
  const issueService = new MockIssueService() as any;
  const service = new BuildVerificationService(testRegistry, issueService);

  const { report } = await service.runBuildPipeline();

  // Analyze affected components
  const componentsWithRisks = new Map<string, any[]>();
  report.risks.forEach(risk => {
    if (!componentsWithRisks.has(risk.affectedComponent)) {
      componentsWithRisks.set(risk.affectedComponent, []);
    }
    componentsWithRisks.get(risk.affectedComponent)!.push(risk);
  });

  console.log('\n🎯 Affected Components:');
  const sorted = Array.from(componentsWithRisks.entries())
    .map(([component, risks]) => ({
      component,
      count: risks.length,
      avgImpact:
        risks.reduce((sum, r) => sum + r.getImpactScore(), 0) / risks.length,
      blocking: risks.filter(r => r.isBlocking()).length,
    }))
    .sort((a, b) => b.count - a.count);

  sorted.forEach(item => {
    const blockingBadge = item.blocking > 0 ? ` 🚫 ${item.blocking} blocking` : '';
    console.log(
      `  ${item.component}: ${item.count} risks (avg impact: ${item.avgImpact.toFixed(1)})${blockingBadge}`
    );
  });

  // Assign component owners
  console.log('\n👥 Component Owners (Example):');
  console.log('  auth    -> Team A (Frontend)');
  console.log('  payment -> Team B (Backend)');
  console.log('  Total affected teams: 2');
}

/**
 * Example 7: Export for Integration
 *
 * Shows how to export reports for integration with external systems.
 * Demonstrates webhook, Slack, and email integration patterns.
 */
async function example7_ExportForIntegration() {
  console.log('\n' + '='.repeat(70));
  console.log('Example 7: Export for External Integration');
  console.log('='.repeat(70));

  const testRegistry = new MockTestRegistry() as any;
  const issueService = new MockIssueService() as any;
  const service = new BuildVerificationService(testRegistry, issueService);

  const { report } = await service.runBuildPipeline({
    ci: {
      branch: 'main',
      commitHash: 'abc123',
      author: 'alice@example.com',
    },
  });

  // Webhook payload
  console.log('\n🔗 Webhook Payload (for Slack/Teams):');
  const webhookPayload = {
    buildId: report.buildId,
    status: report.status,
    healthScore: report.healthScore,
    riskLevel: report.riskLevel,
    branch: report.branch,
    commitHash: report.commitHash,
    author: report.author,
    metrics: {
      totalTests: report.totalTests,
      successfulTests: report.successfulTests,
      failedTests: report.failedTests,
      totalIssues: report.totalIssues,
    },
    recommendation: report.recommendation,
    reportUrl: `https://ci.example.com/builds/${report.buildId}`,
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify(webhookPayload, null, 2));

  // Email notification template
  console.log('\n📧 Email Notification (Template):');
  const emailTemplate = `
Subject: Build ${report.status} - Health: ${report.healthScore}/100

Build Assessment Report
=======================

Status: ${report.status}
Health Score: ${report.healthScore}/100
Risk Level: ${report.riskLevel}

Metrics:
- Tests: ${report.successfulTests}/${report.totalTests} (${(report.successRate * 100).toFixed(1)}%)
- Issues: ${report.totalIssues}
- Blocking Issues: ${report.buildBlockingIssues}

Decision: ${report.recommendation}

View Full Report: https://ci.example.com/builds/${report.buildId}
  `.trim();

  console.log(emailTemplate);
}

/**
 * Example 8: GitHub Actions Integration
 *
 * Complete GitHub Actions workflow integration.
 * Shows how to make pipeline decisions and set GitHub outputs.
 */
async function example8_GitHubActionsIntegration() {
  console.log('\n' + '='.repeat(70));
  console.log('Example 8: GitHub Actions Workflow Integration');
  console.log('='.repeat(70));

  const testRegistry = new MockTestRegistry() as any;
  const issueService = new MockIssueService() as any;
  const service = new BuildVerificationService(testRegistry, issueService);

  // Simulate GitHub Actions environment
  const githubContext = {
    eventName: 'pull_request',
    ref: 'refs/heads/feature/auth-redesign',
    sha: 'abc123def456789',
    actor: 'alice',
    runId: '12345678',
  };

  console.log('\n🔐 GitHub Context:');
  console.log(`  Event: ${githubContext.eventName}`);
  console.log(`  Branch: ${githubContext.ref}`);
  console.log(`  Commit: ${githubContext.sha}`);
  console.log(`  Actor: ${githubContext.actor}`);
  console.log(`  Run ID: ${githubContext.runId}`);

  const { report, flakyTestNames } = await service.runBuildPipeline({
    ci: {
      branch: githubContext.ref.replace('refs/heads/', ''),
      commitHash: githubContext.sha,
      author: githubContext.actor,
    },
  });

  console.log('\n⚙️  GitHub Outputs (set in workflow):');
  console.log(`  BUILD_STATUS=${report.status}`);
  console.log(`  HEALTH_SCORE=${report.healthScore}`);
  console.log(`  RISK_LEVEL=${report.riskLevel}`);
  console.log(`  CAN_PASS=${report.canBuildPass}`);

  // Workflow decision
  console.log('\n🚦 Workflow Decision:');
  if (report.canBuildPass) {
    console.log('  ✅ Build APPROVED - Auto-merge enabled');
  } else {
    console.log('  ❌ Build BLOCKED - Requires manual review');
    console.log(`  Reason: ${report.recommendation}`);
  }

  // Blocking risks report
  const blockingRisks = report.risks.filter(r => r.isBlocking());
  if (blockingRisks.length > 0) {
    console.log(`\n  ⚠️  ${blockingRisks.length} blocking issues detected:`);
    blockingRisks.forEach(risk => {
      console.log(`    - ${risk.description}`);
    });
  }

  // Flaky test report
  if (flakyTestNames.length > 0) {
    console.log(
      `\n  🔄 ${flakyTestNames.length} flaky tests detected - Add to investigation backlog`
    );
  }

  // Create GitHub issue for blocking risks
  console.log('\n📝 GitHub Issue Creation:');
  if (blockingRisks.length > 0) {
    console.log(`  Title: Build blocked: ${report.riskLevel} risks detected`);
    console.log(`  Labels: ci-failure, ${report.riskLevel.toLowerCase()}-priority`);
    console.log(`  Assignee: pull-request-reviewer`);
    console.log(
      `  Body: See build report at https://github.com/actions/runs/${githubContext.runId}`
    );
  }

  // Process summary
  console.log('\n📄 GitHub Summary:');
  console.log(
    `  Build ${report.status} | Health: ${report.healthScore}/100 | Risk: ${report.riskLevel}`
  );
  console.log(
    `  Tests: ${report.successfulTests}/${report.totalTests} | Issues: ${report.totalIssues}`
  );
}

/**
 * Main entry point - Run all examples
 */
async function main() {
  console.log('\n');
  console.log('╔' + '='.repeat(68) + '╗');
  console.log('║' + ' '.repeat(15) + 'Build Pipeline Examples' + ' '.repeat(30) + '║');
  console.log('║' + ' '.repeat(12) + '8 Real-World Scenarios' + ' '.repeat(33) + '║');
  console.log('╚' + '='.repeat(68) + '╝');

  try {
    // Run all examples
    await example1_BasicPipelineExecution();
    await example2_CICDIntegration();
    await example3_RiskAssessmentAnalysis();
    await example4_RecommendationPrioritization();
    await example5_HealthScoreCalculation();
    await example6_ComponentImpactAnalysis();
    await example7_ExportForIntegration();
    await example8_GitHubActionsIntegration();

    console.log('\n' + '='.repeat(70));
    console.log('✅ All examples completed successfully!');
    console.log('='.repeat(70) + '\n');

    // Cleanup demo files
    ['build-report.md', 'build-report.json'].forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`Cleaned up: ${file}`);
      }
    });
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  example1_BasicPipelineExecution,
  example2_CICDIntegration,
  example3_RiskAssessmentAnalysis,
  example4_RecommendationPrioritization,
  example5_HealthScoreCalculation,
  example6_ComponentImpactAnalysis,
  example7_ExportForIntegration,
  example8_GitHubActionsIntegration,
};
