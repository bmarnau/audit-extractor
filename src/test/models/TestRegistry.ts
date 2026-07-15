/**
 * Test Registry Modell - Phase 38
 * 
 * Zentrale Datenmodelle für das technische Testframework.
 * Definiert Struktur, Kategorien und Severity-Levels.
 * 
 * Architekturprinzipien:
 * - Keine Reports ohne definiertes Testmodell
 * - Jeder Test erhält eine eindeutige Test-ID (CAT-NNN)
 * - Jeder Test gehört zu genau einer Kategorie
 * - Jeder Fehler besitzt eine Severity
 * - Alle Reports basieren auf diesem gemeinsamen Datenmodell
 */

// ============================================================================
// Severity Levels
// ============================================================================

export enum Severity {
  CRITICAL = 'CRITICAL',  // System nicht nutzbar
  HIGH = 'HIGH',          // Kernfunktion eingeschränkt
  MEDIUM = 'MEDIUM',      // Teilfunktion betroffen
  LOW = 'LOW',            // Kosmetisch oder Komfortfunktion
  INFO = 'INFO'           // Reine Information
}

export const SEVERITY_ORDER = {
  [Severity.CRITICAL]: 1,
  [Severity.HIGH]: 2,
  [Severity.MEDIUM]: 3,
  [Severity.LOW]: 4,
  [Severity.INFO]: 5
};

// ============================================================================
// Test Categories
// ============================================================================

export enum TestCategory {
  INFRASTRUCTURE = 'INF',  // INF-001...
  PERSISTENCE = 'DAT',    // DAT-001...
  CORE_SERVICES = 'SRV',  // SRV-001...
  API = 'API',            // API-001...
  CONFIGURATION = 'CFG',  // CFG-001...
  OPERATIONS = 'OPS',     // OPS-001...
  FRONTEND = 'UI',        // UI-001...
  GOVERNANCE = 'GOV'      // GOV-001...
}

// ============================================================================
// Test Status
// ============================================================================

export enum TestStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  ERROR = 'ERROR'
}

// ============================================================================
// Test Definition
// ============================================================================

export interface TestDefinition {
  /** Eindeutige Test-ID (z.B. INF-001) */
  id: string;
  
  /** Kategorie des Tests */
  category: TestCategory;
  
  /** Lesbare Beschreibung */
  title: string;
  
  /** Detaillierte Erklärung */
  description: string;
  
  /** Severity Level */
  severity: Severity;
  
  /** Implantiert? (für Feature-Gate) */
  implemented: boolean;
  
  /** Optional: Tags für Filterung */
  tags?: string[];
  
  /** Optional: Abhängigkeiten zu anderen Tests */
  dependsOn?: string[];
}

// ============================================================================
// Test Result
// ============================================================================

export interface TestResult {
  /** Test Definition */
  test: TestDefinition;
  
  /** Status */
  status: TestStatus;
  
  /** Zeitstempel Start */
  startTime: Date;
  
  /** Zeitstempel Ende */
  endTime?: Date;
  
  /** Dauer in Millisekunden */
  duration?: number;
  
  /** Fehlerdetails falls FAILED/ERROR */
  error?: {
    message: string;
    code: string;
    details: any;
    stack?: string;
  };
  
  /** Technische Details/Metrics */
  metrics?: {
    [key: string]: any;
  };
  
  /** Ausgabe/Logs */
  logs?: string[];
}

// ============================================================================
// Test Execution Summary
// ============================================================================

export interface TestExecutionSummary {
  /** Eindeutige Run-ID (YYYYMMDD_HHMMSS) */
  runId: string;
  
  /** Zeitstempel */
  timestamp: Date;
  
  /** Alle Test-Ergebnisse */
  results: TestResult[];
  
  /** Geschätzte Dauer */
  totalDuration: number;
  
  /** Statistiken */
  stats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    errors: number;
    passRate: number;
  };
  
  /** Fehler nach Severity */
  findingsBySeverity: {
    critical: TestResult[];
    high: TestResult[];
    medium: TestResult[];
    low: TestResult[];
    info: TestResult[];
  };
  
  /** Health Matrix */
  healthMatrix: {
    [category: string]: {
      passed: number;
      total: number;
      status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    };
  };
}

// ============================================================================
// Test Catalog Entry
// ============================================================================

export interface TestCatalogEntry {
  /** Test Definition */
  definition: TestDefinition;
  
  /** Executor Function */
  executor: (context: TestExecutionContext) => Promise<TestResult>;
}

// ============================================================================
// Test Execution Context
// ============================================================================

export interface TestExecutionContext {
  /** Logger für Test-Ausgabe */
  log: (message: string) => void;
  
  /** Config API Zugriff */
  config: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
  };
  
  /** Service Zugriff */
  services: {
    backend: string;
    frontend: string;
    database: string;
    redis: string;
  };
  
  /** Utilities */
  utils: {
    http: (method: string, url: string, data?: any) => Promise<any>;
    delay: (ms: number) => Promise<void>;
  };
}

// ============================================================================
// Test Trend Data
// ============================================================================

export interface TestTrendDataPoint {
  timestamp: Date;
  runId: string;
  passRate: number;
  totalTests: number;
  failedTests: number;
  criticalIssues: number;
  highIssues: number;
}

// ============================================================================
// Report Types
// ============================================================================

export interface TestReport {
  summary: TestExecutionSummary;
  executiveReport: ExecutiveReport;
  detailedFindings: DetailedFinding[];
  healthMatrix: HealthMatrix;
  trends?: TrendAnalysis;
}

export interface ExecutiveReport {
  status: 'PASS' | 'FAIL' | 'DEGRADED';
  timestamp: Date;
  duration: number;
  passRate: number;
  totalTests: number;
  criticalIssues: number;
  highIssues: number;
  recommendations: string[];
}

export interface DetailedFinding {
  testId: string;
  title: string;
  category: TestCategory;
  severity: Severity;
  status: TestStatus;
  description: string;
  impact: string;
  recommendation: string;
  technicalDetails: any;
}

export interface HealthMatrix {
  infrastructure: CategoryHealth;
  persistence: CategoryHealth;
  coreServices: CategoryHealth;
  apiStability: CategoryHealth;
  configuration: CategoryHealth;
  operations: CategoryHealth;
  frontend: CategoryHealth;
  governance: CategoryHealth;
}

export interface CategoryHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  passedTests: number;
  totalTests: number;
  passRate: number;
  failedTests: DetailedFinding[];
}

export interface TrendAnalysis {
  dataPoints: TestTrendDataPoint[];
  passRateTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  averagePassRate: number;
  criticalIssuesTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validiert Test-Definition
 */
export function validateTestDefinition(test: TestDefinition): string[] {
  const errors: string[] = [];
  
  if (!test.id || !/^[A-Z]{3}-\d{3}$/.test(test.id)) {
    errors.push(`Invalid test ID format: ${test.id}. Expected CAT-NNN`);
  }
  
  if (!test.category) {
    errors.push('Test category is required');
  }
  
  if (!test.title || test.title.length < 5) {
    errors.push('Test title must be at least 5 characters');
  }
  
  if (!Object.values(Severity).includes(test.severity)) {
    errors.push(`Invalid severity: ${test.severity}`);
  }
  
  return errors;
}

/**
 * Berechnet Statistiken aus Ergebnissen
 */
export function calculateStats(results: TestResult[]) {
  const total = results.length;
  const passed = results.filter(r => r.status === TestStatus.PASSED).length;
  const failed = results.filter(r => r.status === TestStatus.FAILED).length;
  const skipped = results.filter(r => r.status === TestStatus.SKIPPED).length;
  const errors = results.filter(r => r.status === TestStatus.ERROR).length;
  
  return {
    total,
    passed,
    failed,
    skipped,
    errors,
    passRate: total > 0 ? (passed / total) * 100 : 0
  };
}
