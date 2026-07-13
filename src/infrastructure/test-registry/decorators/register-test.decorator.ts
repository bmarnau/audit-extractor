/**
 * Test Auto-Registration Decorator
 * Automatically registers tests when decorated
 */

import {
  TestMetadata,
  TestCategory,
  SeverityImpact,
  TestEnvironment
} from '../test-registry.types';
import { TestRegistryManager } from './test-registry-manager.service';

/**
 * Global test registry manager instance
 */
let globalTestRegistryManager: TestRegistryManager | null = null;

/**
 * Initialize the global registry manager
 */
export function initializeTestRegistry(manager?: TestRegistryManager): void {
  if (!globalTestRegistryManager) {
    globalTestRegistryManager = manager || new TestRegistryManager();
  }
}

/**
 * Get the global registry manager
 */
export function getTestRegistry(): TestRegistryManager {
  if (!globalTestRegistryManager) {
    globalTestRegistryManager = new TestRegistryManager();
  }
  return globalTestRegistryManager;
}

/**
 * Test decorator options
 */
export interface RegisterTestOptions {
  category?: TestCategory;
  description?: string;
  severityImpact?: SeverityImpact;
  buildBlocking?: boolean;
  enabled?: boolean;
  timeout?: number;
  retryCount?: number;
  tags?: string[];
  owner?: string;
  team?: string;
  environment?: TestEnvironment;
  targetComponent?: string;
}

/**
 * @RegisterTest Decorator
 * Automatically registers a test with the global registry
 *
 * Usage:
 * @RegisterTest({
 *   category: TestCategory.UNIT,
 *   description: 'Should validate email format',
 *   severityImpact: SeverityImpact.HIGH,
 *   buildBlocking: true,
 *   tags: ['validation', 'email'],
 *   targetComponent: 'auth-service'
 * })
 * test('should validate email', () => {
 *   // test code
 * });
 */
export function RegisterTest(options: RegisterTestOptions = {}): MethodDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol | undefined,
    descriptor: PropertyDescriptor
  ) {
    const testName = String(propertyKey || target.constructor.name);
    const filePath = (target.constructor as any).filename || 'unknown';

    // Initialize registry if needed
    initializeTestRegistry();

    const registry = getTestRegistry();

    // Prepare metadata
    const metadata: Omit<TestMetadata, 'testId' | 'createdAt' | 'updatedAt'> = {
      testName,
      category: options.category || TestCategory.UNIT,
      description: options.description || `Test: ${testName}`,
      targetComponent: options.targetComponent || extractComponentFromPath(filePath),
      severityImpact: options.severityImpact || SeverityImpact.MEDIUM,
      buildBlocking: options.buildBlocking || false,
      enabled: options.enabled !== false,
      filePath,
      testFunction: testName,
      environment: options.environment || TestEnvironment.LOCAL,
      timeout: options.timeout,
      retryCount: options.retryCount,
      tags: options.tags,
      owner: options.owner,
      team: options.team,
      totalRuns: 0,
      passedRuns: 0,
      failedRuns: 0,
      skippedRuns: 0,
      currentStatus: 'PENDING' as any
    };

    try {
      // Register the test
      const testId = registry.registerFromDecorator(metadata);

      // Attach testId to the descriptor for reference
      if (descriptor) {
        descriptor.value.__testId__ = testId;
        descriptor.value.__testMetadata__ = metadata;
      }
    } catch (error) {
      console.warn(`Failed to auto-register test ${testName}:`, error);
    }

    return descriptor;
  };
}

/**
 * Extract component name from file path
 */
function extractComponentFromPath(filePath: string): string {
  // Remove path separators and extensions
  const fileName = filePath.split(/[\\/]/).pop() || filePath;
  const baseName = fileName.replace(/\.(test|spec)\.(ts|js)$/, '');
  return baseName || 'unknown';
}

/**
 * Function decorator for test functions
 *
 * Usage in Jest/Mocha:
 * describe('Authentication', () => {
 *   @AutoTest({
 *     category: TestCategory.UNIT,
 *     severityImpact: SeverityImpact.HIGH,
 *     buildBlocking: true,
 *     targetComponent: 'auth-service'
 *   })
 *   test('should validate email', () => {
 *     // test implementation
 *   });
 * });
 */
export function AutoTest(options: RegisterTestOptions = {}): MethodDecorator {
  return RegisterTest(options);
}

/**
 * Class decorator for test suites
 *
 * Usage:
 * @RegisterTestSuite({
 *   category: TestCategory.INTEGRATION,
 *   targetComponent: 'api-gateway',
 *   team: 'backend'
 * })
 * class UserServiceTests {
 *   // test methods
 * }
 */
export function RegisterTestSuite(options: RegisterTestOptions = {}): ClassDecorator {
  return function <T extends Function>(constructor: T): T {
    const filePath = (constructor as any).filename || 'unknown';

    // Initialize registry if needed
    initializeTestRegistry();

    const registry = getTestRegistry();

    // Register all methods in the class as tests
    const prototype = constructor.prototype;

    for (const key in prototype) {
      if (typeof prototype[key] === 'function' && (key.startsWith('test') || key.startsWith('should'))) {
        const metadata: Omit<TestMetadata, 'testId' | 'createdAt' | 'updatedAt'> = {
          testName: key,
          category: options.category || TestCategory.UNIT,
          description: options.description || `Test: ${key}`,
          targetComponent: options.targetComponent || extractComponentFromPath(filePath),
          severityImpact: options.severityImpact || SeverityImpact.MEDIUM,
          buildBlocking: options.buildBlocking || false,
          enabled: options.enabled !== false,
          filePath,
          testFunction: key,
          environment: options.environment || TestEnvironment.LOCAL,
          timeout: options.timeout,
          retryCount: options.retryCount,
          tags: options.tags,
          owner: options.owner,
          team: options.team,
          totalRuns: 0,
          passedRuns: 0,
          failedRuns: 0,
          skippedRuns: 0,
          currentStatus: 'PENDING' as any
        };

        try {
          registry.registerFromDecorator(metadata);
        } catch (error) {
          console.warn(`Failed to auto-register test method ${key}:`, error);
        }
      }
    }

    return constructor;
  };
}

/**
 * Helper function to record test result from test framework
 *
 * Usage in test setup:
 * afterEach((result) => {
 *   recordTestResult(testId, {
 *     testId,
 *     status: result.status,
 *     executionTimeMs: result.duration,
 *     error: result.error?.message,
 *     timestamp: new Date().toISOString(),
 *     environment: TestEnvironment.LOCAL
 *   });
 * });
 */
export function recordTestResult(testId: string, result: any): void {
  try {
    const registry = getTestRegistry();
    registry.getRegistry().recordTestResult(testId, result);
  } catch (error) {
    console.warn(`Failed to record test result for ${testId}:`, error);
  }
}

/**
 * Get test metadata by ID
 */
export function getTestMetadata(testId: string): TestMetadata | undefined {
  try {
    const registry = getTestRegistry();
    return registry.getRegistry().getTest(testId);
  } catch (error) {
    console.warn(`Failed to get test metadata for ${testId}:`, error);
    return undefined;
  }
}

/**
 * Enable test by ID
 */
export function enableTest(testId: string): void {
  try {
    const registry = getTestRegistry();
    registry.enableTest(testId);
  } catch (error) {
    console.warn(`Failed to enable test ${testId}:`, error);
  }
}

/**
 * Disable test by ID
 */
export function disableTest(testId: string): void {
  try {
    const registry = getTestRegistry();
    registry.disableTest(testId);
  } catch (error) {
    console.warn(`Failed to disable test ${testId}:`, error);
  }
}

/**
 * Mark test as flaky
 */
export function markTestAsFlaky(testId: string, isFlaky: boolean = true): void {
  try {
    const registry = getTestRegistry();
    registry.markAsFlaky(testId, isFlaky);
  } catch (error) {
    console.warn(`Failed to mark test as flaky ${testId}:`, error);
  }
}

/**
 * Quarantine a test
 */
export function quarantineTest(testId: string, reason: string): void {
  try {
    const registry = getTestRegistry();
    registry.quarantineTest(testId, reason);
  } catch (error) {
    console.warn(`Failed to quarantine test ${testId}:`, error);
  }
}

/**
 * Create a test group
 */
export function createTestGroup(groupName: string, testIds: string[]): void {
  try {
    const registry = getTestRegistry();
    registry.createTestGroup(groupName, testIds);
  } catch (error) {
    console.warn(`Failed to create test group ${groupName}:`, error);
  }
}

/**
 * Get all registered tests
 */
export function getAllRegisteredTests(): TestMetadata[] {
  try {
    const registry = getTestRegistry();
    return registry.getRegistry().getAllTests();
  } catch (error) {
    console.warn('Failed to get all registered tests:', error);
    return [];
  }
}

/**
 * Export test registry report
 */
export function exportTestRegistryReport(format: 'json' | 'text' = 'json'): string {
  try {
    const registry = getTestRegistry();
    const reg = registry.getRegistry();

    if (format === 'json') {
      return reg.exportAsJSON();
    } else {
      return reg.exportAsText();
    }
  } catch (error) {
    console.warn('Failed to export test registry report:', error);
    return '';
  }
}
