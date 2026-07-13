/**
 * Testing Infrastructure Module
 * 
 * Exports:
 * - ComprehensiveTestExecutor (core executor)
 * - ComprehensiveTestRunner (orchestrator)
 * - All related types and interfaces
 */

export {
  TestResult,
  TestStatus,
  TestType,
  ComponentType,
  Severity,
  ComponentTestResults,
  TestExecutionReport,
  TestSeverityClassifier,
  TestResultAggregator,
  CompactReportGenerator,
} from './ComprehensiveTestExecutor';

export { ComprehensiveTestRunner, JestTestResult, JestTestFileResult } from './ComprehensiveTestRunner';
