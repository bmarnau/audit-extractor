/**
 * ExecutionReport - DTOs for orchestration reporting
 *
 * Strukturiert Reports mit Validierungen, Fehlern, Warnungen und Statistiken
 */

/**
 * Validation result for a single validation check
 */
export interface ValidationResult {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Statistics from execution
 */
export interface ExecutionStatistics {
  totalValidations: number;
  passedValidations: number;
  failedValidations: number;
  warningValidations: number;
  schemaFieldCount: number;
  requiredFieldCount: number;
  sourceCount: number;
  exampleAnalysisTime: number; // milliseconds
  totalExecutionTime: number; // milliseconds
}

/**
 * Error details in execution
 */
export interface ExecutionError {
  code: string;
  message: string;
  stage: 'job-loading' | 'schema-loading' | 'example-analysis' | 'source-validation' | 'runtime-job-creation';
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Warning details in execution
 */
export interface ExecutionWarning {
  code: string;
  message: string;
  stage: 'job-loading' | 'schema-loading' | 'example-analysis' | 'source-validation' | 'runtime-job-creation';
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Complete execution report
 */
export interface ExecutionReport {
  // Identifiers
  reportId: string;
  jobId: string;

  // Timing
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  durationMs: number;

  // Status
  status: 'success' | 'partial-success' | 'failure';
  completionPercentage: number; // 0-100

  // Validations
  validations: ValidationResult[];

  // Errors and warnings
  errors: ExecutionError[];
  warnings: ExecutionWarning[];

  // Statistics
  statistics: ExecutionStatistics;

  // Metadata about loaded resources
  metadata: {
    schemaName?: string;
    schemaVersion?: string;
    documentType?: string;
    exampleCount?: number;
    sourceCount?: number;
  };

  // Final result references
  result: {
    jobLoaded: boolean;
    schemaLoaded: boolean;
    examplesAnalyzed: boolean;
    sourcesValidated: boolean;
    runtimeJobCreated: boolean;
  };
}

/**
 * Factory for creating empty execution reports
 */
export class ExecutionReportFactory {
  static createEmpty(jobId: string): ExecutionReport {
    return {
      reportId: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      jobId,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      durationMs: 0,
      status: 'success',
      completionPercentage: 0,
      validations: [],
      errors: [],
      warnings: [],
      statistics: {
        totalValidations: 0,
        passedValidations: 0,
        failedValidations: 0,
        warningValidations: 0,
        schemaFieldCount: 0,
        requiredFieldCount: 0,
        sourceCount: 0,
        exampleAnalysisTime: 0,
        totalExecutionTime: 0,
      },
      metadata: {},
      result: {
        jobLoaded: false,
        schemaLoaded: false,
        examplesAnalyzed: false,
        sourcesValidated: false,
        runtimeJobCreated: false,
      },
    };
  }

  static addValidation(
    report: ExecutionReport,
    validation: ValidationResult
  ): void {
    report.validations.push(validation);
    report.statistics.totalValidations += 1;

    if (validation.status === 'passed') {
      report.statistics.passedValidations += 1;
    } else if (validation.status === 'failed') {
      report.statistics.failedValidations += 1;
    } else if (validation.status === 'warning') {
      report.statistics.warningValidations += 1;
    }
  }

  static addError(report: ExecutionReport, error: ExecutionError): void {
    report.errors.push(error);
  }

  static addWarning(report: ExecutionReport, warning: ExecutionWarning): void {
    report.warnings.push(warning);
  }

  static finalize(report: ExecutionReport): void {
    const endTime = new Date();
    const startTime = new Date(report.startTime);

    report.endTime = endTime.toISOString();
    report.durationMs = endTime.getTime() - startTime.getTime();
    report.statistics.totalExecutionTime = report.durationMs;

    // Determine overall status
    if (report.errors.length > 0) {
      report.status = 'failure';
      report.completionPercentage = 0;
    } else if (report.warnings.length > 0) {
      report.status = 'partial-success';
      report.completionPercentage = 75;
    } else {
      report.status = 'success';
      report.completionPercentage = 100;
    }

    // Update completion percentage based on result flags
    const resultCount = Object.values(report.result).filter((v) => v).length;
    report.completionPercentage = (resultCount / 5) * 100;
  }
}
