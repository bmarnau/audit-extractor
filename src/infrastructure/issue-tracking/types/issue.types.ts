/**
 * CENTRAL ISSUE MODEL
 * 
 * Comprehensive issue tracking with:
 * - Unique Issue ID
 * - Multi-level categorization
 * - Severity assessment
 * - Root cause analysis
 * - Recommended actions
 * - Impact analysis
 * - Component tracking
 * - Version & timestamp metadata
 */

import { SeverityLevel } from '../governance/types/severity.types';

/**
 * Issue Categories - Organizational structure for issues
 */
export enum IssueCategory {
  // Test-related issues
  TEST_FAILURE = 'TEST_FAILURE',
  TEST_FLAKINESS = 'TEST_FLAKINESS',
  TEST_TIMEOUT = 'TEST_TIMEOUT',
  TEST_REGRESSION = 'TEST_REGRESSION',

  // Code quality issues
  CODE_STYLE = 'CODE_STYLE',
  TYPESCRIPT_ERROR = 'TYPESCRIPT_ERROR',
  TYPE_MISMATCH = 'TYPE_MISMATCH',
  LINTING_ERROR = 'LINTING_ERROR',

  // Performance issues
  PERFORMANCE_DEGRADATION = 'PERFORMANCE_DEGRADATION',
  MEMORY_LEAK = 'MEMORY_LEAK',
  HIGH_CPU_USAGE = 'HIGH_CPU_USAGE',
  SLOW_TEST = 'SLOW_TEST',

  // Coverage issues
  COVERAGE_GAP = 'COVERAGE_GAP',
  UNCOVERED_CODE = 'UNCOVERED_CODE',
  LOW_BRANCH_COVERAGE = 'LOW_BRANCH_COVERAGE',

  // Integration issues
  API_FAILURE = 'API_FAILURE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',

  // Build/Deployment issues
  BUILD_FAILURE = 'BUILD_FAILURE',
  DEPLOYMENT_FAILURE = 'DEPLOYMENT_FAILURE',
  DOCKER_ERROR = 'DOCKER_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',

  // Documentation issues
  MISSING_DOCUMENTATION = 'MISSING_DOCUMENTATION',
  OUTDATED_DOCUMENTATION = 'OUTDATED_DOCUMENTATION',

  // Security issues
  SECURITY_VULNERABILITY = 'SECURITY_VULNERABILITY',
  DEPRECATED_DEPENDENCY = 'DEPRECATED_DEPENDENCY',

  // Other
  UNKNOWN = 'UNKNOWN',
}

/**
 * Issue Priority Levels
 */
export enum IssuePriority {
  CRITICAL = 'CRITICAL',      // Must fix before release
  HIGH = 'HIGH',              // Should fix before release
  MEDIUM = 'MEDIUM',          // Plan for next sprint
  LOW = 'LOW',                // Nice to fix
  TRIVIAL = 'TRIVIAL',        // Informational only
}

/**
 * Issue Status - Lifecycle tracking
 */
export enum IssueStatus {
  OPEN = 'OPEN',              // Newly reported
  ACKNOWLEDGED = 'ACKNOWLEDGED', // Team aware
  IN_PROGRESS = 'IN_PROGRESS', // Being worked on
  RESOLVED = 'RESOLVED',      // Fixed, awaiting verification
  CLOSED = 'CLOSED',          // Verified fixed
  WONT_FIX = 'WONT_FIX',      // Deliberately not fixing
  DUPLICATE = 'DUPLICATE',    // Duplicate of another issue
}

/**
 * Impact Area - What parts of system are affected
 */
export enum ImpactArea {
  CORE_FUNCTIONALITY = 'CORE_FUNCTIONALITY',
  DATA_INTEGRITY = 'DATA_INTEGRITY',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  USER_EXPERIENCE = 'USER_EXPERIENCE',
  BUILD_PIPELINE = 'BUILD_PIPELINE',
  DOCUMENTATION = 'DOCUMENTATION',
  DEPENDENCIES = 'DEPENDENCIES',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
}

/**
 * Root Cause Categories
 */
export enum RootCauseType {
  // Code-related
  LOGIC_ERROR = 'LOGIC_ERROR',
  TYPE_ERROR = 'TYPE_ERROR',
  ASYNC_ERROR = 'ASYNC_ERROR',
  RACE_CONDITION = 'RACE_CONDITION',
  NULL_REFERENCE = 'NULL_REFERENCE',
  BOUNDARY_CONDITION = 'BOUNDARY_CONDITION',

  // External factors
  ENVIRONMENT_CONFIG = 'ENVIRONMENT_CONFIG',
  DEPENDENCY_VERSION = 'DEPENDENCY_VERSION',
  EXTERNAL_API = 'EXTERNAL_API',
  TIMING_ISSUE = 'TIMING_ISSUE',

  // Process-related
  MISSING_TEST = 'MISSING_TEST',
  INADEQUATE_REVIEW = 'INADEQUATE_REVIEW',
  MISSING_VALIDATION = 'MISSING_VALIDATION',
  DOCUMENTATION_GAP = 'DOCUMENTATION_GAP',

  // Unknown
  UNKNOWN = 'UNKNOWN',
}

/**
 * Individual Issue - Central issue model
 */
export interface Issue {
  // Unique Identification
  issueId: string;                    // ISS-TIMESTAMP-RANDOM
  correlationId?: string;             // Link related issues

  // Categorization
  category: IssueCategory;
  subcategory?: string;               // Optional subcategory
  priority: IssuePriority;
  severity: SeverityLevel;            // From governance framework
  status: IssueStatus;

  // Description
  title: string;                      // Short description
  description: string;                // Detailed description
  stackTrace?: string;                // Full stack trace if available
  errorMessage?: string;              // Original error message

  // Root Cause Analysis
  rootCause: RootCauseType;
  rootCauseDescription?: string;      // Detailed root cause explanation
  rootCauseFileLocation?: string;     // File and line: "src/file.ts:42"

  // Impact Analysis
  impactAreas: ImpactArea[];          // What parts of system affected
  affectedComponents: string[];       // Module/component names
  estimatedUsers?: number;            // Estimated affected users
  businessImpact?: string;            // Business consequence description
  consequenceIfNotFixed: string;      // What happens if not resolved

  // Recommended Action
  recommendedAction: string;          // What should be done
  estimatedFixEffort?: 'QUICK' | 'MEDIUM' | 'LONG'; // Time to fix
  suggestedFix?: string;              // Code or configuration fix
  workaround?: string;                // Temporary workaround if available

  // Metadata
  buildVersion: string;               // Version where issue found
  testRunId?: string;                 // Associated test run
  detectionMethod: 'AUTOMATED_TEST' | 'MANUAL_TEST' | 'CODE_REVIEW' | 'PRODUCTION' | 'MONITORING' | 'USER_REPORT';
  reportedBy?: string;                // Who reported the issue
  assignedTo?: string;                // Who is working on it

  // Timeline
  discoveredAt: string;               // ISO timestamp
  createdAt: string;                  // ISO timestamp
  updatedAt?: string;                 // ISO timestamp
  targetFixDate?: string;             // ISO timestamp
  resolvedAt?: string;                // ISO timestamp

  // Additional Data
  labels?: string[];                  // For filtering/searching
  linkedIssues?: string[];            // Related issue IDs
  customFields?: Record<string, unknown>; // For extensibility

  // Tracking
  views?: number;                     // How many times viewed
  comments?: IssueComment[];          // Discussion/resolution notes
  resolution?: IssueResolution;       // How it was resolved
}

/**
 * Issue Comment - Discussion/notes on an issue
 */
export interface IssueComment {
  commentId: string;
  author: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  attachments?: string[];
}

/**
 * Issue Resolution - How the issue was resolved
 */
export interface IssueResolution {
  resolvedAt: string;
  resolvedBy: string;
  resolutionType: 'FIXED' | 'WONT_FIX' | 'DUPLICATE' | 'DECLINED' | 'DEFERRED';
  resolutionSummary: string;
  verificationMethod?: string;
  commitReference?: string;           // Git commit hash
  pullRequestReference?: string;      // PR number or URL
}

/**
 * Issue Summary - Aggregated statistics
 */
export interface IssueSummary {
  totalIssues: number;
  byCategory: Record<IssueCategory, number>;
  byPriority: Record<IssuePriority, number>;
  bySeverity: Record<SeverityLevel, number>;
  byStatus: Record<IssueStatus, number>;
  openCount: number;
  criticalCount: number;
  averageResolutionTime?: number;    // Days
}

/**
 * Issue Filter - For querying issues
 */
export interface IssueFilter {
  categories?: IssueCategory[];
  priorities?: IssuePriority[];
  severities?: SeverityLevel[];
  statuses?: IssueStatus[];
  impactAreas?: ImpactArea[];
  components?: string[];
  buildVersions?: string[];
  createdAfter?: string;              // ISO timestamp
  createdBefore?: string;
  assignedTo?: string;
  search?: string;                    // Text search in title/description
}

/**
 * Issue Report - For exporting/displaying
 */
export interface IssueReport {
  generatedAt: string;
  totalIssues: number;
  summary: IssueSummary;
  issues: Issue[];
  criticalBlockers: Issue[];
  trends?: {
    issueTrend: Array<{ date: string; count: number }>;
    resolutionRate: number;           // Percentage of resolved issues
  };
}

/**
 * Batch Issue Operation - For bulk create/update
 */
export interface BatchIssueOperation {
  operation: 'CREATE' | 'UPDATE' | 'CLOSE' | 'DELETE';
  issues: Issue[];
  timestamp: string;
  performedBy: string;
}

/**
 * Issue Statistics - For analytics
 */
export interface IssueStatistics {
  totalCreated: number;
  totalResolved: number;
  averageResolutionTime: number;      // Days
  medianResolutionTime: number;       // Days
  resolutionRate: number;             // Percentage
  topCategories: Array<{ category: IssueCategory; count: number }>;
  topComponents: Array<{ component: string; count: number }>;
  trendingIssueTypes: IssueCategory[];
  criticalOpenIssues: number;
  blockedReleases: number;
}
