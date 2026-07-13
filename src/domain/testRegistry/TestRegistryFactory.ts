import { TestRegistryEntry, TestRegistryProps } from './TestRegistryEntry';
import { TestCategory, SeverityImpact } from './TestMetadata';

/**
 * Test Registry Factory für DDD-konforme Erstellung
 *
 * Verantwortlich für:
 * - Konsistente Test-Entry Erstellung
 * - Business-Rule Validierung
 * - Standardwerte und Defaults
 * - Rekonstruktion aus verschiedenen Quellen
 */
export class TestRegistryFactory {
  /**
   * Erstellt einen neuen Test-Eintrag
   */
  static createEntry(props: TestRegistryProps): TestRegistryEntry {
    return TestRegistryEntry.create(props);
  }

  /**
   * Erstellt einen Unit-Test Eintrag
   */
  static createUnitTest(props: {
    testName: string;
    description: string;
    component: string;
    severityImpact?: SeverityImpact;
    buildBlocking?: boolean;
    framework: string;
    tags?: string[];
    estimatedDuration?: number;
  }): TestRegistryEntry {
    return TestRegistryEntry.create({
      testName: props.testName,
      category: TestCategory.UNIT,
      description: props.description,
      component: props.component,
      severityImpact: props.severityImpact || SeverityImpact.MEDIUM,
      buildBlocking: props.buildBlocking ?? false,
      enabled: true,
      framework: props.framework,
      tags: props.tags,
      estimatedDuration: props.estimatedDuration || 100 // 100ms default
    });
  }

  /**
   * Erstellt einen Integration-Test Eintrag
   */
  static createIntegrationTest(props: {
    testName: string;
    description: string;
    component: string;
    severityImpact?: SeverityImpact;
    buildBlocking?: boolean;
    framework: string;
    dependencies?: string[];
    tags?: string[];
    estimatedDuration?: number;
  }): TestRegistryEntry {
    return TestRegistryEntry.create({
      testName: props.testName,
      category: TestCategory.INTEGRATION,
      description: props.description,
      component: props.component,
      severityImpact: props.severityImpact || SeverityImpact.HIGH,
      buildBlocking: props.buildBlocking ?? true,
      enabled: true,
      framework: props.framework,
      tags: props.tags,
      estimatedDuration: props.estimatedDuration || 500, // 500ms default
      dependencies: props.dependencies
    });
  }

  /**
   * Erstellt einen E2E-Test Eintrag
   */
  static createE2ETest(props: {
    testName: string;
    description: string;
    component: string;
    severityImpact?: SeverityImpact;
    buildBlocking?: boolean;
    framework: string;
    tags?: string[];
    estimatedDuration?: number;
  }): TestRegistryEntry {
    return TestRegistryEntry.create({
      testName: props.testName,
      category: TestCategory.E2E,
      description: props.description,
      component: props.component,
      severityImpact: props.severityImpact || SeverityImpact.CRITICAL,
      buildBlocking: props.buildBlocking ?? true,
      enabled: true,
      framework: props.framework,
      tags: props.tags,
      estimatedDuration: props.estimatedDuration || 2000 // 2s default
    });
  }

  /**
   * Erstellt einen API-Test Eintrag
   */
  static createApiTest(props: {
    testName: string;
    description: string;
    endpoint: string;
    severityImpact?: SeverityImpact;
    buildBlocking?: boolean;
    framework: string;
    tags?: string[];
    estimatedDuration?: number;
  }): TestRegistryEntry {
    return TestRegistryEntry.create({
      testName: props.testName,
      category: TestCategory.API,
      description: props.description,
      component: `API_${props.endpoint.split('/')[0]}`,
      severityImpact: props.severityImpact || SeverityImpact.HIGH,
      buildBlocking: props.buildBlocking ?? true,
      enabled: true,
      framework: props.framework,
      tags: ['api', ...(props.tags || [])],
      estimatedDuration: props.estimatedDuration || 300 // 300ms default
    });
  }

  /**
   * Erstellt einen Performance-Test Eintrag
   */
  static createPerformanceTest(props: {
    testName: string;
    description: string;
    component: string;
    thresholdMs: number;
    framework: string;
    tags?: string[];
  }): TestRegistryEntry {
    return TestRegistryEntry.create({
      testName: props.testName,
      category: TestCategory.PERFORMANCE,
      description: props.description,
      component: props.component,
      severityImpact: SeverityImpact.MEDIUM,
      buildBlocking: false,
      enabled: true,
      framework: props.framework,
      tags: ['performance', ...(props.tags || [])],
      estimatedDuration: props.thresholdMs + 100
    });
  }

  /**
   * Erstellt einen Security-Test Eintrag
   */
  static createSecurityTest(props: {
    testName: string;
    description: string;
    component: string;
    framework: string;
    tags?: string[];
  }): TestRegistryEntry {
    return TestRegistryEntry.create({
      testName: props.testName,
      category: TestCategory.SECURITY,
      description: props.description,
      component: props.component,
      severityImpact: SeverityImpact.CRITICAL,
      buildBlocking: true,
      enabled: true,
      framework: props.framework,
      tags: ['security', ...(props.tags || [])],
      estimatedDuration: 1000
    });
  }

  /**
   * Erstellt einen Smoke-Test Eintrag
   */
  static createSmokeTest(props: {
    testName: string;
    description: string;
    component: string;
    framework: string;
    tags?: string[];
    estimatedDuration?: number;
  }): TestRegistryEntry {
    return TestRegistryEntry.create({
      testName: props.testName,
      category: TestCategory.SMOKE,
      description: props.description,
      component: props.component,
      severityImpact: SeverityImpact.CRITICAL,
      buildBlocking: true,
      enabled: true,
      framework: props.framework,
      tags: ['smoke', ...(props.tags || [])],
      estimatedDuration: props.estimatedDuration || 50 // 50ms default - schnelle Checks
    });
  }

  /**
   * Erstellt einen Regression-Test Eintrag
   */
  static createRegressionTest(props: {
    testName: string;
    description: string;
    component: string;
    framework: string;
    tags?: string[];
    estimatedDuration?: number;
  }): TestRegistryEntry {
    return TestRegistryEntry.create({
      testName: props.testName,
      category: TestCategory.REGRESSION,
      description: props.description,
      component: props.component,
      severityImpact: SeverityImpact.HIGH,
      buildBlocking: true,
      enabled: true,
      framework: props.framework,
      tags: ['regression', ...(props.tags || [])],
      estimatedDuration: props.estimatedDuration || 200
    });
  }

  /**
   * Erstellt einen Contract-Test Eintrag
   */
  static createContractTest(props: {
    testName: string;
    description: string;
    provider: string;
    consumer: string;
    framework: string;
    tags?: string[];
  }): TestRegistryEntry {
    return TestRegistryEntry.create({
      testName: props.testName,
      category: TestCategory.CONTRACT,
      description: props.description,
      component: `${props.provider}→${props.consumer}`,
      severityImpact: SeverityImpact.HIGH,
      buildBlocking: true,
      enabled: true,
      framework: props.framework,
      tags: ['contract', 'pact', ...(props.tags || [])],
      estimatedDuration: 150
    });
  }

  /**
   * Erstellt ein Test-Platzhalter für Testing
   */
  static createTestEntry(overrides?: Partial<TestRegistryProps>): TestRegistryEntry {
    const defaults: TestRegistryProps = {
      testName: 'Sample Test',
      category: TestCategory.UNIT,
      description: 'Sample test description',
      component: 'SampleComponent',
      severityImpact: SeverityImpact.MEDIUM,
      buildBlocking: false,
      enabled: true,
      framework: 'Jest'
    };

    return TestRegistryEntry.create({
      ...defaults,
      ...overrides
    });
  }

  /**
   * Rekonstruiert Entry aus persistierten Daten
   */
  static reconstituteFromPersistence(data: any): TestRegistryEntry {
    return TestRegistryEntry.fromPersistence(data);
  }

  /**
   * Validiert Test Registry Props
   */
  static validate(props: TestRegistryProps): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!props.testName || props.testName.trim().length === 0) {
      errors.push('Test name is required');
    }
    if (props.testName && props.testName.length > 255) {
      errors.push('Test name must not exceed 255 characters');
    }
    if (!props.description || props.description.trim().length === 0) {
      errors.push('Test description is required');
    }
    if (!props.component || props.component.trim().length === 0) {
      errors.push('Test component is required');
    }
    if (!props.framework || props.framework.trim().length === 0) {
      errors.push('Test framework is required');
    }
    if (!Object.values(TestCategory).includes(props.category)) {
      errors.push(`Invalid test category: ${props.category}`);
    }
    if (!Object.values(SeverityImpact).includes(props.severityImpact)) {
      errors.push(`Invalid severity impact: ${props.severityImpact}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Erstellt mehrere Tests aus Batch-Daten
   */
  static createBatch(batchData: TestRegistryProps[]): TestRegistryEntry[] {
    return batchData
      .filter(data => {
        const validation = this.validate(data);
        return validation.valid;
      })
      .map(data => this.createEntry(data));
  }
}
