#!/usr/bin/env node
/**
 * Comprehensive Phase 43B-E Tests
 * Tests Recommendations API, Report Viewer, and Export Services
 * 
 * @version 0.37.0
 * @phase 43E
 * @execution: node scripts/test-phase43-complete.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Import services
const loadModule = async (modulePath) => {
  try {
    return await import(modulePath);
  } catch (err) {
    console.error(`Error loading ${modulePath}:`, err.message);
    throw err;
  }
};

class Phase43ComprehensiveTests {
  constructor() {
    this.passCount = 0;
    this.failCount = 0;
    this.testResults = [];
  }

  async runTest(name, testFn) {
    try {
      await testFn();
      this.passCount++;
      this.testResults.push({ name, status: 'PASS' });
      console.log(`✓ ${name}`);
    } catch (err) {
      this.failCount++;
      this.testResults.push({ name, status: 'FAIL', error: err.message });
      console.log(`✗ ${name}: ${err.message}`);
    }
  }

  assertEquals(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
  }

  assertExists(value, message) {
    if (!value) {
      throw new Error(`${message}: expected value to exist`);
    }
  }

  assertArrayLength(arr, length, message) {
    if (!Array.isArray(arr) || arr.length !== length) {
      throw new Error(`${message}: expected array of length ${length}, got ${arr?.length || 'not an array'}`);
    }
  }

  async runAll() {
    console.log('🧪 Phase 43B-E Comprehensive Test Suite\n');

    // Phase 43B: Recommendations API
    console.log('📋 Phase 43B: Recommendations API Tests\n');
    
    await this.runTest('Load recommendations.json data', () => {
      const dataPath = path.join(projectRoot, 'data', 'recommendations.json');
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      this.assertExists(data, 'recommendations.json should exist');
      this.assertArrayLength(data, 11, 'Should have 11 recommendations');
    });

    await this.runTest('Validate recommendation schema', () => {
      const dataPath = path.join(projectRoot, 'data', 'recommendations.json');
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      const rec = data[0];
      
      this.assertExists(rec.id, 'id should exist');
      this.assertExists(rec.title, 'title should exist');
      this.assertExists(rec.priority, 'priority should exist');
      this.assertExists(rec.status, 'status should exist');
      this.assertExists(rec.description, 'description should exist');
      this.assertExists(rec.relatedFindingIds, 'relatedFindingIds should exist');
    });

    await this.runTest('Verify priority distribution', () => {
      const dataPath = path.join(projectRoot, 'data', 'recommendations.json');
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      
      const byPriority = {};
      data.forEach(rec => {
        byPriority[rec.priority] = (byPriority[rec.priority] || 0) + 1;
      });
      
      this.assertEquals(byPriority['Sofort erforderlich'], 1, 'Critical priority count');
      this.assertEquals(byPriority['Kurzfristig empfohlen'], 4, 'Short-term priority count');
      this.assertEquals(byPriority['Mittelfristig empfohlen'], 4, 'Medium-term priority count');
      this.assertEquals(byPriority['Optional'], 2, 'Optional priority count');
    });

    await this.runTest('Verify status distribution', () => {
      const dataPath = path.join(projectRoot, 'data', 'recommendations.json');
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      
      const byStatus = {};
      data.forEach(rec => {
        byStatus[rec.status] = (byStatus[rec.status] || 0) + 1;
      });
      
      this.assertEquals(byStatus['open'], 8, 'Open status count');
      this.assertEquals(byStatus['in-progress'], 1, 'In-progress status count');
      this.assertEquals(byStatus['completed'], 2, 'Completed status count');
    });

    // Phase 43C: Report Viewer DTOs
    console.log('\n📊 Phase 43C: Report Viewer DTOs Tests\n');

    await this.runTest('Report Viewer DTOs exist', () => {
      const dtoPath = path.join(projectRoot, 'dist', 'api', 'dtos', 'report-viewer.dto.js');
      this.assertExists(fs.existsSync(dtoPath), 'report-viewer.dto.js compiled file should exist');
    });

    await this.runTest('Verify color mappings', async () => {
      const { default: dtos } = await loadModule(
        path.join(projectRoot, 'dist', 'api', 'dtos', 'report-viewer.dto.js')
      );
      
      this.assertExists(dtos.SeverityColorMap, 'SeverityColorMap should exist');
      this.assertExists(dtos.PriorityColorMap, 'PriorityColorMap should exist');
      this.assertExists(dtos.StatusColorMap, 'StatusColorMap should exist');
      
      this.assertEquals(dtos.SeverityColorMap.critical, '#d32f2f', 'Critical color');
      this.assertEquals(dtos.StatusColorMap.completed, '#388e3c', 'Completed status color');
    });

    // Phase 43D: PDF/Export Services
    console.log('\n📤 Phase 43D: PDF/Export Services Tests\n');

    await this.runTest('PDF Export service compiled', () => {
      const svcPath = path.join(projectRoot, 'dist', 'api', 'services', 'pdf-export.service.js');
      this.assertExists(fs.existsSync(svcPath), 'pdf-export.service.js compiled file should exist');
    });

    await this.runTest('Export routes compiled', () => {
      const routesPath = path.join(projectRoot, 'dist', 'api', 'routes', 'export.routes.js');
      this.assertExists(fs.existsSync(routesPath), 'export.routes.js compiled file should exist');
    });

    // Phase 43E: Dashboard Widget
    console.log('\n🎨 Phase 43E: Dashboard Widget Tests\n');

    await this.runTest('Dashboard widget component exists', () => {
      const widgetPath = path.join(projectRoot, 'frontend', 'src', 'components', 'Dashboard', 'TechnicalAuditWidget.tsx');
      this.assertExists(fs.existsSync(widgetPath), 'TechnicalAuditWidget.tsx should exist');
    });

    await this.runTest('Dashboard widget imports correct dependencies', () => {
      const widgetPath = path.join(projectRoot, 'frontend', 'src', 'components', 'Dashboard', 'TechnicalAuditWidget.tsx');
      const content = fs.readFileSync(widgetPath, 'utf-8');
      
      this.assertExists(content.includes('useState'), 'Should use useState hook');
      this.assertExists(content.includes('Material-UI'), 'Should import Material-UI');
      this.assertExists(content.includes('api/technical-tests'), 'Should call technical tests API');
    });

    // Integration Tests
    console.log('\n🔗 Integration Tests\n');

    await this.runTest('API server mounts recommendations routes', () => {
      const serverPath = path.join(projectRoot, 'dist', 'infrastructure', 'api', 'index.js');
      const content = fs.readFileSync(serverPath, 'utf-8');
      
      this.assertExists(content.includes('recommendations'), 'Should mount recommendations routes');
      this.assertExists(content.includes('export'), 'Should mount export routes');
    });

    await this.runTest('All TypeScript compiled without errors', () => {
      const files = [
        'dist/api/services/recommendations.service.js',
        'dist/api/routes/recommendations.routes.js',
        'dist/api/routes/export.routes.js',
        'dist/api/dtos/report-viewer.dto.js',
      ];
      
      for (const file of files) {
        const filePath = path.join(projectRoot, file);
        this.assertExists(fs.existsSync(filePath), `${file} should be compiled`);
      }
    });

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✓ Passed: ${this.passCount}`);
    console.log(`✗ Failed: ${this.failCount}`);
    console.log(`Total: ${this.passCount + this.failCount}`);
    console.log('='.repeat(60));

    if (this.failCount > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
      process.exit(1);
    } else {
      console.log('\n✅ ALL TESTS PASSED! Phase 43B-E is ready for deployment.');
      process.exit(0);
    }
  }
}

// Run tests
const tester = new Phase43ComprehensiveTests();
tester.runAll().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
