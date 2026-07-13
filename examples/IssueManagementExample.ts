/**
 * Beispiel-Integration des Issue Management Systems
 *
 * Zeigt wie das System verwendet wird:
 * - Test Results aggregieren
 * - Issues verwalten
 * - Statistiken auswerten
 * - Daten exportieren
 */

import { IssueService } from './src/application/IssueService';
import { JsonIssueRepository } from './src/infrastructure/persistence/JsonIssueRepository';
import { Severity, IssueStatus } from './src/domain/issue';

export class IssueManagementExample {
  private service: IssueService;

  async initialize() {
    // Repository mit JSON File-Persistierung
    const repository = new JsonIssueRepository('./data/issues');
    await repository.initialize();
    this.service = new IssueService(repository);
  }

  /**
   * Beispiel 1: Test Results aus verschiedenen Frameworks aggregieren
   */
  async aggregateTestResults() {
    console.log('=== Aggregating Test Results ===\n');

    // Jest Test Failures
    const jestResults = [
      { name: 'mathUtil.test', suite: 'CalculatorSuite', error: 'Expected 10 but got 11' },
      { name: 'stringUtil.test', suite: 'UtilSuite', error: 'Timeout' }
    ];

    for (const result of jestResults) {
      const issue = await this.service.createFromTestFailure({
        testName: result.name,
        testSuite: result.suite,
        errorMessage: result.error,
        failureReason: 'Logic error in implementation',
        buildVersion: '1.0.0',
        component: 'Utils',
        detectedBy: 'Jest'
      });
      console.log(`✓ Created Jest Issue: ${issue.getTitle()}`);
    }

    // API Test Failures
    const apiResults = [
      { endpoint: '/api/users', method: 'GET', status: 500 },
      { endpoint: '/api/products', method: 'POST', status: 400 }
    ];

    for (const result of apiResults) {
      const issue = await this.service.createFromApiTestFailure({
        endpoint: result.endpoint,
        method: result.method,
        expectedStatus: result.status === 500 ? 200 : 201,
        actualStatus: result.status,
        responseBody: 'Error response',
        buildVersion: '1.0.0',
        detectedBy: 'Postman'
      });
      console.log(`✓ Created API Issue: ${issue.getTitle()}`);
    }

    console.log();
  }

  /**
   * Beispiel 2: Kritische Issues identifizieren und priorisieren
   */
  async managePriorities() {
    console.log('=== Priority Management ===\n');

    const critical = await this.service.getCriticalIssues();
    console.log(`Found ${critical.length} CRITICAL issues:`);
    for (const issue of critical) {
      console.log(`  • ${issue.getTitle()} - ${issue.getComponent()}`);
    }

    console.log();

    const highPriority = await this.service.getHighPriorityIssues();
    console.log(`Found ${highPriority.length} HIGH priority issues:`);
    for (const issue of highPriority) {
      console.log(`  • ${issue.getTitle()} - Severity: ${issue.getSeverity()}`);
    }

    console.log();
  }

  /**
   * Beispiel 3: Issue Status Lifecycle
   */
  async manageIssueLifecycle() {
    console.log('=== Issue Lifecycle Management ===\n');

    const openIssues = await this.service.getOpenIssues();
    if (openIssues.length === 0) {
      console.log('No open issues');
      return;
    }

    const issue = openIssues[0];
    const issueId = issue.getIssueId().getValue();

    console.log(`Processing Issue: ${issue.getTitle()}`);

    // Start resolving
    let updated = await this.service.startResolvingIssue(issueId);
    console.log(`  → Status: ${updated?.getStatus()}`);

    // Update recommendation
    updated = await this.service.updateIssueRecommendation(
      issueId,
      'Applied hotfix from commit abc123'
    );
    console.log(`  ✓ Updated recommendation`);

    // Resolve
    updated = await this.service.resolveIssue(issueId);
    console.log(`  ✓ Resolved: ${updated?.isResolved()}`);

    // Close
    updated = await this.service.closeIssue(issueId);
    console.log(`  → Final Status: ${updated?.getStatus()}`);

    console.log();
  }

  /**
   * Beispiel 4: Component Health Dashboard
   */
  async displayComponentHealth() {
    console.log('=== Component Health Dashboard ===\n');

    const components = ['Frontend', 'Backend', 'Database', 'Utils'];

    for (const component of components) {
      try {
        const stats = await this.service.getComponentStatistics(component);

        if (stats.totalIssues === 0) {
          console.log(`${component}: ✅ Healthy (0 issues)`);
          continue;
        }

        const health = stats.criticalCount > 0 ? '🔴' : stats.highCount > 0 ? '🟡' : '🟢';
        console.log(`${component}: ${health} ${stats.totalIssues} issues`);
        console.log(`  • Critical: ${stats.criticalCount}`);
        console.log(`  • High: ${stats.highCount}`);
        console.log(`  • Medium: ${stats.mediumCount}`);
        console.log(`  • Open: ${stats.openCount}, Resolved: ${stats.resolvedCount}`);
      } catch (error) {
        // Component has no issues
      }
    }

    console.log();
  }

  /**
   * Beispiel 5: Statistiken anzeigen
   */
  async displayStatistics() {
    console.log('=== Overall Statistics ===\n');

    const stats = await this.service.getStatistics();

    console.log(`Total Issues: ${stats.total}`);
    console.log(`\nBy Severity:`);
    console.log(`  • CRITICAL: ${stats.bySeverity.CRITICAL}`);
    console.log(`  • HIGH: ${stats.bySeverity.HIGH}`);
    console.log(`  • MEDIUM: ${stats.bySeverity.MEDIUM}`);
    console.log(`  • LOW: ${stats.bySeverity.LOW}`);
    console.log(`  • INFO: ${stats.bySeverity.INFO}`);

    console.log(`\nBy Status:`);
    console.log(`  • OPEN: ${stats.byStatus.OPEN}`);
    console.log(`  • IN_PROGRESS: ${stats.byStatus.IN_PROGRESS}`);
    console.log(`  • RESOLVED: ${stats.byStatus.RESOLVED}`);
    console.log(`  • CLOSED: ${stats.byStatus.CLOSED}`);

    console.log(`\nBy Category:`);
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`  • ${category}: ${count}`);
    });

    console.log();
  }

  /**
   * Beispiel 6: Issues exportieren
   */
  async exportIssues() {
    console.log('=== Exporting Issues ===\n');

    const exported = await this.service.exportAllIssuesAsJson();
    console.log(`Exported ${exported.length} issues`);

    // In Datei speichern
    const fs = require('fs');
    fs.writeFileSync('issues-export.json', JSON.stringify(exported, null, 2));
    console.log('✓ Saved to issues-export.json');

    console.log();
  }

  /**
   * Beispiel 7: Search and Filter
   */
  async searchAndFilter() {
    console.log('=== Search and Filter ===\n');

    // Search by title
    const searchResults = await this.service.searchIssuesByTitle('Test');
    console.log(`Found ${searchResults.length} issues with 'Test' in title`);

    // Filter by category
    const testFailures = await this.service.getIssuesByCategory('TEST_FAILURE');
    console.log(`Found ${testFailures.length} TEST_FAILURE issues`);

    // Filter by component
    const backendIssues = await this.service.getIssuesByComponent('Backend');
    console.log(`Found ${backendIssues.length} issues in Backend component`);

    // Filter by build version
    const v100Issues = await this.service.getIssuesByBuildVersion('1.0.0');
    console.log(`Found ${v100Issues.length} issues in build 1.0.0`);

    console.log();
  }

  /**
   * Beispiel 8: Summary Report
   */
  async displaySummary() {
    console.log('=== Executive Summary ===\n');

    const summary = await this.service.getSummary();

    console.log(`Total Issues: ${summary.totalIssues}`);
    console.log(`Critical Issues: ${summary.criticalCount}`);
    console.log(`Open Issues: ${summary.openCount}`);
    console.log(`Urgent Action Required: ${summary.urgentAction ? 'YES 🚨' : 'No'}`);

    console.log();
  }

  /**
   * Run all examples
   */
  async runAll() {
    try {
      await this.initialize();

      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║   Issue Management System - Integration Examples      ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');

      await this.aggregateTestResults();
      await this.managePriorities();
      await this.displayStatistics();
      await this.displayComponentHealth();
      await this.searchAndFilter();
      await this.manageIssueLifecycle();
      await this.exportIssues();
      await this.displaySummary();

      console.log('✅ All examples completed successfully!');
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    }
  }
}

// Run example
if (require.main === module) {
  const example = new IssueManagementExample();
  example.runAll().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default IssueManagementExample;
