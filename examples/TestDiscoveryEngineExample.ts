/**
 * Test Discovery Engine - Praktische Beispiele
 * 
 * Zeigt wie die Discovery Engine in realen Szenarien verwendet wird:
 * - Automatische Komponenten-Erkennung
 * - Intelligente Testplanung
 * - Priorisierung für Testentwicklung
 */

import { ComponentDiscoveryService } from '../src/infrastructure/discovery';

/**
 * Beispiel 1: Basis Discovery Workflow
 */
async function example1_BasicDiscovery() {
  console.log('\n═══════════════════════════════════════════');
  console.log('Beispiel 1: Basis Discovery');
  console.log('═══════════════════════════════════════════\n');

  const service = new ComponentDiscoveryService('./src', './');

  try {
    const result = await service.discoverAll();

    console.log('\n📊 Discovery Ergebnisse:');
    console.log(`   Komponenten gefunden: ${result.stats.componentsFound}`);
    console.log(`   Testpläne generiert: ${result.stats.testsPlanned}`);
    console.log(`   Geschätzter Aufwand: ${result.stats.estimatedCoverageHours} Stunden`);
    console.log(`   Discovery Zeit: ${result.stats.discoveryTime}ms`);
  } catch (error) {
    console.error('Discovery fehlgeschlagen:', error);
  }
}

/**
 * Beispiel 2: Komponenten nach Typ filtern
 */
function example2_FilterByType() {
  console.log('\n═══════════════════════════════════════════');
  console.log('Beispiel 2: Komponenten nach Typ filtern');
  console.log('═══════════════════════════════════════════\n');

  const mockInventory = {
    components: [
      {
        componentId: 'endpoint_1',
        componentType: 'endpoint',
        location: { filePath: 'api/users.ts', lineNumber: 1, columnNumber: 0 },
        name: 'GET /api/users',
        dependencies: [],
        testCoverageStatus: 'uncovered',
      },
      {
        componentId: 'endpoint_2',
        componentType: 'endpoint',
        location: { filePath: 'api/users.ts', lineNumber: 15, columnNumber: 0 },
        name: 'POST /api/users',
        dependencies: [],
        testCoverageStatus: 'uncovered',
      },
      {
        componentId: 'service_1',
        componentType: 'service',
        location: { filePath: 'services/UserService.ts', lineNumber: 1, columnNumber: 0 },
        name: 'UserService',
        dependencies: [],
        testCoverageStatus: 'uncovered',
      },
    ],
  };

  console.log('🔍 Alle Endpoints:');
  mockInventory.components
    .filter(c => c.componentType === 'endpoint')
    .forEach(ep => {
      console.log(`   ${ep.name} (${ep.location.filePath}:${ep.location.lineNumber})`);
    });

  console.log('\n🔍 Alle Services:');
  mockInventory.components
    .filter(c => c.componentType === 'service')
    .forEach(svc => {
      console.log(`   ${svc.name} (${svc.location.filePath}:${svc.location.lineNumber})`);
    });
}

/**
 * Beispiel 3: Testplanung nach Priorität
 */
function example3_TestPlanningByPriority() {
  console.log('\n═══════════════════════════════════════════');
  console.log('Beispiel 3: Testplanung nach Priorität');
  console.log('═══════════════════════════════════════════\n');

  const mockTestPlans = [
    {
      componentId: 'endpoint_1',
      componentName: 'GET /api/users',
      componentType: 'endpoint',
      priority: 'critical' as const,
      estimatedEffort: 3,
      complexity: 'moderate' as const,
      testTypes: [
        { type: 'integration' as const, description: 'HTTP request/response validation', estimated: 1.5 },
        { type: 'contract' as const, description: 'OpenAPI contract testing', estimated: 1 },
      ],
      dependencies: [],
      suggestedTests: [
        {
          testName: 'should respond with 200 for valid GET /api/users',
          testType: 'integration' as const,
          description: 'Test successful GET request',
          keywords: ['happy-path', 'success', '200'],
          complexity: 'simple' as const,
        },
        {
          testName: 'should validate GET /api/users request payload',
          testType: 'integration' as const,
          description: 'Test invalid input validation',
          keywords: ['validation', 'error', '400'],
          complexity: 'moderate' as const,
        },
      ],
    },
    {
      componentId: 'service_1',
      componentName: 'UserService',
      componentType: 'service',
      priority: 'high' as const,
      estimatedEffort: 4,
      complexity: 'moderate' as const,
      testTypes: [
        { type: 'unit' as const, description: 'Business logic tests', estimated: 1.5 },
        { type: 'unit' as const, description: 'Error scenarios', estimated: 1 },
      ],
      dependencies: ['UserRepository'],
      suggestedTests: [],
    },
    {
      componentId: 'component_1',
      componentName: 'UserCard',
      componentType: 'component',
      priority: 'medium' as const,
      estimatedEffort: 2,
      complexity: 'simple' as const,
      testTypes: [],
      dependencies: [],
      suggestedTests: [],
    },
  ];

  console.log('🎯 CRITICAL Priority (Start hier):');
  mockTestPlans
    .filter(p => p.priority === 'critical')
    .forEach(plan => {
      console.log(`   ${plan.componentName} (${plan.estimatedEffort}h)`);
      console.log(`     - Complexity: ${plan.complexity}`);
      console.log(`     - Test Types: ${plan.testTypes.map(t => t.type).join(', ')}`);
    });

  console.log('\n⚡ HIGH Priority:');
  mockTestPlans
    .filter(p => p.priority === 'high')
    .forEach(plan => {
      console.log(`   ${plan.componentName} (${plan.estimatedEffort}h)`);
      console.log(`     - Dependencies: ${plan.dependencies.join(', ') || 'none'}`);
    });

  console.log('\n📊 MEDIUM Priority:');
  mockTestPlans
    .filter(p => p.priority === 'medium')
    .forEach(plan => {
      console.log(`   ${plan.componentName} (${plan.estimatedEffort}h)`);
    });

  const totalEffort = mockTestPlans.reduce((sum, p) => sum + p.estimatedEffort, 0);
  console.log(`\n⏱️  Total Estimated Effort: ${totalEffort} hours`);
}

/**
 * Beispiel 4: Detaillierte Testsuggestions
 */
function example4_DetailedTestSuggestions() {
  console.log('\n═══════════════════════════════════════════');
  console.log('Beispiel 4: Detaillierte Testsuggestions');
  console.log('═══════════════════════════════════════════\n');

  const mockPlan = {
    componentName: 'UserService',
    suggestedTests: [
      {
        testName: 'should find user by ID',
        testType: 'unit' as const,
        description: 'Test user lookup functionality',
        keywords: ['unit', 'query', 'success'],
        complexity: 'simple' as const,
      },
      {
        testName: 'should create user with valid data',
        testType: 'unit' as const,
        description: 'Test user creation',
        keywords: ['unit', 'create', 'validation'],
        complexity: 'moderate' as const,
      },
      {
        testName: 'should throw error on invalid email',
        testType: 'unit' as const,
        description: 'Test validation logic',
        keywords: ['unit', 'error', 'validation'],
        complexity: 'simple' as const,
      },
      {
        testName: 'should mock dependencies in UserService',
        testType: 'unit' as const,
        description: 'Test with mocked dependencies',
        keywords: ['unit', 'mock', 'dependency'],
        complexity: 'simple' as const,
      },
      {
        testName: 'should handle errors gracefully',
        testType: 'unit' as const,
        description: 'Test error handling and recovery',
        keywords: ['unit', 'error', 'recovery'],
        complexity: 'complex' as const,
      },
    ],
  };

  console.log(`📋 ${mockPlan.componentName} Testsuggestions:\n`);

  mockPlan.suggestedTests.forEach((test, idx) => {
    console.log(`${idx + 1}. ${test.testName}`);
    console.log(`   Type: ${test.testType}`);
    console.log(`   Complexity: ${test.complexity}`);
    console.log(`   Description: ${test.description}`);
    console.log();
  });
}

/**
 * Beispiel 5: Coverage Status Analyse
 */
function example5_CoverageAnalysis() {
  console.log('\n═══════════════════════════════════════════');
  console.log('Beispiel 5: Coverage Status Analyse');
  console.log('═══════════════════════════════════════════\n');

  const mockReport = {
    totalComponents: 25,
    coverage: {
      covered: 8,
      partial: 5,
      uncovered: 12,
    },
    recommendations: [
      '🔴 CRITICAL: Test coverage below 50%. Prioritize critical path testing.',
      '⚡ PRIORITY: 5 critical components require immediate testing.',
      '📈 COMPLEXITY: 8 complex components. Consider breaking into smaller units.',
      '⏱️  EFFORT: Estimated 47 hours to achieve full test coverage.',
      '🎯 START HERE: Begin with GET /api/users (critical, high priority).',
    ],
  };

  const coveragePercentage = (mockReport.coverage.covered / mockReport.totalComponents) * 100;

  console.log('📊 Coverage Status:');
  console.log(`   ✅ Covered:   ${mockReport.coverage.covered}/${mockReport.totalComponents} (${coveragePercentage.toFixed(1)}%)`);
  console.log(`   🟡 Partial:   ${mockReport.coverage.partial}/${mockReport.totalComponents}`);
  console.log(`   ❌ Uncovered: ${mockReport.coverage.uncovered}/${mockReport.totalComponents}`);

  console.log('\n💡 Recommendations:');
  mockReport.recommendations.forEach(rec => {
    console.log(`   ${rec}`);
  });
}

/**
 * Beispiel 6: Dependency Analysis
 */
function example6_DependencyAnalysis() {
  console.log('\n═══════════════════════════════════════════');
  console.log('Beispiel 6: Dependency Analysis');
  console.log('═══════════════════════════════════════════\n');

  const mockComponents = [
    {
      name: 'UserController',
      dependencies: ['UserService'],
      dependencyCount: 1,
    },
    {
      name: 'UserService',
      dependencies: ['UserRepository', 'CacheService', 'LoggerService'],
      dependencyCount: 3,
    },
    {
      name: 'UserRepository',
      dependencies: ['Database'],
      dependencyCount: 1,
    },
    {
      name: 'CacheService',
      dependencies: ['RedisClient'],
      dependencyCount: 1,
    },
  ];

  console.log('🔗 Component Dependencies:\n');

  mockComponents
    .sort((a, b) => b.dependencyCount - a.dependencyCount)
    .forEach(comp => {
      console.log(`${comp.name}`);
      console.log(`   Dependencies: ${comp.dependencies.join(' → ')}`);
      console.log(`   Complexity Score: ${'★'.repeat(Math.min(comp.dependencyCount, 5))}`);
      console.log();
    });

  console.log('💡 Insight: Komponenten mit mehr Dependencies brauchen mehr mocking in Tests');
}

/**
 * Main: Alle Beispiele ausführen
 */
async function runAllExamples() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Phase 30 - Test Discovery Engine - Praktische Beispiele ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Beispiele synchron ausführen
  example2_FilterByType();
  example3_TestPlanningByPriority();
  example4_DetailedTestSuggestions();
  example5_CoverageAnalysis();
  example6_DependencyAnalysis();

  // Beispiel 1 asynchron ausführen
  await example1_BasicDiscovery();

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                  Alle Beispiele abgeschlossen             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
}

// Exportieren für Verwendung
export { example1_BasicDiscovery, example2_FilterByType, example3_TestPlanningByPriority, 
         example4_DetailedTestSuggestions, example5_CoverageAnalysis, example6_DependencyAnalysis,
         runAllExamples };

// Wenn direkt ausgeführt
if (require.main === module) {
  runAllExamples().catch(console.error);
}
