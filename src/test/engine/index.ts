/**
 * Test Engine Module Exports - Phase 38
 * 
 * Zentrale Exports für alle Test-Engine Komponenten.
 */

// ============================================================================
// Models
// ============================================================================
export {
  // Types
  type RunId,
  type TestExecutionId,
  type TestRunMetadata,
  type TestRunSummary,
  type TestFinding,
  type TestRunFindings,
  type IndividualTestResult,
  type UnifiedTestReport,
  type ExtractionTestResultExtension,
  type ExtendedIndividualTestResult,

  // Functions
  generateRunId,
  calculatePassRate,
  determineStatus,
  createFinding,
  groupErrorsByType
} from '../models/TestResultModel';

// ============================================================================
// Engine
// ============================================================================
export {
  // Severity
  type SeverityRule,
  SeverityEngine,
  severityEngine,
  STANDARD_SEVERITY_RULES
} from './SeverityEngine';

export {
  // Formatter
  MetadataBuilder,
  SummaryBuilder,
  FindingsBuilder,
  convertErrorToFinding
} from './TestResultFormatter';

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick Factory für einen Test Run
 */
export async function createTestRun(runId?: string) {
  const { MetadataBuilder, SummaryBuilder, FindingsBuilder } = await import('./TestResultFormatter.js');
  return {
    metadata: new MetadataBuilder(),
    summary: new SummaryBuilder(runId),
    findings: new FindingsBuilder(runId)
  };
}
