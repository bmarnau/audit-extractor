/**
 * API Discovery Framework - Type Definitions
 * 
 * Complete type system for API discovery, smoke testing, and risk analysis
 * Supports: Route Analysis, Endpoint Extraction, Controller Parsing, Test Execution
 */

/**
 * HTTP Methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * API Endpoint
 */
export interface ApiEndpoint {
  // Identifiers
  endpointId: string;
  path: string;
  method: HttpMethod;
  
  // Details
  name: string;
  description?: string;
  controller?: string;
  handler?: string;
  
  // Parameters
  pathParams?: string[];
  queryParams?: string[];
  bodySchema?: any;
  
  // Security
  requiresAuth: boolean;
  authType?: 'JWT' | 'OAuth2' | 'APIKey' | 'Basic' | 'Other';
  requiredRoles?: string[];
  
  // Metadata
  version?: string;
  deprecated?: boolean;
  tags?: string[];
  
  // Source info
  filePath?: string;
  lineNumber?: number;
  
  // Status
  isImplemented: boolean;
  hasTests?: boolean;
  
  // Created/Updated
  discoveredAt: string;
}

/**
 * API Endpoint Group (by controller/module)
 */
export interface ApiEndpointGroup {
  controller: string;
  description?: string;
  endpoints: ApiEndpoint[];
  basePath?: string;
  tags?: string[];
}

/**
 * Complete API Inventory
 */
export interface ApiInventory {
  // Metadata
  inventoryId: string;
  generatedAt: string;
  projectName: string;
  version?: string;
  
  // Statistics
  totalEndpoints: number;
  totalControllers: number;
  methodCounts: Record<HttpMethod, number>;
  
  // Content
  groups: ApiEndpointGroup[];
  endpoints: ApiEndpoint[];
  
  // Summary
  protectedEndpoints: number;
  publicEndpoints: number;
  deprecatedEndpoints: number;
  untestedEndpoints: number;
}

/**
 * Smoke Test Request
 */
export interface SmokeTestRequest {
  endpoint: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  queryParams?: Record<string, any>;
  pathParams?: Record<string, any>;
}

/**
 * Smoke Test Response
 */
export interface SmokeTestResponse {
  statusCode: number;
  headers: Record<string, any>;
  body: any;
  bodyType: 'json' | 'text' | 'binary' | 'unknown';
  size: number;
  duration: number;
}

/**
 * Smoke Test Result
 */
export interface SmokeTestResult {
  // Identifiers
  testId: string;
  endpointId: string;
  
  // Request/Response
  request: SmokeTestRequest;
  response?: SmokeTestResponse;
  
  // Status
  passed: boolean;
  skipped: boolean;
  
  // Details
  testName: string;
  checks: SmokeTestCheck[];
  
  // Error details
  error?: string;
  errorType?: 'ConnectionError' | 'TimeoutError' | 'ValidationError' | 'AuthError' | 'ServerError' | 'Unknown';
  
  // Timing
  executedAt: string;
  duration: number;
}

/**
 * Individual smoke test check
 */
export interface SmokeTestCheck {
  name: string;
  description: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

/**
 * Risk Analysis Result
 */
export interface RiskAnalysis {
  endpointId: string;
  path: string;
  method: HttpMethod;
  
  // Risk level
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  riskScore: number; // 0-100
  
  // Issues
  issues: RiskIssue[];
  
  // Recommendations
  recommendations: string[];
  
  // Details
  analyzedAt: string;
}

/**
 * Risk Issue
 */
export interface RiskIssue {
  type: RiskIssueType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  details?: Record<string, any>;
}

/**
 * Risk Issue Types
 */
export enum RiskIssueType {
  AUTHENTICATION_MISSING = 'AUTHENTICATION_MISSING',
  VALIDATION_MISSING = 'VALIDATION_MISSING',
  ERROR_HANDLING_MISSING = 'ERROR_HANDLING_MISSING',
  RATE_LIMITING_MISSING = 'RATE_LIMITING_MISSING',
  LOGGING_MISSING = 'LOGGING_MISSING',
  DOCUMENTATION_MISSING = 'DOCUMENTATION_MISSING',
  NO_TEST_COVERAGE = 'NO_TEST_COVERAGE',
  DEPRECATED = 'DEPRECATED',
  SLOW_RESPONSE = 'SLOW_RESPONSE',
  LARGE_PAYLOAD = 'LARGE_PAYLOAD',
  UNSAFE_METHOD = 'UNSAFE_METHOD',
  BROKEN_RESPONSE_SCHEMA = 'BROKEN_RESPONSE_SCHEMA',
  SECURITY_ISSUE = 'SECURITY_ISSUE',
  UNIMPLEMENTED = 'UNIMPLEMENTED',
}

/**
 * Smoke Test Report
 */
export interface SmokeTestReport {
  reportId: string;
  generatedAt: string;
  
  // Summary
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  passRate: number;
  
  // Results
  results: SmokeTestResult[];
  
  // By method
  resultsByMethod: Record<HttpMethod, SmokeTestMethodStats>;
  
  // Failures
  failures: SmokeTestFailure[];
  
  // Timing
  totalDuration: number;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
  
  // Health
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

/**
 * Test statistics by HTTP method
 */
export interface SmokeTestMethodStats {
  method: HttpMethod;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
}

/**
 * Test failure
 */
export interface SmokeTestFailure {
  testId: string;
  endpointId: string;
  endpoint: string;
  method: HttpMethod;
  error: string;
  errorType: string;
  failedChecks: string[];
  suggestedFix?: string;
}

/**
 * Functional API Report
 */
export interface ApiFunctionalReport {
  reportId: string;
  generatedAt: string;
  
  // Inventory Summary
  inventorySummary: {
    totalEndpoints: number;
    totalControllers: number;
    publicEndpoints: number;
    protectedEndpoints: number;
  };
  
  // Smoke Test Summary
  smokeTestSummary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    passRate: number;
  };
  
  // Risk Analysis Summary
  riskSummary: {
    totalEndpointsAnalyzed: number;
    criticalRisks: number;
    highRisks: number;
    mediumRisks: number;
    lowRisks: number;
  };
  
  // Top Issues
  topRisks: RiskAnalysis[];
  topFailures: SmokeTestFailure[];
  
  // Recommendations
  prioritizedRecommendations: RecommendationGroup[];
  
  // Overall Health
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  apiHealthScore: number; // 0-100
}

/**
 * Recommendation Group
 */
export interface RecommendationGroup {
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedEndpointCount: number;
  recommendations: string[];
}

/**
 * API Discovery Service Interface
 */
export interface IApiDiscoveryService {
  discoverEndpoints(): Promise<ApiEndpoint[]>;
  discoverControllers(): Promise<ApiEndpointGroup[]>;
  generateInventory(): Promise<ApiInventory>;
  exportInventory(inventory: ApiInventory, filePath: string): Promise<void>;
}

/**
 * Endpoint Analyzer Interface
 */
export interface IEndpointAnalyzer {
  analyzeEndpoint(endpoint: ApiEndpoint): Promise<any>;
  extractParameters(endpoint: ApiEndpoint): Promise<{ path: string[]; query: string[] }>;
  checkAuthentication(endpoint: ApiEndpoint): Promise<boolean>;
  checkValidation(endpoint: ApiEndpoint): Promise<boolean>;
}

/**
 * Smoke Test Service Interface
 */
export interface ISmokeTestService {
  runTest(endpoint: ApiEndpoint, request: SmokeTestRequest): Promise<SmokeTestResult>;
  runAllTests(endpoints: ApiEndpoint[]): Promise<SmokeTestReport>;
  validateResponse(endpoint: ApiEndpoint, response: SmokeTestResponse): Promise<SmokeTestCheck[]>;
}

/**
 * Risk Analyzer Interface
 */
export interface IRiskAnalyzer {
  analyzeEndpoint(endpoint: ApiEndpoint, testResult?: SmokeTestResult): Promise<RiskAnalysis>;
  analyzeAll(endpoints: ApiEndpoint[], testResults?: SmokeTestResult[]): Promise<RiskAnalysis[]>;
  calculateRiskScore(issues: RiskIssue[]): number;
}

/**
 * Report Generator Interface
 */
export interface IReportGenerator {
  generateSmokeTestReport(results: SmokeTestResult[]): Promise<SmokeTestReport>;
  generateFunctionalReport(
    inventory: ApiInventory,
    smokeTestReport: SmokeTestReport,
    riskAnalysis: RiskAnalysis[]
  ): Promise<ApiFunctionalReport>;
  exportReports(
    smokeReport: SmokeTestReport,
    funcReport: ApiFunctionalReport,
    outputDir: string
  ): Promise<void>;
}
