/**
 * Unified Test Result Model - Phase 38B
 * 
 * Zentrales Datenmodell für alle technischen Testergebnisse.
 * Garantiert einheitliches Format über alle Test-Kategorien hinweg.
 * 
 * Struktur:
 * - metadata.json: Laufinfo, Timestamps, Umgebung
 * - summary.json: Aggregierte Statistiken
 * - findings.json: Detaillierte Fehleranalyse
 */

import { Severity } from './TestRegistry';

/**
 * Run ID Format: YYYYMMDD_HHMMSS_NNN
 * Beispiel: 20260714_101530_001
 */
export type RunId = string;

/**
 * Eindeutige Test Ausführungs-ID
 */
export interface TestExecutionId {
  testId: string;
  executionIndex: number;
}

// ============================================================================
// METADATA JSON
// ============================================================================

/**
 * Metadaten einer Test-Ausführung
 */
export interface TestRunMetadata {
  /** Eindeutige Run-ID */
  runId: RunId;

  /** Zeitpunkt des Starts */
  startTime: string; // ISO 8601

  /** Zeitpunkt des Endes */
  endTime: string; // ISO 8601

  /** Gesamtdauer in Millisekunden */
  totalDurationMs: number;

  /** Test-Framework Version */
  frameworkVersion: string;

  /** Test Katalog Version */
  catalogVersion: string;

  /** Umgebungsinformationen */
  environment: {
    host: string;
    platform: string;
    nodeVersion: string;
    workingDirectory: string;
  };

  /** Konfiguration dieser Ausführung */
  configuration: {
    includeCategories?: string[];
    excludeCategories?: string[];
    includeSeverities?: Severity[];
    testFilter?: string;
    parallel: boolean;
    maxConcurrent: number;
    timeoutMs: number;
  };

  /** Test-Ausführungs-Kontext */
  context: {
    backendUrl: string;
    frontendUrl: string;
    databaseUrl: string;
    redisUrl: string;
  };

  /** Ausführungsart */
  executionMode: 'FULL' | 'CRITICAL' | 'SMOKE' | 'SUBSET';

  /** Optionale Notizen */
  notes?: string;

  /** Datei-Pfade */
  outputPaths: {
    metadata: string;
    summary: string;
    findings: string;
    report: string;
    pdf?: string;
  };
}

// ============================================================================
// SUMMARY JSON
// ============================================================================

/**
 * Aggregierte Testlauf-Zusammenfassung
 */
export interface TestRunSummary {
  /** Run-ID Referenz */
  runId: RunId;

  /** Zeitstempel */
  timestamp: string;

  /** Gesamte Testergebnisse */
  stats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    error: number;
  };

  /** Pass Rate in Prozent */
  passRate: number;

  /** Dauer in Millisekunden */
  durationMs: number;

  /** Status gesamt */
  status: 'PASS' | 'FAIL' | 'DEGRADED' | 'ERROR';

  /** Pro Kategorie */
  byCategory: {
    [category: string]: {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
      passRate: number;
      status: 'PASS' | 'FAIL' | 'DEGRADED';
    };
  };

  /** Fehler nach Severity */
  findingsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };

  /** Fazit für Entscheidungsträger */
  executive: {
    canDeploy: boolean;
    criticalIssuesCount: number;
    actionRequired: boolean;
    recommendedAction: string;
  };

  /** Performance Metriken */
  performance: {
    averageTestDurationMs: number;
    fastestTestMs: number;
    slowestTestMs: number;
    totalParallelizationEfficiency: number;
  };
}

// ============================================================================
// FINDINGS JSON
// ============================================================================

/**
 * Ein einzelnes Fehlerfinding
 */
export interface TestFinding {
  /** Eindeutige Finding-ID */
  id: string; // format: RUN_ID-FINDING_INDEX

  /** Test-ID die diesen Fehler verursacht hat */
  testId: string;

  /** Test-Kategorie */
  category: string;

  /** Fehlertyp */
  type: 'ASSERTION_FAILURE' | 'TIMEOUT' | 'EXCEPTION' | 'CONFIGURATION' | 'ENVIRONMENT';

  /** Severity Level */
  severity: Severity;

  /** Kurzer Titel */
  title: string;

  /** Detaillierte Beschreibung */
  description: string;

  /** Auswirkung */
  impact: string;

  /** Handlungsempfehlung */
  recommendation: string;

  /** Stack Trace falls vorhanden */
  stackTrace?: string;

  /** Kontext-Informationen */
  context: {
    [key: string]: any;
  };

  /** Zeitstempel des Fehlers */
  timestamp: string;

  /** Wie oft dieser Fehler bereits aufgetreten ist */
  occurrenceCount: number;

  /** Root Cause Analyse falls verfügbar */
  rootCause?: {
    category: string;
    description: string;
    confidence: number; // 0-100
  };
}

/**
 * Sammlung aller Findings pro Lauf
 */
export interface TestRunFindings {
  /** Run-ID Referenz */
  runId: RunId;

  /** Alle Findings */
  findings: TestFinding[];

  /** Fehler pro Test */
  findingsByTest: {
    [testId: string]: TestFinding[];
  };

  /** Fehler pro Kategorie */
  findingsByCategory: {
    [category: string]: TestFinding[];
  };

  /** Fehler nach Severity */
  findingsBySeverity: {
    critical: TestFinding[];
    high: TestFinding[];
    medium: TestFinding[];
    low: TestFinding[];
    info: TestFinding[];
  };

  /** Fehlergruppen (z.B. alle Connection Errors) */
  errorGroups: {
    [groupName: string]: {
      findings: TestFinding[];
      commonCause?: string;
      suggestedFix?: string;
    };
  };

  /** Trends: Wurde dieser Fehler schon vorher beobachtet? */
  regression: {
    newErrors: TestFinding[];
    recurringErrors: TestFinding[];
    fixedErrors: TestFinding[];
  };
}

// ============================================================================
// Einzelnes Test Result
// ============================================================================

/**
 * Ergebnis für einen einzelnen durchgeführten Test
 */
export interface IndividualTestResult {
  /** Test-ID */
  testId: string;

  /** Test-Kategorie */
  category: string;

  /** Severity des Tests */
  severity: Severity;

  /** Status */
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'ERROR';

  /** Start Zeit */
  startTime: string;

  /** End Zeit */
  endTime: string;

  /** Dauer in MS */
  durationMs: number;

  /** Nachricht falls vorhanden */
  message?: string;

  /** Fehler Falls vorhanden */
  error?: {
    code: string;
    message: string;
    stack?: string;
  };

  /** Test-spezifische Metriken */
  metrics?: {
    [key: string]: any;
  };

  /** Assertions */
  assertions?: {
    name: string;
    passed: boolean;
    expected?: any;
    actual?: any;
  }[];
}

// ============================================================================
// Report Types
// ============================================================================

/**
 * Vollständiger Report für Präsentation
 */
export interface UnifiedTestReport {
  metadata: TestRunMetadata;
  summary: TestRunSummary;
  findings: TestRunFindings;
  results: IndividualTestResult[];
}

// ============================================================================
// Factories & Helpers
// ============================================================================

/**
 * Erzeugt eine neue Run-ID
 */
export function generateRunId(): RunId {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

  return `${year}${month}${date}_${hours}${minutes}${seconds}_${random}`;
}

/**
 * Berechnet Pass Rate
 */
export function calculatePassRate(stats: { passed: number; total: number }): number {
  if (stats.total === 0) return 0;
  return Math.round((stats.passed / stats.total) * 10000) / 100; // 2 Dezimalstellen
}

/**
 * Bestimmt den Status basierend auf Ergebnissen
 */
export function determineStatus(
  passRate: number,
  criticalFailures: number,
  highFailures: number
): 'PASS' | 'FAIL' | 'DEGRADED' | 'ERROR' {
  if (criticalFailures > 0) return 'FAIL';
  if (passRate === 100) return 'PASS';
  if (passRate >= 95 && highFailures === 0) return 'PASS';
  if (passRate >= 90) return 'DEGRADED';
  return 'FAIL';
}

/**
 * Standardisiert einen Test-Fehler zu einem Finding
 */
export function createFinding(
  testId: string,
  category: string,
  severity: Severity,
  title: string,
  description: string,
  impact: string,
  recommendation: string,
  context: any = {},
  stackTrace?: string,
  rootCause?: { category: string; description: string; confidence: number }
): Partial<TestFinding> {
  return {
    testId,
    category,
    severity,
    title,
    description,
    impact,
    recommendation,
    context,
    stackTrace,
    rootCause,
    timestamp: new Date().toISOString(),
    occurrenceCount: 1
  };
}

/**
 * Findet oder erstellt eine Fehlergruppe
 */
export function groupErrorsByType(findings: TestFinding[]): { [type: string]: TestFinding[] } {
  const grouped: { [type: string]: TestFinding[] } = {};

  findings.forEach(finding => {
    const key = finding.type;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(finding);
  });

  return grouped;
}

/**
 * Vorbereitung für spätere Extraction Tests
 */
export interface ExtractionTestResultExtension {
  /** Zusätzliche Metriken für Extraction */
  extractionMetrics?: {
    documentsProcessed: number;
    fieldsExtracted: number;
    accuracy?: number;
    recall?: number;
    precision?: number;
  };

  /** Extraction-spezifische Kontextdaten */
  extractionContext?: {
    schemaUsed: string;
    rulesApplied: number;
    transformationsApplied: number;
  };
}

/**
 * Erweiterte Test Result für Extraction Tests
 */
export type ExtendedIndividualTestResult = IndividualTestResult & ExtractionTestResultExtension;
