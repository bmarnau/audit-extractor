import { TestRegistryFactory } from '../../src/domain/testRegistry/TestRegistryFactory';
import { TestCategory, SeverityImpact } from '../../src/domain/testRegistry/TestMetadata';

describe('TestRegistry Domain - TestRegistryFactory', () => {
  test('should create a unit test entry', () => {
    const entry = TestRegistryFactory.createUnitTest({
      testName: 'Unit Test',
      description: 'A unit test',
      component: 'Component',
      framework: 'Jest'
    });

    expect(entry.getCategory()).toBe(TestCategory.UNIT);
    expect(entry.getSeverityImpact()).toBe(SeverityImpact.MEDIUM);
    expect(entry.isBuildBlocking()).toBe(false);
    expect(entry.isEnabled()).toBe(true);
  });

  test('should create an integration test entry', () => {
    const entry = TestRegistryFactory.createIntegrationTest({
      testName: 'Integration Test',
      description: 'An integration test',
      component: 'Component',
      framework: 'Jest'
    });

    expect(entry.getCategory()).toBe(TestCategory.INTEGRATION);
    expect(entry.getSeverityImpact()).toBe(SeverityImpact.HIGH);
    expect(entry.isBuildBlocking()).toBe(true);
  });

  test('should create an E2E test entry', () => {
    const entry = TestRegistryFactory.createE2ETest({
      testName: 'E2E Test',
      description: 'An end-to-end test',
      component: 'Component',
      framework: 'Playwright'
    });

    expect(entry.getCategory()).toBe(TestCategory.E2E);
    expect(entry.getSeverityImpact()).toBe(SeverityImpact.CRITICAL);
    expect(entry.isBuildBlocking()).toBe(true);
  });

  test('should create an API test entry', () => {
    const entry = TestRegistryFactory.createApiTest({
      testName: 'API Test',
      description: 'An API test',
      endpoint: 'api.example.com/users',
      framework: 'Jest'
    });

    expect(entry.getCategory()).toBe(TestCategory.API);
    expect(entry.getComponent()).toContain('API_');
    expect(entry.isBuildBlocking()).toBe(true);
  });

  test('should create a performance test entry', () => {
    const entry = TestRegistryFactory.createPerformanceTest({
      testName: 'Performance Test',
      description: 'A performance test',
      component: 'Component',
      thresholdMs: 1000,
      framework: 'Artillery'
    });

    expect(entry.getCategory()).toBe(TestCategory.PERFORMANCE);
    expect(entry.isBuildBlocking()).toBe(false);
  });

  test('should create a security test entry', () => {
    const entry = TestRegistryFactory.createSecurityTest({
      testName: 'Security Test',
      description: 'A security test',
      component: 'Component',
      framework: 'OWASP ZAP'
    });

    expect(entry.getCategory()).toBe(TestCategory.SECURITY);
    expect(entry.getSeverityImpact()).toBe(SeverityImpact.CRITICAL);
    expect(entry.isBuildBlocking()).toBe(true);
  });

  test('should create a smoke test entry', () => {
    const entry = TestRegistryFactory.createSmokeTest({
      testName: 'Smoke Test',
      description: 'A smoke test',
      component: 'Component',
      framework: 'Jest'
    });

    expect(entry.getCategory()).toBe(TestCategory.SMOKE);
    expect(entry.getSeverityImpact()).toBe(SeverityImpact.CRITICAL);
  });

  test('should create a regression test entry', () => {
    const entry = TestRegistryFactory.createRegressionTest({
      testName: 'Regression Test',
      description: 'A regression test',
      component: 'Component',
      framework: 'Jest'
    });

    expect(entry.getCategory()).toBe(TestCategory.REGRESSION);
    expect(entry.getSeverityImpact()).toBe(SeverityImpact.HIGH);
  });

  test('should create a contract test entry', () => {
    const entry = TestRegistryFactory.createContractTest({
      testName: 'Contract Test',
      description: 'A contract test',
      provider: 'UserService',
      consumer: 'OrderService',
      framework: 'Pact'
    });

    expect(entry.getCategory()).toBe(TestCategory.CONTRACT);
    expect(entry.getComponent()).toContain('→');
  });

  test('should validate test registry props', () => {
    const validProps = {
      testName: 'Valid Test',
      category: TestCategory.UNIT,
      description: 'Valid description',
      component: 'Component',
      severityImpact: SeverityImpact.MEDIUM,
      buildBlocking: false,
      enabled: true,
      framework: 'Jest'
    };

    const validation = TestRegistryFactory.validate(validProps);
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  test('should reject invalid props - empty test name', () => {
    const invalidProps = {
      testName: '',
      category: TestCategory.UNIT,
      description: 'Description',
      component: 'Component',
      severityImpact: SeverityImpact.MEDIUM,
      buildBlocking: false,
      enabled: true,
      framework: 'Jest'
    };

    const validation = TestRegistryFactory.validate(invalidProps);
    expect(validation.valid).toBe(false);
    expect(validation.errors[0]).toContain('required');
  });

  test('should create batch of tests', () => {
    const batchData = [
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

    const entries = TestRegistryFactory.createBatch(batchData);
    expect(entries.length).toBe(2);
    expect(entries[0].getTestName()).toBe('Test 1');
    expect(entries[1].getTestName()).toBe('Test 2');
  });

  test('should create test entry with custom overrides', () => {
    const entry = TestRegistryFactory.createTestEntry({
      testName: 'Custom Test',
      component: 'CustomComponent',
      framework: 'Vitest'
    });

    expect(entry.getTestName()).toBe('Custom Test');
    expect(entry.getComponent()).toBe('CustomComponent');
    expect(entry.getFramework()).toBe('Vitest');
  });
});
