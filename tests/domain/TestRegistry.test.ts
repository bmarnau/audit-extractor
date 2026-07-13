import { TestId } from '../../src/domain/testRegistry/TestId';
import { TestRegistryEntry, TestExecutionStats } from '../../src/domain/testRegistry/TestRegistryEntry';
import { TestCategory, SeverityImpact } from '../../src/domain/testRegistry/TestMetadata';

describe('TestRegistry Domain - TestId', () => {
  test('should generate a unique TestId', () => {
    const id1 = TestId.generate();
    const id2 = TestId.generate();

    expect(id1.getValue()).not.toBe(id2.getValue());
    expect(id1.getValue()).toMatch(/^test_/);
  });

  test('should create TestId from string', () => {
    const id = TestId.from('test_123');
    expect(id.getValue()).toBe('test_123');
  });

  test('should reject empty TestId', () => {
    expect(() => TestId.from('')).toThrow('TestId value cannot be empty');
  });

  test('should compare TestIds for equality', () => {
    const id1 = TestId.from('test_same');
    const id2 = TestId.from('test_same');
    const id3 = TestId.from('test_different');

    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(id3)).toBe(false);
  });

  test('should convert TestId to string', () => {
    const id = TestId.from('test_123');
    expect(id.toString()).toBe('test_123');
  });

  test('should serialize TestId to JSON', () => {
    const id = TestId.from('test_json');
    expect(id.toJSON()).toBe('test_json');
  });
});

describe('TestRegistry Domain - TestRegistryEntry', () => {
  test('should create a new test registry entry', () => {
    const entry = TestRegistryEntry.create({
      testName: 'Sample Test',
      category: TestCategory.UNIT,
      description: 'Sample test description',
      component: 'SampleComponent',
      severityImpact: SeverityImpact.MEDIUM,
      buildBlocking: false,
      enabled: true,
      framework: 'Jest'
    });

    expect(entry.getTestName()).toBe('Sample Test');
    expect(entry.getCategory()).toBe(TestCategory.UNIT);
    expect(entry.getComponent()).toBe('SampleComponent');
  });

  test('should validate required fields on creation', () => {
    expect(() => 
      TestRegistryEntry.create({
        testName: '',
        category: TestCategory.UNIT,
        description: 'Test',
        component: 'Component',
        severityImpact: SeverityImpact.MEDIUM,
        buildBlocking: false,
        enabled: true,
        framework: 'Jest'
      })
    ).toThrow('Test name is required');
  });

  test('should track execution stats correctly', () => {
    const entry = TestRegistryEntry.create({
      testName: 'Execution Test',
      category: TestCategory.UNIT,
      description: 'Test for execution tracking',
      component: 'ExecComponent',
      severityImpact: SeverityImpact.MEDIUM,
      buildBlocking: false,
      enabled: true,
      framework: 'Jest'
    });

    const initialStats = entry.getExecutionStats();
    expect(initialStats.totalRuns).toBe(0);

    entry.recordSuccess(150);
    let stats = entry.getExecutionStats();
    expect(stats.totalRuns).toBe(1);
    expect(stats.successCount).toBe(1);

    entry.recordFailure(200);
    stats = entry.getExecutionStats();
    expect(stats.totalRuns).toBe(2);
    expect(stats.failureCount).toBe(1);

    entry.recordSkipped();
    stats = entry.getExecutionStats();
    expect(stats.totalRuns).toBe(3);
    expect(stats.skippedCount).toBe(1);
  });

  test('should calculate success rate correctly', () => {
    const entry = TestRegistryEntry.create({
      testName: 'Success Rate Test',
      category: TestCategory.UNIT,
      description: 'Test for success rate calculation',
      component: 'SRComponent',
      severityImpact: SeverityImpact.MEDIUM,
      buildBlocking: false,
      enabled: true,
      framework: 'Jest'
    });

    entry.recordSuccess(100);
    entry.recordSuccess(100);
    entry.recordFailure(100);

    const successRate = entry.getSuccessRate();
    expect(successRate).toBeCloseTo(0.667, 2); // 2/3
  });

  test('should detect flaky tests (> 30% failure rate)', () => {
    const entry = TestRegistryEntry.create({
      testName: 'Flaky Test',
      category: TestCategory.UNIT,
      description: 'Test for flakiness detection',
      component: 'FlakyComponent',
      severityImpact: SeverityImpact.MEDIUM,
      buildBlocking: false,
      enabled: true,
      framework: 'Jest'
    });

    // Record 4 successes and 2 failures (33.33% failure = flaky)
    entry.recordSuccess(100);
    entry.recordSuccess(100);
    entry.recordSuccess(100);
    entry.recordSuccess(100);
    entry.recordFailure(100);
    entry.recordFailure(100);

    expect(entry.isFlaky()).toBe(true);
  });

  test('should enable/disable tests', () => {
    const entry = TestRegistryEntry.create({
      testName: 'Toggle Test',
      category: TestCategory.UNIT,
      description: 'Test for enable/disable',
      component: 'ToggleComponent',
      severityImpact: SeverityImpact.MEDIUM,
      buildBlocking: false,
      enabled: true,
      framework: 'Jest'
    });

    expect(entry.isEnabled()).toBe(true);

    entry.setEnabled(false);
    expect(entry.isEnabled()).toBe(false);

    entry.setEnabled(true);
    expect(entry.isEnabled()).toBe(true);
  });

  test('should update build blocking status', () => {
    const entry = TestRegistryEntry.create({
      testName: 'Build Blocking Test',
      category: TestCategory.UNIT,
      description: 'Test for build blocking',
      component: 'BlockingComponent',
      severityImpact: SeverityImpact.MEDIUM,
      buildBlocking: false,
      enabled: true,
      framework: 'Jest'
    });

    expect(entry.isBuildBlocking()).toBe(false);

    entry.setBuildBlocking(true);
    expect(entry.isBuildBlocking()).toBe(true);
  });

  test('should serialize to persistence format', () => {
    const entry = TestRegistryEntry.create({
      testName: 'Persistence Test',
      category: TestCategory.UNIT,
      description: 'Test for persistence',
      component: 'PersistenceComponent',
      severityImpact: SeverityImpact.MEDIUM,
      buildBlocking: false,
      enabled: true,
      framework: 'Jest',
      tags: ['tag1', 'tag2'],
      estimatedDuration: 100
    });

    const persistence = entry.toPersistence();
    expect(persistence.testName).toBe('Persistence Test');
    expect(persistence.category).toBe(TestCategory.UNIT);
    expect(persistence.tags).toContain('tag1');
  });

  test('should reconstruct from persistence', () => {
    const originalEntry = TestRegistryEntry.create({
      testName: 'Reconstruct Test',
      category: TestCategory.INTEGRATION,
      description: 'Test for reconstruction',
      component: 'ReconstructComponent',
      severityImpact: SeverityImpact.HIGH,
      buildBlocking: true,
      enabled: true,
      framework: 'Jest'
    });

    // Simulate execution
    originalEntry.recordSuccess(200);
    originalEntry.recordSuccess(210);

    const persistenceData = originalEntry.toPersistence();
    const reconstructedEntry = TestRegistryEntry.fromPersistence(persistenceData);

    expect(reconstructedEntry.getTestName()).toBe('Reconstruct Test');
    expect(reconstructedEntry.getCategory()).toBe(TestCategory.INTEGRATION);
    expect(reconstructedEntry.getSuccessRate()).toBeCloseTo(1.0);
  });

  test('should manage tags correctly', () => {
    const entry = TestRegistryEntry.create({
      testName: 'Tags Test',
      category: TestCategory.UNIT,
      description: 'Test for tag management',
      component: 'TagsComponent',
      severityImpact: SeverityImpact.MEDIUM,
      buildBlocking: false,
      enabled: true,
      framework: 'Jest'
    });

    entry.addTags(['tag1', 'tag2']);
    let tags = entry.getTags();
    expect(tags).toContain('tag1');
    expect(tags).toContain('tag2');

    entry.removeTags(['tag1']);
    tags = entry.getTags();
    expect(tags).not.toContain('tag1');
    expect(tags).toContain('tag2');
  });

  test('should track timestamps', () => {
    const before = new Date();
    const entry = TestRegistryEntry.create({
      testName: 'Timestamp Test',
      category: TestCategory.UNIT,
      description: 'Test for timestamp tracking',
      component: 'TimestampComponent',
      severityImpact: SeverityImpact.MEDIUM,
      buildBlocking: false,
      enabled: true,
      framework: 'Jest'
    });
    const after = new Date();

    const createdAt = entry.getCreatedAt();
    expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime());

    expect(entry.getLastExecuted()).toBeUndefined();

    entry.recordSuccess(100);
    expect(entry.getLastExecuted()).toBeDefined();
  });
});

describe('TestRegistry Domain - Severity Impact', () => {
  test('should have all severity levels', () => {
    const severities = Object.values(SeverityImpact);
    expect(severities).toContain(SeverityImpact.CRITICAL);
    expect(severities).toContain(SeverityImpact.HIGH);
    expect(severities).toContain(SeverityImpact.MEDIUM);
    expect(severities).toContain(SeverityImpact.LOW);
    expect(severities).toContain(SeverityImpact.INFO);
  });
});

describe('TestRegistry Domain - Test Categories', () => {
  test('should have all test categories', () => {
    const categories = Object.values(TestCategory);
    expect(categories.length).toBe(10);
    expect(categories).toContain(TestCategory.UNIT);
    expect(categories).toContain(TestCategory.INTEGRATION);
    expect(categories).toContain(TestCategory.E2E);
    expect(categories).toContain(TestCategory.API);
    expect(categories).toContain(TestCategory.PERFORMANCE);
  });
});
