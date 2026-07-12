/**
 * API Discovery & Smoke Tests Integration Script
 * Führt API-Scan und anschließende Smoke Tests durch
 */

import * as path from 'path';
import { ApiEndpointDiscoveryService } from '../src/infrastructure/services/api-endpoint-discovery.service';
import { ApiSmokeTestsService } from '../src/infrastructure/services/api-smoke-tests.service';

async function main() {
  const projectRoot = process.cwd();
  const outputDir = path.join(projectRoot, 'test-results');

  console.log('🚀 Starte API Discovery & Smoke Tests\n');

  try {
    // Step 1: Entdecke API Endpoints
    console.log('📡 Phase 1: Scanne API Endpoints...\n');
    const discoveryService = new ApiEndpointDiscoveryService(projectRoot);
    const inventory = await discoveryService.discover();

    console.log(`\n✅ ${inventory.totalEndpoints} Endpoints gefunden\n`);
    console.log(`📊 Zusammenfassung:`);
    console.log(`   GET:     ${inventory.summary.byMethod['GET'] || 0}`);
    console.log(`   POST:    ${inventory.summary.byMethod['POST'] || 0}`);
    console.log(`   PUT:     ${inventory.summary.byMethod['PUT'] || 0}`);
    console.log(`   DELETE:  ${inventory.summary.byMethod['DELETE'] || 0}`);
    console.log(`   PATCH:   ${inventory.summary.byMethod['PATCH'] || 0}`);\n    console.log(`🔒 Geschützt: ${inventory.summary.protectedCount}`);\n    console.log(`🔓 Öffentlich: ${inventory.summary.publicCount}\n`);\n\n    // Exportiere Inventur\n    const inventoryPath = path.join(outputDir, 'api-inventory.json');\n    await discoveryService.exportToJson(inventoryPath);\n\n    // Step 2: Führe Smoke Tests durch\n    console.log('\\n🧪 Phase 2: Starte Smoke Tests...\\n');\n    const smokeTestService = new ApiSmokeTestsService(\n      process.env.API_BASE_URL || 'http://localhost:3000',\n      parseInt(process.env.TEST_TIMEOUT || '5000')\n    );\n\n    const report = await smokeTestService.runTests(inventory);\n\n    // Exportiere Report\n    const reportPath = path.join(outputDir, 'api-smoke-report.json');\n    await smokeTestService.exportToJson(report, reportPath);\n\n    // Step 3: Zeige Zusammenfassung\n    console.log('\\n' + '='.repeat(60));\n    console.log('📋 FINAL REPORT');\n    console.log('='.repeat(60));\n\n    if (report.summary.failuresByEndpoint) {\n      const failedEndpoints = Object.entries(report.summary.failuresByEndpoint);\n      if (failedEndpoints.length > 0) {\n        console.log('\\n❌ Fehlgeschlagene Endpoints:');\n        for (const [endpoint, errors] of failedEndpoints) {\n          console.log(`\\n   ${endpoint}`);\n          for (const error of errors) {\n            console.log(`     - ${error}`);\n          }\n        }\n      }\n    }\n\n    if (report.summary.slowEndpoints.length > 0) {\n      console.log('\\n⏱️  Langsame Endpoints (>1000ms):');\n      for (const endpoint of report.summary.slowEndpoints) {\n        console.log(`   ${endpoint.route} - ${endpoint.time}ms`);\n      }\n    }\n\n    console.log('\\n' + '='.repeat(60));\n\n    // Exit Code basierend auf Erfolg\n    process.exit(report.failed > 0 ? 1 : 0);\n  } catch (error) {\n    console.error('❌ Fehler:', error instanceof Error ? error.message : String(error));\n    if (error instanceof Error && error.stack) {\n      console.error(error.stack);\n    }\n    process.exit(1);\n  }\n}\n\nmain();\n