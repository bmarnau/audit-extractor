/**
 * Test Registry Module Exports
 * Central public API for test registry system
 */

// Types and Interfaces
export * from './test-registry.types';

// Services
export { TestRegistryService } from './services/test-registry.service';
export { TestRegistryManager } from './services/test-registry-manager.service';

// Decorators
export {
  RegisterTest,
  AutoTest,
  RegisterTestSuite,
  initializeTestRegistry,
  getTestRegistry,
  recordTestResult,
  getTestMetadata,
  enableTest,
  disableTest,
  markTestAsFlaky,
  quarantineTest,
  createTestGroup,
  getAllRegisteredTests,
  exportTestRegistryReport
} from './decorators/register-test.decorator';

// Create singleton instances
import { TestRegistryService } from './services/test-registry.service';
import { TestRegistryManager } from './services/test-registry-manager.service';
import * as path from 'path';

const testRegistryPath = path.join(process.cwd(), 'test-results', 'test-registry.json');

export const testRegistry = new TestRegistryService(testRegistryPath);
export const testRegistryManager = new TestRegistryManager(testRegistry);

// Initialize decorator registry
import { initializeTestRegistry } from './decorators/register-test.decorator';
initializeTestRegistry(testRegistryManager);
