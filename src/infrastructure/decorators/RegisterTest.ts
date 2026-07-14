import { TestRegistryService } from '../../application/TestRegistryService';
import { TestCategory, SeverityImpact } from '../../domain/testRegistry/TestMetadata';

/**
 * Global Test Registry Service (Singleton)
 * Wird von @RegisterTest Decorator verwendet
 */
let globalTestRegistryService: TestRegistryService | null = null;

export function setGlobalTestRegistryService(service: TestRegistryService): void {
  globalTestRegistryService = service;
}

export function getGlobalTestRegistryService(): TestRegistryService {
  if (!globalTestRegistryService) {
    throw new Error('Global TestRegistryService not initialized. Call setGlobalTestRegistryService first.');
  }
  return globalTestRegistryService;
}

/**
 * Metadata für @RegisterTest Decorator
 */
export interface RegisterTestMetadata {
  component: string;
  category?: TestCategory;
  description?: string;
  buildBlocking?: boolean;
  severityImpact?: SeverityImpact;
  framework?: string;
  tags?: string[];
  estimatedDuration?: number;
  dependencies?: string[];
}

/**
 * Auto-Registration Decorator für Tests
 *
 * Automatisches Registrieren von Tests im TestRegistry beim Test-Import
 *
 * @example
 * ```typescript
 * @RegisterTest({
 *   component: 'UserService',
 *   category: TestCategory.UNIT,
 *   description: 'Tests für User Service',
 *   buildBlocking: true,
 *   framework: 'Jest'
 * })
 * describe('UserService', () => {
 *   it('should create user', () => {
 *     // test code
 *   });
 * });
 * ```
 */
export function RegisterTest(metadata: RegisterTestMetadata) {
  return function(target: any) {
    // Extrahiere Test-Namen aus describe Block
    // Dieser wird vom Jest Provider gesetzt
    const testName = metadata.component;

    // Registriere Test sofort beim Laden des Test-Files
    const registryService = getGlobalTestRegistryService();

    const testData = {
      testName,
      category: metadata.category || TestCategory.UNIT,
      description: metadata.description || `Tests für ${metadata.component}`,
      component: metadata.component,
      severityImpact: metadata.severityImpact || SeverityImpact.MEDIUM,
      buildBlocking: metadata.buildBlocking ?? false,
      enabled: true,
      framework: metadata.framework || 'Jest',
      tags: metadata.tags,
      estimatedDuration: metadata.estimatedDuration,
      dependencies: metadata.dependencies
    };

    registryService.registerTest(testData)
      .catch(error => {
        console.warn(`Failed to auto-register test ${testName}:`, error);
      });

    return target;
  };
}

/**
 * Decorator für Unit-Tests
 */
export function RegisterUnitTest(metadata: Omit<RegisterTestMetadata, 'category'>) {
  return RegisterTest({
    ...metadata,
    category: TestCategory.UNIT,
    severityImpact: metadata.severityImpact || SeverityImpact.LOW,
    buildBlocking: metadata.buildBlocking ?? false
  });
}

/**
 * Decorator für Integration-Tests
 */
export function RegisterIntegrationTest(metadata: Omit<RegisterTestMetadata, 'category'>) {
  return RegisterTest({
    ...metadata,
    category: TestCategory.INTEGRATION,
    severityImpact: metadata.severityImpact || SeverityImpact.HIGH,
    buildBlocking: metadata.buildBlocking ?? true
  });
}

/**
 * Decorator für E2E-Tests
 */
export function RegisterE2ETest(metadata: Omit<RegisterTestMetadata, 'category'>) {
  return RegisterTest({
    ...metadata,
    category: TestCategory.E2E,
    severityImpact: metadata.severityImpact || SeverityImpact.CRITICAL,
    buildBlocking: metadata.buildBlocking ?? true
  });
}

/**
 * Decorator für API-Tests
 */
export function RegisterApiTest(metadata: Omit<RegisterTestMetadata, 'category'>) {
  return RegisterTest({
    ...metadata,
    category: TestCategory.API,
    severityImpact: metadata.severityImpact || SeverityImpact.HIGH,
    buildBlocking: metadata.buildBlocking ?? true
  });
}

/**
 * Decorator für Performance-Tests
 */
export function RegisterPerformanceTest(metadata: Omit<RegisterTestMetadata, 'category'>) {
  return RegisterTest({
    ...metadata,
    category: TestCategory.PERFORMANCE,
    severityImpact: metadata.severityImpact || SeverityImpact.MEDIUM,
    buildBlocking: metadata.buildBlocking ?? false
  });
}

/**
 * Decorator für Security-Tests
 */
export function RegisterSecurityTest(metadata: Omit<RegisterTestMetadata, 'category'>) {
  return RegisterTest({
    ...metadata,
    category: TestCategory.SECURITY,
    severityImpact: metadata.severityImpact || SeverityImpact.CRITICAL,
    buildBlocking: metadata.buildBlocking ?? true
  });
}
