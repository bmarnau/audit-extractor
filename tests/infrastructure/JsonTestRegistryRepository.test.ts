import { JsonTestRegistryRepository } from '../../src/infrastructure/persistence/JsonTestRegistryRepository';
import { TestRegistryFactory } from '../../src/domain/testRegistry/TestRegistryFactory';
import { TestId } from '../../src/domain/testRegistry/TestId';
import { TestCategory, SeverityImpact } from '../../src/domain/testRegistry/TestMetadata';

describe('TestRegistry Infrastructure - JsonTestRegistryRepository', () => {
  let repository: JsonTestRegistryRepository;

  beforeEach(() => {
    repository = new JsonTestRegistryRepository('./test-data/json-registry-tmp');
  });

  afterEach(async () => {
    await repository.deleteAll();
  });

  test('should initialize data directory', () => {
    expect(repository).toBeDefined();
  });

  test('should register a new test', async () => {
    const entry = TestRegistryFactory.createUnitTest({
      testName: 'Register Test',
      description: 'Test for registration',
      component: 'Component',
      framework: 'Jest'
    });

    await repository.register(entry);

    const found = await repository.findById(entry.getTestId());
    expect(found).not.toBeNull();
    expect(found?.getTestName()).toBe('Register Test');
  });

  test('should reject duplicate registration', async () => {
    const entry = TestRegistryFactory.createUnitTest({
      testName: 'Duplicate Test',
      description: 'Test for duplicate prevention',
      component: 'Component',
      framework: 'Jest'
    });

    await repository.register(entry);

    await expect(repository.register(entry)).rejects.toThrow('already registered');
  });

  test('should update a test', async () => {
    const entry = TestRegistryFactory.createUnitTest({
      testName: 'Update Test',
      description: 'Original description',
      component: 'Component',
      framework: 'Jest'
    });

    await repository.register(entry);

    entry.updateDescription('Updated description');
    await repository.update(entry);

    const found = await repository.findById(entry.getTestId());
    expect(found?.getDescription()).toBe('Updated description');
  });

  test('should reject update for non-existent test', async () => {
    const entry = TestRegistryFactory.createUnitTest({
      testName: 'Non-existent Test',
      description: 'This test does not exist',
      component: 'Component',
      framework: 'Jest'
    });

    await expect(repository.update(entry)).rejects.toThrow('not found');
  });

  test('should find test by ID', async () => {
    const entry = TestRegistryFactory.createUnitTest({
      testName: 'Find By ID Test',
      description: 'Test for find by ID',
      component: 'Component',
      framework: 'Jest'
    });

    await repository.register(entry);

    const found = await repository.findById(entry.getTestId());
    expect(found).not.toBeNull();
    expect(found?.getTestName()).toBe('Find By ID Test');
  });

  test('should return null for non-existent ID', async () => {
    const found = await repository.findById(TestId.from('non_existent'));
    expect(found).toBeNull();
  });

  test('should find all tests', async () => {
    const entry1 = TestRegistryFactory.createUnitTest({
      testName: 'Test 1',
      description: 'First test',
      component: 'Component',
      framework: 'Jest'
    });

    const entry2 = TestRegistryFactory.createIntegrationTest({
      testName: 'Test 2',
      description: 'Second test',
      component: 'Component',
      framework: 'Jest'
    });

    await repository.register(entry1);
    await repository.register(entry2);

    const all = await repository.findAll();
    expect(all.length).toBe(2);
  });

  test('should find tests by category', async () => {
    const unitTest = TestRegistryFactory.createUnitTest({
      testName: 'Unit Test',
      description: 'A unit test',
      component: 'Component',
      framework: 'Jest'
    });

    const integrationTest = TestRegistryFactory.createIntegrationTest({
      testName: 'Integration Test',
      description: 'An integration test',
      component: 'Component',
      framework: 'Jest'
    });

    await repository.register(unitTest);
    await repository.register(integrationTest);

    const unitTests = await repository.findByCategory(TestCategory.UNIT);
    const integrationTests = await repository.findByCategory(TestCategory.INTEGRATION);

    expect(unitTests.length).toBe(1);
    expect(integrationTests.length).toBe(1);
  });

  test('should find tests by component', async () => {
    const entry1 = TestRegistryFactory.createUnitTest({
      testName: 'UserService Test',
      description: 'UserService test',
      component: 'UserService',
      framework: 'Jest'
    });

    const entry2 = TestRegistryFactory.createUnitTest({
      testName: 'OrderService Test',
      description: 'OrderService test',
      component: 'OrderService',
      framework: 'Jest'
    });

    await repository.register(entry1);
    await repository.register(entry2);

    const userTests = await repository.findByComponent('UserService');
    expect(userTests.length).toBe(1);
    expect(userTests[0].getComponent()).toBe('UserService');
  });

  test('should find tests by severity impact', async () => {
    const criticalEntry = TestRegistryFactory.createSecurityTest({
      testName: 'Security Test',
      description: 'A security test',
      component: 'Security',
      framework: 'Jest'
    });

    const mediumEntry = TestRegistryFactory.createUnitTest({
      testName: 'Unit Test',
      description: 'A unit test',
      component: 'Component',
      framework: 'Jest'
    });

    await repository.register(criticalEntry);
    await repository.register(mediumEntry);

    const critical = await repository.findBySeverityImpact(SeverityImpact.CRITICAL);
    const medium = await repository.findBySeverityImpact(SeverityImpact.MEDIUM);

    expect(critical.length).toBe(1);
    expect(medium.length).toBe(1);
  });

  test('should find build blocking tests', async () => {
    const blockingEntry = TestRegistryFactory.createIntegrationTest({
      testName: 'Blocking Test',
      description: 'A blocking test',
      component: 'Component',
      buildBlocking: true,
      framework: 'Jest'
    });

    const nonBlockingEntry = TestRegistryFactory.createUnitTest({
      testName: 'Non-blocking Test',
      description: 'A non-blocking test',
      component: 'Component',
      buildBlocking: false,
      framework: 'Jest'
    });

    await repository.register(blockingEntry);
    await repository.register(nonBlockingEntry);

    const blocking = await repository.findBuildBlockingTests();
    expect(blocking.length).toBe(1);
    expect(blocking[0].isBuildBlocking()).toBe(true);
  });

  test('should find enabled tests', async () => {
    const entry1 = TestRegistryFactory.createUnitTest({
      testName: 'Enabled Test',
      description: 'An enabled test',
      component: 'Component',
      framework: 'Jest'
    });

    const entry2 = TestRegistryFactory.createUnitTest({
      testName: 'Disabled Test',
      description: 'A disabled test',
      component: 'Component',
      framework: 'Jest'
    });

    await repository.register(entry1);
    await repository.register(entry2);

    entry2.setEnabled(false);
    await repository.update(entry2);

    const enabled = await repository.findEnabledTests();
    expect(enabled.length).toBe(1);
    expect(enabled[0].isEnabled()).toBe(true);
  });

  test('should find disabled tests', async () => {
    const entry = TestRegistryFactory.createUnitTest({
      testName: 'Test',
      description: 'A test',
      component: 'Component',
      framework: 'Jest'
    });

    await repository.register(entry);
    entry.setEnabled(false);
    await repository.update(entry);

    const disabled = await repository.findDisabledTests();
    expect(disabled.length).toBe(1);
    expect(disabled[0].isEnabled()).toBe(false);
  });

  test('should find tests by framework', async () => {
    const jestEntry = TestRegistryFactory.createUnitTest({
      testName: 'Jest Test',
      description: 'A Jest test',
      component: 'Component',
      framework: 'Jest'
    });

    const playwrightEntry = TestRegistryFactory.createE2ETest({
      testName: 'Playwright Test',
      description: 'A Playwright test',
      component: 'Component',
      framework: 'Playwright'
    });

    await repository.register(jestEntry);
    await repository.register(playwrightEntry);

    const jestTests = await repository.findByFramework('Jest');
    const playwrightTests = await repository.findByFramework('Playwright');

    expect(jestTests.length).toBe(1);
    expect(playwrightTests.length).toBe(1);
  });

  test('should find tests by tags', async () => {
    const entry1 = TestRegistryFactory.createUnitTest({
      testName: 'Test 1',
      description: 'First test',
      component: 'Component',
      framework: 'Jest',
      tags: ['smoke', 'critical']
    });

    const entry2 = TestRegistryFactory.createUnitTest({
      testName: 'Test 2',
      description: 'Second test',
      component: 'Component',
      framework: 'Jest',
      tags: ['regression']
    });

    await repository.register(entry1);
    await repository.register(entry2);

    const smokeTests = await repository.findByTags(['smoke']);
    const regressionTests = await repository.findByTags(['regression']);

    expect(smokeTests.length).toBe(1);
    expect(regressionTests.length).toBe(1);
  });

  test('should search tests by name', async () => {
    const entry1 = TestRegistryFactory.createUnitTest({
      testName: 'UserService.create',
      description: 'Create user test',
      component: 'UserService',
      framework: 'Jest'
    });

    const entry2 = TestRegistryFactory.createUnitTest({
      testName: 'UserService.delete',
      description: 'Delete user test',
      component: 'UserService',
      framework: 'Jest'
    });

    await repository.register(entry1);
    await repository.register(entry2);

    const results = await repository.findByNameContains('create');
    expect(results.length).toBe(1);
    expect(results[0].getTestName()).toContain('create');
  });

  test('should find flaky tests', async () => {
    const entry = TestRegistryFactory.createUnitTest({
      testName: 'Flaky Test',
      description: 'A flaky test',
      component: 'Component',
      framework: 'Jest'
    });

    await repository.register(entry);

    // Simulate flaky test (record failures to exceed 30% threshold)
    for (let i = 0; i < 4; i++) {
      entry.recordSuccess(100);
    }
    for (let i = 0; i < 2; i++) {
      entry.recordFailure(100);
    }

    await repository.update(entry);

    const flakyTests = await repository.findFlakyTests();
    expect(flakyTests.length).toBe(1);
    expect(flakyTests[0].isFlaky()).toBe(true);
  });

  test('should get catalog statistics', async () => {
    const unitTest = TestRegistryFactory.createUnitTest({
      testName: 'Unit Test',
      description: 'A unit test',
      component: 'UserService',
      framework: 'Jest'
    });

    const integrationTest = TestRegistryFactory.createIntegrationTest({
      testName: 'Integration Test',
      description: 'An integration test',
      component: 'OrderService',
      framework: 'Jest'
    });

    await repository.register(unitTest);
    await repository.register(integrationTest);

    const stats = await repository.getStatistics();

    expect(stats.total).toBe(2);
    expect(stats.byCategory[TestCategory.UNIT]).toBe(1);
    expect(stats.byCategory[TestCategory.INTEGRATION]).toBe(1);
    expect(stats.enabledCount).toBe(2);
    expect(stats.disabledCount).toBe(0);
  });

  test('should get component overview', async () => {
    const entry1 = TestRegistryFactory.createUnitTest({
      testName: 'Unit Test',
      description: 'A unit test',
      component: 'UserService',
      framework: 'Jest'
    });

    const entry2 = TestRegistryFactory.createIntegrationTest({
      testName: 'Integration Test',
      description: 'An integration test',
      component: 'UserService',
      framework: 'Jest'
    });

    await repository.register(entry1);
    await repository.register(entry2);

    const overview = await repository.getComponentOverview('UserService');

    expect(overview.component).toBe('UserService');
    expect(overview.totalTests).toBe(2);
    expect(overview.categories[TestCategory.UNIT]).toBe(1);
    expect(overview.categories[TestCategory.INTEGRATION]).toBe(1);
  });

  test('should deregister a test', async () => {
    const entry = TestRegistryFactory.createUnitTest({
      testName: 'Deregister Test',
      description: 'Test for deregistration',
      component: 'Component',
      framework: 'Jest'
    });

    await repository.register(entry);
    expect(await repository.count()).toBe(1);

    await repository.deregister(entry.getTestId());
    expect(await repository.count()).toBe(0);
  });

  test('should count tests', async () => {
    expect(await repository.count()).toBe(0);

    const entry1 = TestRegistryFactory.createUnitTest({
      testName: 'Test 1',
      description: 'First test',
      component: 'Component',
      framework: 'Jest'
    });

    const entry2 = TestRegistryFactory.createUnitTest({
      testName: 'Test 2',
      description: 'Second test',
      component: 'Component',
      framework: 'Jest'
    });

    await repository.register(entry1);
    await repository.register(entry2);

    expect(await repository.count()).toBe(2);
  });

  test('should check test existence', async () => {
    const entry = TestRegistryFactory.createUnitTest({
      testName: 'Existence Test',
      description: 'Test for existence check',
      component: 'Component',
      framework: 'Jest'
    });

    await repository.register(entry);

    expect(await repository.exists(entry.getTestId())).toBe(true);
    expect(await repository.exists(TestId.from('non_existent'))).toBe(false);
  });

  test('should register multiple tests at once', async () => {
    const entries = [
      TestRegistryFactory.createUnitTest({
        testName: 'Test 1',
        description: 'First test',
        component: 'Component',
        framework: 'Jest'
      }),
      TestRegistryFactory.createUnitTest({
        testName: 'Test 2',
        description: 'Second test',
        component: 'Component',
        framework: 'Jest'
      })
    ];

    await repository.registerMany(entries);

    expect(await repository.count()).toBe(2);
    const all = await repository.findAll();
    expect(all.length).toBe(2);
  });

  test('should delete all tests', async () => {
    const entry = TestRegistryFactory.createUnitTest({
      testName: 'Delete Test',
      description: 'Test for deletion',
      component: 'Component',
      framework: 'Jest'
    });

    await repository.register(entry);
    expect(await repository.count()).toBe(1);

    await repository.deleteAll();
    expect(await repository.count()).toBe(0);
  });

  test('should export registry as JSON', async () => {
    const entry = TestRegistryFactory.createUnitTest({
      testName: 'Export Test',
      description: 'Test for export',
      component: 'Component',
      framework: 'Jest'
    });

    await repository.register(entry);

    const exported = await repository.exportAsJson();

    expect(Array.isArray(exported)).toBe(true);
    expect(exported.length).toBe(1);
    expect(exported[0].testName).toBe('Export Test');
  });

  test('should persist and reload from disk', async () => {
    const entry = TestRegistryFactory.createUnitTest({
      testName: 'Persistence Test',
      description: 'Test for disk persistence',
      component: 'Component',
      framework: 'Jest'
    });

    await repository.register(entry);

    // Create new repository instance pointing to same path
    const newRepository = new JsonTestRegistryRepository('./test-data/json-registry-tmp');

    const found = await newRepository.findById(entry.getTestId());
    expect(found).not.toBeNull();
    expect(found?.getTestName()).toBe('Persistence Test');
  });
});
