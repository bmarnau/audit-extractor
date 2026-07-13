/**
 * API Discovery Framework - Main Entry Point
 * 
 * Exports all services and provides convenience functions for complete workflow
 */

import { ApiDiscoveryService } from './services/api-discovery.service';
import { SmokeTestService } from './services/smoke-test.service';
import { RiskAnalyzerService } from './services/risk-analyzer.service';
import { ReportGeneratorService } from './services/report-generator.service';
import { GovernanceAdapterService, createGovernanceAdapter } from './adapters/governance-adapter';
import * as fs from 'fs';
import * as path from 'path';

// Export types
export * from './api-discovery.types';

// Export services
export { ApiDiscoveryService };
export { SmokeTestService };
export { RiskAnalyzerService };
export { ReportGeneratorService };
export { GovernanceAdapterService, createGovernanceAdapter };

// Create singleton instances
const apiDiscovery = new ApiDiscoveryService(process.cwd(), 'Audit-Safe Document Extractor');
const smokeTestService = new SmokeTestService('http://localhost:3000', 5000);
const riskAnalyzer = new RiskAnalyzerService();
const reportGenerator = new ReportGeneratorService();

export { apiDiscovery, smokeTestService, riskAnalyzer, reportGenerator };

/**
 * Run complete API discovery and smoke test pipeline
 */
export async function runApiDiscoveryPipeline(
  baseUrl: string = 'http://localhost:3000',
  outputDir: string = 'test-results'
): Promise<{
  inventoryPath: string;
  smokeReportPath: string;
  functionalReportPath: string;
  summaryPath: string;
  htmlReportPath: string;
}> {
  console.log('\n🔍 Starting API Discovery Pipeline...\n');

  try {
    // Step 1: Discover API endpoints
    console.log('📍 Step 1: Discovering API endpoints...');
    const endpoints = await apiDiscovery.discoverEndpoints();
    console.log(`✅ Discovered ${endpoints.length} endpoints\n`);

    // Step 2: Generate inventory
    console.log('📋 Step 2: Generating API inventory...');
    const inventory = await apiDiscovery.generateInventory();
    console.log(`✅ Generated inventory with ${inventory.totalControllers} controllers\n`);

    // Step 3: Export inventory
    const inventoryPath = path.join(outputDir, 'api-inventory.json');
    await apiDiscovery.exportInventory(inventory, inventoryPath);
    console.log(`✅ Exported inventory to: ${inventoryPath}\n`);

    // Step 4: Run smoke tests
    console.log('🔄 Step 3: Running smoke tests...');
    const smokeTestService2 = new SmokeTestService(baseUrl, 5000);
    const smokeReport = await smokeTestService2.runAllTests(endpoints);
    console.log(`✅ Smoke tests completed: ${smokeReport.passedTests}/${smokeReport.totalTests} passed\n`);

    // Step 5: Analyze risks
    console.log('⚠️  Step 4: Analyzing API risks...');
    const riskAnalyzer2 = new RiskAnalyzerService();
    const riskAnalyses = await riskAnalyzer2.analyzeAll(endpoints, smokeReport.results);
    console.log(`✅ Risk analysis completed: ${riskAnalyses.filter((r) => r.riskLevel === 'CRITICAL').length} critical issues\n`);

    // Step 6: Generate reports
    console.log('📊 Step 5: Generating reports...');
    const reportGenerator2 = new ReportGeneratorService();
    const functionalReport = await reportGenerator2.generateFunctionalReport(
      inventory,
      smokeReport,
      riskAnalyses
    );
    console.log('✅ Reports generated\n');

    // Step 7: Export reports
    console.log('💾 Step 6: Exporting reports...');
    const smokeReportPath = path.join(outputDir, 'api-smoke-report.json');
    const functionalReportPath = path.join(outputDir, 'api-functional-report.json');
    const summaryPath = path.join(outputDir, 'api-report-summary.txt');
    const htmlReportPath = path.join(outputDir, 'api-discovery-report.html');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save JSON reports
    fs.writeFileSync(smokeReportPath, JSON.stringify(smokeReport, null, 2));
    fs.writeFileSync(functionalReportPath, JSON.stringify(functionalReport, null, 2));

    // Save text summary
    await reportGenerator2.exportSummary(smokeReport, functionalReport, summaryPath);

    // Save HTML report
    await reportGenerator2.generateHtmlReport(inventory, smokeReport, functionalReport, htmlReportPath);

    console.log(`✅ Reports exported:`);
    console.log(`   - Smoke Report: ${smokeReportPath}`);
    console.log(`   - Functional Report: ${functionalReportPath}`);
    console.log(`   - Summary: ${summaryPath}`);
    console.log(`   - HTML Report: ${htmlReportPath}\n`);

    // Step 8: Print summary
    console.log('📈 API DISCOVERY SUMMARY');
    console.log('='.repeat(50));
    console.log(`Overall Health: ${functionalReport.overallHealth}`);
    console.log(`API Health Score: ${functionalReport.apiHealthScore}/100`);
    console.log(`Total Endpoints: ${inventory.totalEndpoints}`);
    console.log(`Smoke Test Pass Rate: ${smokeReport.passRate.toFixed(1)}%`);
    console.log(`Critical Risks: ${functionalReport.riskSummary.criticalRisks}`);
    console.log(`High Risks: ${functionalReport.riskSummary.highRisks}`);
    console.log('='.repeat(50) + '\n');

    return {
      inventoryPath,
      smokeReportPath,
      functionalReportPath,
      summaryPath,
      htmlReportPath,
    };
  } catch (error) {
    console.error('\n❌ API Discovery Pipeline failed:', error);
    throw error;
  }
}

/**
 * Quick API inventory without smoke tests
 */
export async function generateApiInventoryOnly(
  outputDir: string = 'test-results'
): Promise<string> {
  console.log('\n📋 Generating API inventory...\n');

  // @ts-expect-error - endpoints used in discovery
  const _endpoints = await apiDiscovery.discoverEndpoints();
  const inventory = await apiDiscovery.generateInventory();

  const inventoryPath = path.join(outputDir, 'api-inventory.json');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  await apiDiscovery.exportInventory(inventory, inventoryPath);

  console.log(`✅ API Inventory generated:`);
  console.log(`   - Total Endpoints: ${inventory.totalEndpoints}`);
  console.log(`   - Total Controllers: ${inventory.totalControllers}`);
  console.log(`   - Protected Endpoints: ${inventory.protectedEndpoints}`);
  console.log(`   - Saved to: ${inventoryPath}\n`);

  return inventoryPath;
}

/**
 * Run smoke tests only
 */
export async function runSmokeTestsOnly(
  baseUrl: string = 'http://localhost:3000',
  outputDir: string = 'test-results'
): Promise<string> {
  console.log('\n🔄 Running smoke tests...\n');

  const endpoints = await apiDiscovery.discoverEndpoints();
  const smokeTestService2 = new SmokeTestService(baseUrl, 5000);
  const smokeReport = await smokeTestService2.runAllTests(endpoints);

  const smokeReportPath = path.join(outputDir, 'api-smoke-report.json');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(smokeReportPath, JSON.stringify(smokeReport, null, 2));

  console.log(`✅ Smoke tests completed:`);
  console.log(`   - Total Tests: ${smokeReport.totalTests}`);
  console.log(`   - Passed: ${smokeReport.passedTests}`);
  console.log(`   - Failed: ${smokeReport.failedTests}`);
  console.log(`   - Pass Rate: ${smokeReport.passRate.toFixed(1)}%`);
  console.log(`   - Saved to: ${smokeReportPath}\n`);

  return smokeReportPath;
}

/**
 * Run risk analysis only
 */
export async function runRiskAnalysisOnly(
  _outputDir: string = 'test-results'
): Promise<string> {
  console.log('\n⚠️  Running risk analysis...\n');

  const endpoints = await apiDiscovery.discoverEndpoints();
  const riskAnalyzer2 = new RiskAnalyzerService();
  const riskAnalyses = await riskAnalyzer2.analyzeAll(endpoints);

  const criticalCount = riskAnalyses.filter((r) => r.riskLevel === 'CRITICAL').length;
  const highCount = riskAnalyses.filter((r) => r.riskLevel === 'HIGH').length;

  console.log(`✅ Risk analysis completed:`);
  console.log(`   - Total Endpoints Analyzed: ${riskAnalyses.length}`);
  console.log(`   - Critical Issues: ${criticalCount}`);
  console.log(`   - High Issues: ${highCount}\n`);

  return '';
}

/**
 * Integrate API Discovery with Governance Framework
 */
export async function integrateWithGovernance(
  functionalReportPath: string,
  outputDir: string = 'test-results'
): Promise<string> {
  console.log('\n🔗 Integrating with Governance Framework...\n');

  try {
    // Read functional report
    const functionalReportContent = fs.readFileSync(functionalReportPath, 'utf-8');
    const functionalReport = JSON.parse(functionalReportContent);

    // Read smoke report
    const smokeReportPath = path.join(outputDir, 'api-smoke-report.json');
    const smokeReportContent = fs.readFileSync(smokeReportPath, 'utf-8');
    const smokeReport = JSON.parse(smokeReportContent);

    // Create governance adapter
    const adapter = await createGovernanceAdapter('API Discovery Framework');

    // Generate governance report
    const governanceReport = await adapter.generateGovernanceReport(functionalReport, smokeReport);

    // Make release decision
    const releaseDecision = await adapter.makeReleaseDecision(functionalReport, 'NORMAL');

    // Save governance report
    const governanceReportPath = path.join(outputDir, 'api-governance-report.json');
    fs.writeFileSync(governanceReportPath, JSON.stringify({
      ...governanceReport,
      releaseDecision,
      timestamp: new Date().toISOString(),
    }, null, 2));

    console.log(`✅ Governance integration completed:`);
    console.log(`   - Total Failures: ${governanceReport.failures}`);
    console.log(`   - Risk Summary:`);
    console.log(`     - CRITICAL: ${governanceReport.criticalRisks}`);
    console.log(`     - HIGH: ${governanceReport.highRisks}`);
    console.log(`   - Release Decision: ${releaseDecision.canRelease ? 'APPROVED ✅' : 'BLOCKED ⛔'}`);
    console.log(`   - Reason: ${releaseDecision.reason}`);
    console.log(`   - Report saved to: ${governanceReportPath}\n`);

    return governanceReportPath;
  } catch (error) {
    console.error('❌ Governance integration failed:', error);
    throw error;
  }
}
