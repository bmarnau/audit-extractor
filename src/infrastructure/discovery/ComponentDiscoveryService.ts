/**
 * Component Discovery Service - Orchestrator
 *
 * Koordiniert:
 * 1. Component Scanning (AST-Analyse)
 * 2. Test Planning (intelligente Teststrategien)
 * 3. Inventory Generation (JSON export)
 * 4. Report Generation (Empfehlungen)
 */

import * as fs from 'fs';
import { ComponentScanner, ComponentInventory } from './ComponentScanner';
import { TestDiscoveryEngine, DiscoveryReport } from './TestDiscoveryEngine';

export interface DiscoveryResult {
  componentInventory: ComponentInventory;
  testDiscovery: DiscoveryReport;
  stats: {
    discoveryTime: number;
    componentsFound: number;
    testsPlanned: number;
    estimatedCoverageHours: number;
  };
}

export class ComponentDiscoveryService {
  private scanner: ComponentScanner;
  private outputDir: string;

  constructor(sourceRoot: string = './src', outputDir: string = '.') {
    this.outputDir = outputDir;
    this.scanner = new ComponentScanner(sourceRoot);
  }

  /**
   * Run complete discovery pipeline
   */
  async discoverAll(): Promise<DiscoveryResult> {
    const startTime = Date.now();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║    Phase 30 - Test Discovery Engine                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Phase 1: Scan components
    console.log('📍 Phase 1: Component Scanning...\n');
    const componentInventory = await this.scanner.scanAll();

    // Phase 2: Generate test plans
    console.log('\n📋 Phase 2: Test Discovery...\n');
    const testPlans = TestDiscoveryEngine.analyzeComponentsForTesting(componentInventory.components);

    // Phase 3: Generate report
    console.log('\n📊 Phase 3: Report Generation...\n');
    const testDiscovery = TestDiscoveryEngine.generateReport(componentInventory, testPlans);

    // Phase 4: Export results
    console.log('\n💾 Phase 4: Exporting Results...\n');
    this.exportResults(componentInventory, testDiscovery);

    const discoveryTime = Date.now() - startTime;

    const result: DiscoveryResult = {
      componentInventory,
      testDiscovery,
      stats: {
        discoveryTime,
        componentsFound: componentInventory.totalComponents,
        testsPlanned: testPlans.length,
        estimatedCoverageHours: testPlans.reduce((sum, t) => sum + t.estimatedEffort, 0),
      },
    };

    // Print summary
    this.printSummary(result);

    return result;
  }

  /**
   * Export results to JSON files
   */
  private exportResults(componentInventory: ComponentInventory, testDiscovery: DiscoveryReport): void {
    // Export component inventory
    const inventoryPath = `${this.outputDir}/component-inventory.json`;
    fs.writeFileSync(inventoryPath, JSON.stringify(componentInventory, null, 2));
    console.log(`  ✅ Component Inventory: ${inventoryPath}`);

    // Export test discovery/plans
    const testDiscoveryPath = `${this.outputDir}/test-discovery.json`;
    fs.writeFileSync(testDiscoveryPath, JSON.stringify(testDiscovery, null, 2));
    console.log(`  ✅ Test Discovery: ${testDiscoveryPath}`);

    // Export test plans (detailed)
    const testPlansPath = `${this.outputDir}/test-plans.json`;
    fs.writeFileSync(testPlansPath, JSON.stringify(testDiscovery.testPlans, null, 2));
    console.log(`  ✅ Test Plans: ${testPlansPath}`);

    // Export summary report (human-readable)
    const summaryPath = `${this.outputDir}/discovery-summary.md`;
    const summary = this.generateMarkdownSummary(componentInventory, testDiscovery);
    fs.writeFileSync(summaryPath, summary);
    console.log(`  ✅ Summary Report: ${summaryPath}`);
  }

  /**
   * Generate human-readable Markdown summary
   */
  private generateMarkdownSummary(inventory: ComponentInventory, discovery: DiscoveryReport): string {
    let md = `# Component Discovery Report\n\n`;
    md += `**Generated**: ${new Date().toISOString()}\n\n`;

    // Summary statistics
    md += `## 📊 Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Components | ${inventory.totalComponents} |\n`;
    md += `| Test Plans | ${discovery.testPlans.length} |\n`;
    md += `| Estimated Effort | ${discovery.testPlans.reduce((sum, t) => sum + t.estimatedEffort, 0)} hours |\n`;
    md += `| Coverage Status | ${discovery.coverage.covered}/${inventory.totalComponents} (${((discovery.coverage.covered / inventory.totalComponents) * 100).toFixed(1)}%) |\n`;
    md += `\n`;

    // Components by type
    md += `## 📦 Components by Type\n\n`;
    md += `| Type | Count |\n`;
    md += `|------|-------|\n`;
    Object.entries(discovery.componentsByType).forEach(([type, count]) => {
      md += `| ${type} | ${count} |\n`;
    });
    md += `\n`;

    // Test coverage
    md += `## 🧪 Test Coverage Status\n\n`;
    md += `- ✅ Covered: ${discovery.coverage.covered} components\n`;
    md += `- 🟡 Partial: ${discovery.coverage.partial} components\n`;
    md += `- ❌ Uncovered: ${discovery.coverage.uncovered} components\n`;
    md += `\n`;

    // Recommendations
    md += `## 💡 Recommendations\n\n`;
    discovery.recommendations.forEach(rec => {
      md += `- ${rec}\n`;
    });
    md += `\n`;

    // Critical path components
    const criticalTests = discovery.testPlans.filter(t => t.priority === 'critical' || t.priority === 'high');
    if (criticalTests.length > 0) {
      md += `## ⚡ High Priority Components\n\n`;
      criticalTests.forEach(test => {
        md += `### ${test.componentName}\n`;
        md += `- **Type**: ${test.componentType}\n`;
        md += `- **Priority**: ${test.priority}\n`;
        md += `- **Complexity**: ${test.complexity}\n`;
        md += `- **Estimated Effort**: ${test.estimatedEffort} hours\n`;
        md += `- **Test Types**: ${test.testTypes.map(t => t.type).join(', ')}\n`;
        md += `\n`;
      });
    }

    // Detailed test plans
    md += `## 📋 Detailed Test Plans\n\n`;
    discovery.testPlans.slice(0, 10).forEach(plan => {
      md += `### ${plan.componentName}\n`;
      md += `- **ID**: ${plan.componentId}\n`;
      md += `- **Type**: ${plan.componentType}\n`;
      md += `- **Priority**: ${plan.priority}\n`;
      md += `- **Complexity**: ${plan.complexity}\n`;
      md += `- **Estimated**: ${plan.estimatedEffort} hours\n`;
      md += `\n`;

      if (plan.suggestedTests.length > 0) {
        md += `#### Suggested Tests\n\n`;
        plan.suggestedTests.forEach(test => {
          md += `- **${test.testName}**\n`;
          md += `  - Type: ${test.testType}\n`;
          md += `  - Complexity: ${test.complexity}\n`;
        });
      }
      md += `\n`;
    });

    return md;
  }

  /**
   * Print discovery summary to console
   */
  private printSummary(result: DiscoveryResult): void {
    const { componentInventory, testDiscovery, stats } = result;

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    DISCOVERY COMPLETE                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Components Found:');
    console.log(`  Total: ${stats.componentsFound}`);
    Object.entries(componentInventory.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log('\n🧪 Test Coverage:');
    console.log(`  Uncovered: ${testDiscovery.coverage.uncovered} components`);
    console.log(`  Partial:   ${testDiscovery.coverage.partial} components`);
    console.log(`  Covered:   ${testDiscovery.coverage.covered} components`);
    console.log(`  Coverage:  ${((testDiscovery.coverage.covered / stats.componentsFound) * 100).toFixed(1)}%`);

    console.log('\n💡 Recommendations:');
    testDiscovery.recommendations.forEach(rec => {
      console.log(`  ${rec}`);
    });

    console.log('\n⏱️  Timeline:');
    console.log(`  Test Plans: ${stats.testsPlanned}`);
    console.log(`  Estimated Effort: ${stats.estimatedCoverageHours} hours`);
    console.log(`  Discovery Time: ${stats.discoveryTime}ms`);

    console.log('\n📁 Output Files:');
    console.log(`  ✅ component-inventory.json`);
    console.log(`  ✅ test-discovery.json`);
    console.log(`  ✅ test-plans.json`);
    console.log(`  ✅ discovery-summary.md`);

    console.log('\n🚀 Next Steps:');
    console.log(`  1. Review component-inventory.json for discovered components`);
    console.log(`  2. Review test-discovery.json for test plans`);
    console.log(`  3. Prioritize high-priority components for testing`);
    console.log(`  4. Begin implementation of test suites\n`);
  }
}

/**
 * CLI Entry Point
 */
async function main() {
  const sourceRoot = process.argv[2] || './src';
  const outputDir = process.argv[3] || '.';

  const service = new ComponentDiscoveryService(sourceRoot, outputDir);

  try {
    await service.discoverAll();
    process.exit(0);
  } catch (error) {
    console.error('❌ Discovery failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export default ComponentDiscoveryService;
