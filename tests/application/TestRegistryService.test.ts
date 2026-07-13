import { TestRegistryService } from '../../src/application/TestRegistryService';
import { JsonTestRegistryRepository } from '../../src/infrastructure/persistence/JsonTestRegistryRepository';
import { TestCategory, SeverityImpact } from '../../src/domain/testRegistry/TestMetadata';

describe('TestRegistry Application - TestRegistryService', () => {
  let service: TestRegistryService;
  let repository: JsonTestRegistryRepository;

  beforeEach(() => {
    repository = new JsonTestRegistryRepository('./test-data/test-registry-tmp');
    service = new TestRegistryService(repository);
  });

  afterEach(async () => {
    await repository.deleteAll();
  });

  test('should register a new test', async () => {
    const entry = await service.registerUnitTest({
      testName: 'Sample Unit Test',
      description: 'Sample unit test',
      component: 'SampleComponent',
      framework: 'Jest'
    });

    expect(entry.getTestName()).toBe('Sample Unit Test');
    expect(entry.getCategory()).toBe(TestCategory.UNIT);
  });

  test('should get test by ID', async () => {
    const registered = await service.registerUnitTest({
      testName: 'Get Test',
      description: 'Test for get operation',
      component: 'Component',
      framework: 'Jest'
    });

    const retrieved = await service.getTestById(registered.getTestId().getValue());
    expect(retrieved).not.toBeNull();
    expect(retrieved?.getTestName()).toBe('Get Test');
  });

  test('should return all tests', async () => {
    await service.registerUnitTest({
      testName: 'Test 1',
      description: 'First test',
      component: 'Comp1',
      framework: 'Jest'
    });

    await service.registerIntegrationTest({
      testName: 'Test 2',
      description: 'Second test',
      component: 'Comp2',
      framework: 'Jest'
    });

    const all = await service.getAllTests();
    expect(all.length).toBe(2);
  });

  test('should get tests by category', async () => {
    await service.registerUnitTest({
      testName: 'Unit Test',
      description: 'A unit test',
      component: 'Component',
      framework: 'Jest'
    });

    await service.registerIntegrationTest({
      testName: 'Integration Test',
      description: 'An integration test',
      component: 'Component',
      framework: 'Jest'
    });

    const unitTests = await service.getTestsByCategory(TestCategory.UNIT);
    const integrationTests = await service.getTestsByCategory(TestCategory.INTEGRATION);

    expect(unitTests.length).toBe(1);
    expect(integrationTests.length).toBe(1);
  });

  test('should get tests by component', async () => {
    await service.registerUnitTest({
      testName: 'Test 1',
      description: 'First test',
      component: 'UserService',
      framework: 'Jest'
    });

    await service.registerUnitTest({
      testName: 'Test 2',
      description: 'Second test',
      component: 'OrderService',
      framework: 'Jest'
    });

    const userTests = await service.getTestsByComponent('UserService');
    expect(userTests.length).toBe(1);
    expect(userTests[0].getTestName()).toBe('Test 1');
  });

  test('should get tests by severity impact', async () => {
    await service.registerUnitTest({
      testName: 'Low Priority',
      description: 'Low priority test',
      component: 'Component',
      severityImpact: SeverityImpact.LOW,
      framework: 'Jest'
    });

    await service.registerUnitTest({
      testName: 'Critical Priority',
      description: 'Critical priority test',
      component: 'Component',
      severityImpact: SeverityImpact.CRITICAL,
      framework: 'Jest'
    });

    const critical = await service.getTestsBySeverityImpact(SeverityImpact.CRITICAL);
    expect(critical.length).toBe(1);
    expect(critical[0].getSeverityImpact()).toBe(SeverityImpact.CRITICAL);
  });

  test('should get build blocking tests', async () => {
    await service.registerUnitTest({
      testName: 'Non-Blocking Test',
      description: 'Non-blocking test',
      component: 'Component',
      buildBlocking: false,
      framework: 'Jest'
    });

    await service.registerIntegrationTest({
      testName: 'Blocking Test',
      description: 'Blocking test',
      component: 'Component',
      buildBlocking: true,
      framework: 'Jest'
    });

    const blocking = await service.getBuildBlockingTests();
    expect(blocking.length).toBe(1);
    expect(blocking[0].isBuildBlocking()).toBe(true);
  });

  test('should get enabled/disabled tests', async () => {
    const enabled = await service.registerUnitTest({
      testName: 'Enabled Test',
      description: 'Enabled test',
      component: 'Component',
      framework: 'Jest'
    });

    const disabled = await service.registerUnitTest({
      testName: 'Disabled Test',
      description: 'Disabled test',
      component: 'Component',
      framework: 'Jest'
    });

    await service.updateTestEnabled(disabled.getTestId().getValue(), false);

    const enabledTests = await service.getEnabledTests();
    const disabledTests = await service.getDisabledTests();

    expect(enabledTests.length).toBe(1);
    expect(disabledTests.length).toBe(1);
  });

  test('should search tests by name', async () => {
    await service.registerUnitTest({
      testName: 'UserService.create',
      description: 'Create user test',
      component: 'UserService',
      framework: 'Jest'
    });

    await service.registerUnitTest({
      testName: 'UserService.delete',
      description: 'Delete user test',
      component: 'UserService',
      framework: 'Jest'
    });

    const results = await service.searchTests('create');
    expect(results.length).toBe(1);
    expect(results[0].getTestName()).toContain('create');
  });

  test('should record test execution success', async () => {
    const entry = await service.registerUnitTest({
      testName: 'Execution Test',
      description: 'Test for execution recording',
      component: 'Component',
      framework: 'Jest'
    });

    await service.recordTestSuccess(entry.getTestId().getValue(), 150);

    const updated = await service.getTestById(entry.getTestId().getValue());
    expect(updated?.getSuccessRate()).toBe(1.0);
  });

  test('should record test execution failure', async () => {
    const entry = await service.registerUnitTest({
      testName: 'Failure Test',
      description: 'Test for failure recording',
      component: 'Component',
      framework: 'Jest'
    });

    await service.recordTestFailure(entry.getTestId().getValue(), 200);

    const updated = await service.getTestById(entry.getTestId().getValue());
    expect(updated?.getSuccessRate()).toBe(0.0);
  });

  test('should update test enabled status', async () => {
    const entry = await service.registerUnitTest({
      testName: 'Toggle Test',
      description: 'Test for toggling',
      component: 'Component',
      framework: 'Jest'
    });

    expect(entry.isEnabled()).toBe(true);

    const disabled = await service.updateTestEnabled(entry.getTestId().getValue(), false);
    expect(disabled?.isEnabled()).toBe(false);
  });

  test('should update build blocking status', async () => {
    const entry = await service.registerUnitTest({
      testName: 'Build Block Test',
      description: 'Test for build blocking',
      component: 'Component',
      framework: 'Jest'
    });

    const updated = await service.updateBuildBlocking(entry.getTestId().getValue(), true);
    expect(updated?.isBuildBlocking()).toBe(true);
  });

  test('should update severity impact', async () => {
    const entry = await service.registerUnitTest({
      testName: 'Severity Test',
      description: 'Test for severity update',
      component: 'Component',
      framework: 'Jest'
    });

    const updated = await service.updateSeverityImpact(entry.getTestId().getValue(), SeverityImpact.CRITICAL);
    expect(updated?.getSeverityImpact()).toBe(SeverityImpact.CRITICAL);
  });

  test('should get catalog statistics', async () => {
    await service.registerUnitTest({
      testName: 'Unit Test',
      description: 'A unit test',
      component: 'UserService',
      framework: 'Jest'
    });

    await service.registerIntegrationTest({
      testName: 'Integration Test',
      description: 'An integration test',
      component: 'OrderService',
      framework: 'Jest'
    });

    const stats = await service.getCatalogStatistics();

    expect(stats.total).toBe(2);
    expect(stats.byCategory[TestCategory.UNIT]).toBe(1);
    expect(stats.byCategory[TestCategory.INTEGRATION]).toBe(1);
    expect(stats.byComponent['UserService']).toBe(1);
    expect(stats.enabledCount).toBe(2);
  });

  test('should get component overview', async () => {
    await service.registerUnitTest({
      testName: 'UserService Unit Test',
      description: 'A unit test for UserService',
      component: 'UserService',
      framework: 'Jest'
    });

    await service.registerIntegrationTest({
      testName: 'UserService Integration Test',
      description: 'An integration test for UserService',
      component: 'UserService',
      framework: 'Jest'
    });

    const overview = await service.getComponentOverview('UserService');

    expect(overview.component).toBe('UserService');
    expect(overview.totalTests).toBe(2);
    expect(overview.categories[TestCategory.UNIT]).toBe(1);
    expect(overview.categories[TestCategory.INTEGRATION]).toBe(1);
  });

  test('should get build assessment report', async () => {
    await service.registerUnitTest({
      testName: 'Stable Test',
      description: 'A stable test',
      component: 'Component',
      buildBlocking: true,
      framework: 'Jest'
    });

    const assessment = await service.getBuildAssessment();

    expect(assessment.buildCanPass).toBe(true);
    expect(assessment.totalBuildBlockingTests).toBeGreaterThan(0);
  });

  test('should detect flaky build blocking tests', async () => {
    const entry = await service.registerUnitTest({
      testName: 'Flaky Test',
      description: 'A flaky test',
      component: 'Component',
      buildBlocking: true,
      framework: 'Jest'
    });

    // Simulate flaky test (record failures to exceed 30% threshold)
    for (let i = 0; i < 4; i++) {
      await service.recordTestSuccess(entry.getTestId().getValue(), 100);
    }
    for (let i = 0; i < 2; i++) {
      await service.recordTestFailure(entry.getTestId().getValue(), 100);
    }

    const assessment = await service.getBuildAssessment();
    expect(assessment.buildCanPass).toBe(false);
    expect(assessment.blockingFlakyTests).toBeGreaterThan(0);
  });

  test('should register multiple tests at once', async () => {
    const testData = [
      {
        testName: 'Test 1',
        category: TestCategory.UNIT,
        description: 'First test',
        component: 'Comp1',
        severityImpact: SeverityImpact.MEDIUM,
        buildBlocking: false,
        enabled: true,
        framework: 'Jest'
      },
      {
        testName: 'Test 2',
        category: TestCategory.UNIT,
        description: 'Second test',
        component: 'Comp2',
        severityImpact: SeverityImpact.MEDIUM,
        buildBlocking: false,
        enabled: true,
        framework: 'Jest'
      }
    ];

    const entries = await service.registerMany(testData);
    expect(entries.length).toBe(2);

    const all = await service.getAllTests();
    expect(all.length).toBe(2);
  });

  test('should get test count', async () => {
    expect(await service.getTestCount()).toBe(0);

    await service.registerUnitTest({
      testName: 'Test 1',
      description: 'First test',
      component: 'Component',
      framework: 'Jest'
    });

    expect(await service.getTestCount()).toBe(1);
  });

  test('should check if test exists', async () => {
    const entry = await service.registerUnitTest({
      testName: 'Existence Test',
      description: 'Test for existence check',
      component: 'Component',
      framework: 'Jest'
    });

    expect(await service.testExists(entry.getTestId().getValue())).toBe(true);
    expect(await service.testExists('non_existent_id')).toBe(false);
  });

  test('should deregister a test', async () => {
    const entry = await service.registerUnitTest({
      testName: 'Deregister Test',
      description: 'Test for deregistration',
      component: 'Component',
      framework: 'Jest'
    });

    expect(await service.getTestCount()).toBe(1);

    await service.deregisterTest(entry.getTestId().getValue());

    expect(await service.getTestCount()).toBe(0);
  });

  test('should export catalog as JSON', async () => {
    await service.registerUnitTest({
      testName: 'Export Test',
      description: 'Test for export',
      component: 'Component',
      framework: 'Jest'
    });

    const exported = await service.exportCatalog();

    expect(Array.isArray(exported)).toBe(true);
    expect(exported.length).toBe(1);
    expect(exported[0].testName).toBe('Export Test');
  });
});
