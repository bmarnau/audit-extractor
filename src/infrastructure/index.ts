/**
 * Infrastructure Layer
 *
 * Technische Implementierungen: Parser, Repositories, Hasher, etc.
 * Keine Business-Logik - reine I/O und externe Integrationen.
 */

export * from './parsers';
export * from './repositories';

// Phase 27: Issue Management Persistence
export { JsonIssueRepository } from './persistence/JsonIssueRepository';

// Phase 28: Test Registry Management
export { JsonTestRegistryRepository } from './persistence/JsonTestRegistryRepository';
export {
  RegisterTest,
  RegisterUnitTest,
  RegisterIntegrationTest,
  RegisterE2ETest,
  RegisterApiTest,
  RegisterPerformanceTest,
  RegisterSecurityTest,
  setGlobalTestRegistryService,
  getGlobalTestRegistryService,
  type RegisterTestMetadata
} from './decorators/RegisterTest';
