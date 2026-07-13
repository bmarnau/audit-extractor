/**
 * Central Test Registry System
 * Defines all types, interfaces, and enums for test registration and tracking
 */

/**
 * Test Categories
 * Classifies different types of tests
 */
export enum TestCategory {
  // Unit Tests
  UNIT = 'UNIT',
  
  // Integration Tests
  INTEGRATION = 'INTEGRATION',
  
  // End-to-End Tests
  E2E = 'E2E',
  
  // Performance Tests
  PERFORMANCE = 'PERFORMANCE',
  
  // Security Tests
  SECURITY = 'SECURITY',
  
  // Smoke Tests
  SMOKE = 'SMOKE',
  
  // Regression Tests
  REGRESSION = 'REGRESSION',
  
  // Contract Tests
  CONTRACT = 'CONTRACT',
  
  // Load Tests
  LOAD = 'LOAD',
  
  // Accessibility Tests
  ACCESSIBILITY = 'ACCESSIBILITY',
  
  // Visual Tests
  VISUAL = 'VISUAL',
  
  // API Tests
  API = 'API'
}

/**
 * Test Status
 * Current execution state of a test
 */
export enum TestStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  TIMEOUT = 'TIMEOUT',
  FLAKY = 'FLAKY',
  QUARANTINED = 'QUARANTINED'
}

/**
 * Severity Impact
 * How critical a test failure is
 */
export enum SeverityImpact {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  TRIVIAL = 'TRIVIAL'
}

/**
 * Test Environment
 * Where the test runs
 */
export enum TestEnvironment {
  LOCAL = 'LOCAL',
  CI = 'CI',
  STAGING = 'STAGING',
  PRODUCTION = 'PRODUCTION',
  DOCKER = 'DOCKER'
}

/**
 * Test Result
 * Result of a test execution
 */
export interface TestResult {
  testId: string;
  status: TestStatus;
  executionTimeMs: number;
  error?: string;
  stackTrace?: string;
  output?: string;
  timestamp: string;
  environment: TestEnvironment;
  buildVersion?: string;
}

/**
 * Test Dependency
 * Test dependencies and relationships
 */
export interface TestDependency {
  testId: string;
  testName: string;
  dependencyType: 'REQUIRES' | 'BLOCKS' | 'RELATED';
  reason?: string;
}

/**
 * Test Metadata
 * Complete test information for registry
 */
export interface TestMetadata {
  // Identifiers
  testId: string;
  testName: string;
  
  // Classification
  category: TestCategory;
  description: string;
  targetComponent: string;
  
  // Impact & Governance
  severityImpact: SeverityImpact;
  buildBlocking: boolean;
  enabled: boolean;
  
  // Location & Execution
  filePath: string;
  testFunction: string;
  environment: TestEnvironment;
  
  // Configuration
  timeout?: number;
  retryCount?: number;
  tags?: string[];
  dependencies?: TestDependency[];
  
  // Owner & Responsibility
  owner?: string;
  team?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  
  // Statistics
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  skippedRuns: number;
  
  // Status
  currentStatus: TestStatus;
  isFlaky?: boolean;
  lastResult?: TestResult;
  
  // Tracking
  linkedIssues?: string[];
  linkedStories?: string[];
  documentationUrl?: string;
  
  // Custom Fields
  customFields?: Record<string, unknown>;
}

/**
 * Test Registry Filter
 * Filter options for querying tests
 */
export interface TestRegistryFilter {
  categories?: TestCategory[];
  statuses?: TestStatus[];
  severities?: SeverityImpact[];
  environments?: TestEnvironment[];
  components?: string[];
  tags?: string[];
  owners?: string[];
  buildBlockingOnly?: boolean;
  enabledOnly?: boolean;
  searchText?: string;
  createdAfter?: string;
  createdBefore?: string;
  lastRunAfter?: string;
  lastRunBefore?: string;
}

/**
 * Test Registry Summary
 * Statistics and overview of all tests
 */
export interface TestRegistrySummary {
  totalTests: number;
  totalEnabled: number;
  totalDisabled: number;
  
  byCategory: Record<TestCategory, number>;
  byStatus: Record<TestStatus, number>;
  bySeverity: Record<SeverityImpact, number>;
  byEnvironment: Record<TestEnvironment, number>;
  byComponent: Record<string, number>;
  
  buildBlockingCount: number;
  flakyTestsCount: number;
  quarantinedCount: number;
  
  totalRuns: number;
  passRate: number;
  averageExecutionTimeMs: number;
  
  lastUpdated: string;
}

/**
 * Test Registry Statistics
 * Detailed analytics
 */
export interface TestRegistryStatistics {
  totalCreated: number;
  totalResolved: number;
  resolutionRate: number;
  
  topCategories: Array<{ category: TestCategory; count: number }>;
  topComponents: Array<{ component: string; count: number }>;
  topOwners: Array<{ owner: string; count: number }>;
  
  testsByEnvironment: Record<TestEnvironment, number>;
  
  criticalTests: number;
  flakyTests: Array<{ testName: string; flakynessRate: number }>;
  quarantinedTests: TestMetadata[];
  
  averagePassRate: number;
  medianExecutionTimeMs: number;
  
  recentFailures: TestResult[];
  recentlyAdded: TestMetadata[];
  
  healthScore: number; // 0-100
}

/**
 * Test Report
 * Complete test report with analysis
 */
export interface TestReport {
  timestamp: string;
  buildVersion?: string;
  environment: TestEnvironment;
  
  summary: TestRegistrySummary;
  statistics: TestRegistryStatistics;
  
  detailedResults: TestMetadata[];
  
  recommendations: string[];
  
  exportedAt: string;
}

/**
 * Batch Test Operation
 * Tracking for batch operations
 */
export interface BatchTestOperation {
  operationId: string;
  operationType: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXECUTE';
  testCount: number;
  successCount: number;
  failureCount: number;
  timestamp: string;
  duration: number;
  details?: Record<string, unknown>;
}

/**
 * Test Registry Configuration
 * Configuration for the registry
 */
export interface TestRegistryConfig {
  persistencePath?: string;
  autoSave?: boolean;
  maxBatchSize?: number;
  enableMetrics?: boolean;
  enableAutoRegister?: boolean;
  defaultEnvironment?: TestEnvironment;
  retentionDays?: number;
}

/**
 * ITestRegistry Interface
 * Contract for test registry implementation
 */
export interface ITestRegistry {
  // Registration
  registerTest(metadata: TestMetadata): string;
  unregisterTest(testId: string): boolean;
  getTest(testId: string): TestMetadata | undefined;
  getAllTests(): TestMetadata[];
  
  // Querying
  filterTests(filter: TestRegistryFilter): TestMetadata[];
  searchTests(query: string): TestMetadata[];
  getTestsByCategory(category: TestCategory): TestMetadata[];
  getTestsByComponent(component: string): TestMetadata[];
  getTestsByOwner(owner: string): TestMetadata[];
  getBuildBlockingTests(): TestMetadata[];
  
  // Updates
  updateTest(testId: string, updates: Partial<TestMetadata>): void;
  recordTestResult(testId: string, result: TestResult): void;
  updateTestStatus(testId: string, status: TestStatus): void;
  
  // Batch Operations
  batchRegisterTests(metadata: TestMetadata[]): string[];
  bulkUpdateTests(testIds: string[], updates: Partial<TestMetadata>): number;
  
  // Statistics
  getSummary(): TestRegistrySummary;
  getStatistics(): TestRegistryStatistics;
  getReport(filter?: TestRegistryFilter): TestReport;
  
  // Persistence
  saveToDisk(): Promise<void>;
  loadFromDisk(): Promise<void>;
  exportAsJSON(): string;
  exportAsText(): string;
}

/**
 * ITestRegistryManager Interface
 * High-level test registry operations
 */
export interface ITestRegistryManager {
  // Auto-registration
  registerFromDecorator(metadata: Omit<TestMetadata, 'testId' | 'createdAt' | 'updatedAt'>): string;
  autoRegisterFromFile(filePath: string): string[];
  
  // Management
  enableTest(testId: string): void;
  disableTest(testId: string): void;
  markAsFlaky(testId: string, isFlaky: boolean): void;
  quarantineTest(testId: string, reason: string): void;
  releaseFromQuarantine(testId: string): void;
  
  // Grouping & Relationships
  createTestGroup(groupName: string, testIds: string[]): void;
  addDependency(fromTestId: string, toTestId: string, type: 'REQUIRES' | 'BLOCKS' | 'RELATED'): void;
  
  // Reports
  generateCategoryReport(category: TestCategory): TestReport;
  generateComponentReport(component: string): TestReport;
  generateHealthReport(): TestReport;
  
  // Integration
  identifyBlockingTests(buildVersion: string): TestMetadata[];
  identifyRegression(previousResults: TestResult[], currentResults: TestResult[]): TestMetadata[];
  
  // Maintenance
  cleanupOldResults(retentionDays: number): number;
  validateRegistry(): string[];
  
  // Access
  getRegistry(): ITestRegistry;
}

/**
 * Test Auto-Registration Result
 * Result of auto-registration attempt
 */
export interface TestAutoRegistrationResult {
  success: boolean;
  testId?: string;
  testName: string;
  error?: string;
  timestamp: string;
}
