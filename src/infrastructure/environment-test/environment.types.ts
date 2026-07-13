/**
 * Environment Test Suite - Type Definitions
 * 
 * Comprehensive type system for environment validation, testing, and reporting
 * Supports: Node.js, npm, Docker, PostgreSQL, Config, Environment Vars, Filesystem, Permissions
 * 
 * Pattern: Each check produces a CheckResult with status, findings, recommendations, and classification
 */

/**
 * Severity levels for environment issues
 */
export enum EnvironmentSeverity {
  CRITICAL = 'CRITICAL',      // Application cannot run
  HIGH = 'HIGH',              // Major functionality impaired
  MEDIUM = 'MEDIUM',          // Some features affected
  LOW = 'LOW',                // Minor issues
  INFO = 'INFO'               // Informational only
}

/**
 * Environment check categories
 */
export enum EnvironmentCheckCategory {
  NODE_VERSION = 'NODE_VERSION',
  NPM_VERSION = 'NPM_VERSION',
  DOCKER_INSTALLATION = 'DOCKER_INSTALLATION',
  DOCKER_SERVICE = 'DOCKER_SERVICE',
  DOCKER_COMPOSE = 'DOCKER_COMPOSE',
  POSTGRESQL_INSTALLATION = 'POSTGRESQL_INSTALLATION',
  POSTGRESQL_SERVICE = 'POSTGRESQL_SERVICE',
  POSTGRESQL_CONNECTIVITY = 'POSTGRESQL_CONNECTIVITY',
  CONFIG_FILES = 'CONFIG_FILES',
  ENVIRONMENT_VARIABLES = 'ENVIRONMENT_VARIABLES',
  DIRECTORY_STRUCTURE = 'DIRECTORY_STRUCTURE',
  FILE_PERMISSIONS = 'FILE_PERMISSIONS',
  DISK_SPACE = 'DISK_SPACE',
  PORT_AVAILABILITY = 'PORT_AVAILABILITY',
  DATABASE_INITIALIZATION = 'DATABASE_INITIALIZATION'
}

/**
 * Root cause types for environment issues
 */
export enum EnvironmentErrorType {
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  NOT_INSTALLED = 'NOT_INSTALLED',
  NOT_IN_PATH = 'NOT_IN_PATH',
  SERVICE_NOT_RUNNING = 'SERVICE_NOT_RUNNING',
  SERVICE_NOT_AVAILABLE = 'SERVICE_NOT_AVAILABLE',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  MISSING_FILE = 'MISSING_FILE',
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  MISSING_ENV_VAR = 'MISSING_ENV_VAR',
  INVALID_ENV_VAR = 'INVALID_ENV_VAR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DIRECTORY_MISSING = 'DIRECTORY_MISSING',
  INSUFFICIENT_DISK_SPACE = 'INSUFFICIENT_DISK_SPACE',
  PORT_IN_USE = 'PORT_IN_USE',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Individual check result
 */
export interface EnvironmentCheckResult {
  // Identifiers
  checkId: string;
  category: EnvironmentCheckCategory;
  checkName: string;
  
  // Status
  status: 'PASS' | 'FAIL' | 'WARNING' | 'SKIPPED';
  severity: EnvironmentSeverity;
  
  // Error details
  errorType?: EnvironmentErrorType;
  errorMessage?: string;
  errorDetails?: Record<string, any>;
  
  // Findings
  findings: string[];
  details: EnvironmentCheckDetails;
  
  // Recommendations
  recommendedActions: string[];
  consequenceIfNotFixed?: string;
  
  // Metrics
  actualValue?: any;
  expectedValue?: any;
  requiredValue?: any;
  
  // Timing
  checkedAt: string; // ISO timestamp
  duration: number; // milliseconds
  
  // Blocking
  isBlockingBuild: boolean;
  isBlockingDeploy: boolean;
}

/**
 * Detailed information from check
 */
export interface EnvironmentCheckDetails {
  [key: string]: any;
}

/**
 * Node version details
 */
export interface NodeVersionDetails extends EnvironmentCheckDetails {
  currentVersion: string;
  majorVersion: number;
  minorVersion: number;
  patchVersion: number;
  requiredMajor: number;
  requiredMinor: number;
  isCompatible: boolean;
}

/**
 * npm version details
 */
export interface NpmVersionDetails extends EnvironmentCheckDetails {
  currentVersion: string;
  lockfileExists: boolean;
  nodeModulesExists: boolean;
  installedPackages: number;
}

/**
 * Docker details
 */
export interface DockerDetails extends EnvironmentCheckDetails {
  isInstalled: boolean;
  version?: string;
  isServiceRunning?: boolean;
  daemonVersion?: string;
  buildCapabilities?: string[];
  composeVersion?: string;
  composeInstalled?: boolean;
}

/**
 * PostgreSQL details
 */
export interface PostgreSQLDetails extends EnvironmentCheckDetails {
  isInstalled: boolean;
  version?: string;
  isServiceRunning?: boolean;
  port?: number;
  canConnect?: boolean;
  defaultDatabaseExists?: boolean;
}

/**
 * Config file details
 */
export interface ConfigFileDetails extends EnvironmentCheckDetails {
  configFiles: ConfigFileStatus[];
  totalFiles: number;
  validFiles: number;
  missingFiles: string[];
}

/**
 * Individual config file status
 */
export interface ConfigFileStatus {
  filePath: string;
  exists: boolean;
  format: 'json' | 'yaml' | 'env' | 'js' | 'unknown';
  isValid: boolean;
  size: number;
  lastModified: string;
  requiredFields?: string[];
  missingFields?: string[];
  validationError?: string;
}

/**
 * Environment variable details
 */
export interface EnvironmentVariableDetails extends EnvironmentCheckDetails {
  requiredVars: RequiredEnvVar[];
  presentVars: string[];
  missingVars: string[];
  invalidVars: InvalidEnvVar[];
  totalRequired: number;
  totalPresent: number;
}

/**
 * Required environment variable
 */
export interface RequiredEnvVar {
  name: string;
  required: boolean;
  value?: string;
  isValid?: boolean;
  description?: string;
}

/**
 * Invalid environment variable
 */
export interface InvalidEnvVar {
  name: string;
  value: string;
  expectedFormat?: string;
  validationError?: string;
}

/**
 * Directory structure details
 */
export interface DirectoryStructureDetails extends EnvironmentCheckDetails {
  requiredDirectories: DirectoryStatus[];
  totalDirectories: number;
  existingDirectories: number;
  missingDirectories: string[];
}

/**
 * Individual directory status
 */
export interface DirectoryStatus {
  path: string;
  exists: boolean;
  isReadable: boolean;
  isWritable: boolean;
  itemCount?: number;
  totalSize?: number;
}

/**
 * File permissions details
 */
export interface FilePermissionsDetails extends EnvironmentCheckDetails {
  files: FilePermissionStatus[];
  totalFiles: number;
  validPermissions: number;
  invalidPermissions: InvalidPermission[];
}

/**
 * Individual file permission status
 */
export interface FilePermissionStatus {
  filePath: string;
  owner?: string;
  mode?: string;
  readable: boolean;
  writable: boolean;
  executable: boolean;
  isValid: boolean;
}

/**
 * Invalid file permission
 */
export interface InvalidPermission {
  filePath: string;
  currentMode?: string;
  requiredMode?: string;
  issue: string;
}

/**
 * Disk space details
 */
export interface DiskSpaceDetails extends EnvironmentCheckDetails {
  totalSpace: number;
  availableSpace: number;
  usedSpace: number;
  usagePercentage: number;
  isHealthy: boolean;
  warningThreshold: number;
  criticalThreshold: number;
}

/**
 * Port availability details
 */
export interface PortAvailabilityDetails extends EnvironmentCheckDetails {
  ports: PortStatus[];
  allAvailable: boolean;
}

/**
 * Individual port status
 */
export interface PortStatus {
  port: number;
  name: string;
  isAvailable: boolean;
  processUsingPort?: string;
  serviceType: 'API' | 'DATABASE' | 'FRONTEND' | 'DOCKER' | 'OTHER';
}

/**
 * Environment classification
 */
export interface EnvironmentClassification {
  category: EnvironmentCheckCategory;
  errorType: EnvironmentErrorType;
  severity: EnvironmentSeverity;
  isBlockingBuild: boolean;
  isBlockingDeploy: boolean;
  rootCause: string;
  suggestedActions: string[];
}

/**
 * Complete environment report
 */
export interface EnvironmentReport {
  // Report metadata
  reportId: string;
  generatedAt: string; // ISO timestamp
  environment: 'development' | 'staging' | 'production' | 'local';
  
  // System information
  osInfo: OSInfo;
  systemInfo: SystemInfo;
  
  // Check results
  checks: EnvironmentCheckResult[];
  
  // Summary
  summary: EnvironmentReportSummary;
  
  // Health
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  overallScore: number; // 0-100
  
  // Build readiness
  buildReady: boolean;
  deployReady: boolean;
  
  // Recommendations
  recommendations: string[];
  
  // Issues
  classifications: EnvironmentClassification[];
  criticalIssues: EnvironmentCheckResult[];
  blockingIssues: EnvironmentCheckResult[];
}

/**
 * Operating system information
 */
export interface OSInfo {
  platform: string;
  arch: string;
  release: string;
  kernel?: string;
  uptime: number; // seconds
}

/**
 * System information
 */
export interface SystemInfo {
  hostname: string;
  cpuCount: number;
  totalMemory: number; // bytes
  availableMemory: number; // bytes
  memoryUsagePercentage: number;
}

/**
 * Environment report summary
 */
export interface EnvironmentReportSummary {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  skippedChecks: number;
  
  passRate: number; // percentage
  failureRate: number; // percentage
  
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  infoIssues: number;
  
  buildBlockers: number;
  deployBlockers: number;
  
  executionTime: number; // milliseconds
}

/**
 * Service interface for environment checking
 */
export interface IEnvironmentChecker {
  checkNodeVersion(): Promise<EnvironmentCheckResult>;
  checkNpmVersion(): Promise<EnvironmentCheckResult>;
  checkDocker(): Promise<EnvironmentCheckResult>;
  checkDockerService(): Promise<EnvironmentCheckResult>;
  checkDockerCompose(): Promise<EnvironmentCheckResult>;
  checkPostgreSQL(): Promise<EnvironmentCheckResult>;
  checkPostgreSQLService(): Promise<EnvironmentCheckResult>;
  checkPostgreSQLConnectivity(): Promise<EnvironmentCheckResult>;
  checkConfigFiles(): Promise<EnvironmentCheckResult>;
  checkEnvironmentVariables(): Promise<EnvironmentCheckResult>;
  checkDirectoryStructure(): Promise<EnvironmentCheckResult>;
  checkFilePermissions(): Promise<EnvironmentCheckResult>;
  checkDiskSpace(): Promise<EnvironmentCheckResult>;
  checkPortAvailability(): Promise<EnvironmentCheckResult>;
  runAllChecks(): Promise<EnvironmentCheckResult[]>;
}

/**
 * Service interface for error classification
 */
export interface IEnvironmentErrorClassifier {
  classifyError(
    category: EnvironmentCheckCategory,
    error: Error | string,
    details?: Record<string, any>
  ): EnvironmentClassification;
  
  determineSeverity(errorType: EnvironmentErrorType): EnvironmentSeverity;
  
  getRecommendations(
    errorType: EnvironmentErrorType,
    details?: Record<string, any>
  ): string[];
}

/**
 * Service interface for report generation
 */
export interface IEnvironmentReporter {
  generateReport(
    checks: EnvironmentCheckResult[],
    environment: 'development' | 'staging' | 'production' | 'local'
  ): Promise<EnvironmentReport>;
  
  exportAsJSON(report: EnvironmentReport, filePath: string): Promise<void>;
  exportAsHTML(report: EnvironmentReport, filePath: string): Promise<void>;
  exportAsMarkdown(report: EnvironmentReport, filePath: string): Promise<void>;
  
  generateSummary(report: EnvironmentReport): string;
}
