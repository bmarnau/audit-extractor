import { TestRegistryService } from '../../src/application/TestRegistryService';
import { JsonTestRegistryRepository } from '../../src/infrastructure/persistence/JsonTestRegistryRepository';
import { TestCategory, SeverityImpact } from '../../src/domain/testRegistry/TestMetadata';

describe('TestRegistry Integration - Complete Workflows', () => {
  let service: TestRegistryService;
  let repository: JsonTestRegistryRepository;

  beforeEach(() => {
    repository = new JsonTestRegistryRepository('./test-data/test-registry-integration');
    service = new TestRegistryService(repository);
  });

  afterEach(async () => {
    await repository.deleteAll();
  });

  test('should complete full test discovery and registration workflow', async () => {
    // Register various test types
    const unitTests = await Promise.all([
      service.registerUnitTest({
        testName: 'UserService.create',
        description: 'Should create a new user',
        component: 'UserService',
        framework: 'Jest'
      }),
      service.registerUnitTest({
        testName: 'UserService.getById',
        description: 'Should retrieve user by ID',
        component: 'UserService',
        framework: 'Jest'
      })
    ]);

    const integrationTests = await Promise.all([
      service.registerIntegrationTest({
        testName: 'UserService + Database',
        description: 'Should persist user to database',
        component: 'UserService',
        framework: 'Jest'
      })
    ]);

    const e2eTests = await Promise.all([
      service.registerE2ETest({
        testName: 'User Registration Flow',
        description: 'Complete user registration flow',
        component: 'UserInterface',
        framework: 'Playwright'
      })
    ]);

    // Verify all tests are registered
    const allTests = await service.getAllTests();
    expect(allTests.length).toBe(4);

    // Verify by category
    const byCategory = {
      unit: await service.getTestsByCategory(TestCategory.UNIT),
      integration: await service.getTestsByCategory(TestCategory.INTEGRATION),
      e2e: await service.getTestsByCategory(TestCategory.E2E)
    };

    expect(byCategory.unit.length).toBe(2);
    expect(byCategory.integration.length).toBe(1);
    expect(byCategory.e2e.length).toBe(1);
  });

  test('should handle test execution tracking workflow', async () => {
    const testEntry = await service.registerUnitTest({
      testName: 'Execution Tracking Test',
      description: 'Test for execution tracking',
      component: 'Component',
      framework: 'Jest'
    });

    const testId = testEntry.getTestId().getValue();

    // Simulate test runs
    const runs = [
      { success: true, duration: 150 },
      { success: true, duration: 145 },
      { success: false, duration: 200 },
      { success: true, duration: 155 },
      { success: false, duration: 210 }
    ];

    for (const run of runs) {
      if (run.success) {
        await service.recordTestSuccess(testId, run.duration);
      } else {
        await service.recordTestFailure(testId, run.duration);
      }
    }

    const updated = await service.getTestById(testId);

    expect(updated?.getExecutionStats().totalRuns).toBe(5);
    expect(updated?.getExecutionStats().successCount).toBe(3);
    expect(updated?.getExecutionStats().failureCount).toBe(2);
    expect(updated?.getSuccessRate()).toBeCloseTo(0.6, 2);
  });

  test('should handle build assessment workflow', async () => {
    // Register critical build-blocking tests
    const criticalTest = await service.registerE2ETest({
      testName: 'Critical API Endpoint',
      description: 'Test critical API endpoint',
      component: 'API',
      severityImpact: SeverityImpact.CRITICAL,
      buildBlocking: true,
      framework: 'Jest'
    });

    // Register stable test
    const stableTest = await service.registerUnitTest({
      testName: 'Stable Unit Test',
      description: 'A stable unit test',
      component: 'Component',
      buildBlocking: true,
      framework: 'Jest'
    });

    // Record excellent execution for stable test
    for (let i = 0; i < 10; i++) {
      await service.recordTestSuccess(stableTest.getTestId().getValue(), 100 + Math.random() * 50);
    }

    // Get assessment
    const assessment = await service.getBuildAssessment();

    expect(assessment.buildCanPass).toBe(true);
    expect(assessment.totalBuildBlockingTests).toBe(2);
    expect(assessment.blockingFlakyTests).toBe(0);
  });

  test('should handle component-specific governance workflow', async () => {
    // Register tests for UserService
    const userServiceTests = await Promise.all([
      service.registerUnitTest({
        testName: 'UserService.create unit',
        description: 'Unit test for user creation',
        component: 'UserService',
        framework: 'Jest',
        severityImpact: SeverityImpact.HIGH,
        buildBlocking: true
      }),
      service.registerIntegrationTest({
        testName: 'UserService + Database',
        description: 'Integration test with database',
        component: 'UserService',
        framework: 'Jest'
      }),
      service.registerE2ETest({
        testName: 'User Registration E2E',
        description: 'End-to-end user registration',
        component: 'UserService',
        framework: 'Playwright',
        severityImpact: SeverityImpact.CRITICAL,
        buildBlocking: true
      })
    ]);

    // Get component overview
    const overview = await service.getComponentOverview('UserService');

    expect(overview.component).toBe('UserService');
    expect(overview.totalTests).toBe(3);
    expect(overview.categories[TestCategory.UNIT]).toBe(1);
    expect(overview.categories[TestCategory.INTEGRATION]).toBe(1);
    expect(overview.categories[TestCategory.E2E]).toBe(1);
    expect(overview.buildBlockingTests).toBe(3); // All three tests are build-blocking by default
    expect(overview.frameworks).toContain('Jest');
    expect(overview.frameworks).toContain('Playwright');
  });

  test('should handle test governance and compliance workflow', async () => {
    // Register tests with different configurations
    const tests = await Promise.all([
      service.registerUnitTest({
        testName: 'Critical Security Test',
        description: 'Test for critical vulnerability',
        component: 'Security',
        severityImpact: SeverityImpact.CRITICAL,
        buildBlocking: true,
        framework: 'Jest'
      }),
      service.registerUnitTest({
        testName: 'Performance Test',
        description: 'Performance benchmark',
        component: 'Performance',
        severityImpact: SeverityImpact.MEDIUM,
        buildBlocking: false,
        framework: 'Artillery'
      }),
      service.registerUnitTest({
        testName: 'Disabled Legacy Test',
        description: 'Legacy test that needs fixing',
        component: 'Legacy',
        severityImpact: SeverityImpact.LOW,
        buildBlocking: false,
        framework: 'Jest'
      })
    ]);

    // Disable legacy test
    await service.updateTestEnabled(tests[2].getTestId().getValue(), false);

    // Get statistics
    const stats = await service.getCatalogStatistics();

    expect(stats.total).toBe(3);
    expect(stats.enabledCount).toBe(2);
    expect(stats.disabledCount).toBe(1);
    expect(stats.buildBlockingCount).toBe(1);
    expect(stats.bySeverityImpact.CRITICAL).toBe(1);
    expect(stats.bySeverityImpact.MEDIUM).toBe(1);
    expect(stats.bySeverityImpact.LOW).toBe(1);
  });

  test('should handle test catalog export and reimport workflow', async () => {
    // Register tests
    const testData = [
      {
        testName: 'Export Test 1',
        category: TestCategory.UNIT,
        description: 'First test to export',
        component: 'Component1',
        severityImpact: SeverityImpact.MEDIUM,
        buildBlocking: false,
        enabled: true,
        framework: 'Jest'
      },
      {
        testName: 'Export Test 2',
        category: TestCategory.INTEGRATION,
        description: 'Second test to export',
        component: 'Component2',
        severityImpact: SeverityImpact.HIGH,
        buildBlocking: true,
        enabled: true,
        framework: 'Jest'
      }
    ];

    const registered = await service.registerMany(testData);

    // Export
    const exported = await service.exportCatalog();

    expect(exported.length).toBe(2);
    expect(exported[0].testName).toBe('Export Test 1');
    expect(exported[1].testName).toBe('Export Test 2');

    // Reimport with new repository
    const newRepository = new JsonTestRegistryRepository('./test-data/test-registry-reimport');
    const newService = new TestRegistryService(newRepository);

    const reimported = await newService.registerMany(exported);

    expect(reimported.length).toBe(2);
    expect(reimported[0].getTestName()).toBe('Export Test 1');

    await newRepository.deleteAll();
  });

  test('should detect and report flaky tests', async () => {
    // Create a flaky test
    const flakyTest = await service.registerUnitTest({
      testName: 'Flaky Test',
      description: 'Test that fails intermittently',
      component: 'FlakeyComponent',
      buildBlocking: true,
      framework: 'Jest'
    });

    // Simulate flaky behavior (4 successes + 2 failures = 33% failure rate)
    for (let i = 0; i < 4; i++) {
      await service.recordTestSuccess(flakyTest.getTestId().getValue(), 150 + Math.random() * 50);
    }
    for (let i = 0; i < 2; i++) {
      await service.recordTestFailure(flakyTest.getTestId().getValue(), 200 + Math.random() * 50);
    }

    // Get flaky tests
    const flakyTests = await service.getFlakyTests();

    expect(flakyTests.length).toBe(1);
    expect(flakyTests[0].isFlaky()).toBe(true);

    // Get build assessment - should indicate issue with flaky blocking test
    const assessment = await service.getBuildAssessment();

    expect(assessment.buildCanPass).toBe(false);
    expect(assessment.blockingFlakyTests).toBe(1);
    expect(assessment.recommendation).toContain('flaky');
  });

  test('should handle test dependency tracking', async () => {
    // Create tests with dependencies
    const baseTest = await service.registerUnitTest({
      testName: 'Base Test',
      description: 'Base functionality test',
      component: 'Component',
      framework: 'Jest'
    });

    const dependentTest = await service.registerIntegrationTest({
      testName: 'Dependent Test',
      description: 'Test that depends on base',
      component: 'Component',
      framework: 'Jest',
      dependencies: [baseTest.getTestId().getValue()]
    });

    // Get dependent tests
    const dependents = await service.getTestsByDependencies([baseTest.getTestId().getValue()]);

    expect(dependents.length).toBe(1);
    expect(dependents[0].getTestName()).toBe('Dependent Test');
  });

  test('should handle test framework statistics', async () => {
    // Register tests with different frameworks
    await Promise.all([
      service.registerUnitTest({
        testName: 'Jest Test',
        description: 'Test using Jest',
        component: 'Component',
        framework: 'Jest'
      }),
      service.registerUnitTest({
        testName: 'Vitest Test',
        description: 'Test using Vitest',
        component: 'Component',
        framework: 'Vitest'
      }),
      service.registerE2ETest({
        testName: 'Playwright Test',
        description: 'Test using Playwright',
        component: 'Component',
        framework: 'Playwright'
      })
    ]);

    const stats = await service.getCatalogStatistics();

    expect(stats.byFramework['Jest']).toBe(1);
    expect(stats.byFramework['Vitest']).toBe(1);
    expect(stats.byFramework['Playwright']).toBe(1);
  });

  test('should handle all-component overview aggregation', async () => {
    // Register tests for multiple components
    await service.registerUnitTest({
      testName: 'UserService Test',
      description: 'Test for UserService',
      component: 'UserService',
      framework: 'Jest'
    });

    await service.registerIntegrationTest({
      testName: 'OrderService Test',
      description: 'Test for OrderService',
      component: 'OrderService',
      framework: 'Jest'
    });

    await service.registerE2ETest({
      testName: 'PaymentService Test',
      description: 'Test for PaymentService',
      component: 'PaymentService',
      framework: 'Playwright'
    });

    const allOverviews = await service.getAllComponentOverviews();

    expect(allOverviews.length).toBe(3);
    const components = allOverviews.map((o: any) => o.component);
    expect(components).toContain('UserService');
    expect(components).toContain('OrderService');
    expect(components).toContain('PaymentService');
  });
});
