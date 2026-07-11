import { injectable, inject } from 'tsyringe';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { JobLoaderService } from '@infrastructure/services/JobLoaderService';
import { SchemaLoaderService } from '@infrastructure/services/SchemaLoaderService';
import { ExampleAnalysisService } from '@infrastructure/services/ExampleAnalysisService';
import {
  ExecutionReport,
  ExecutionReportFactory,
} from '@domain/orchestration/ExecutionReport';
import { RuntimeJob } from '@domain/job/RuntimeJob';

/**
 * JobOrchestrator - Orchestrates job processing pipeline
 *
 * Workflow:
 * 1. Load job configuration
 * 2. Load and validate schema
 * 3. Analyze example files
 * 4. Validate sources
 * 5. Create RuntimeJob
 *
 * Generates execution-report.json with detailed metrics
 */
@injectable()
export class JobOrchestrator {
  constructor(
    @inject(JobLoaderService)
    private readonly jobLoader: JobLoaderService,
    @inject(SchemaLoaderService)
    private readonly schemaLoader: SchemaLoaderService,
    @inject(ExampleAnalysisService)
    private readonly exampleAnalysis: ExampleAnalysisService
  ) {}

  /**
   * Execute complete job orchestration workflow
   *
   * @param jobsBasePath Path to jobs directory
   * @param jobId Job ID to process
   * @param schemasBasePath Path to schemas directory
   * @param examplesBasePath Path to examples directory
   * @param reportOutputPath Path to write execution report
   * @returns RuntimeJob if successful
   */
  async orchestrateJob(
    jobsBasePath: string,
    jobId: string,
    schemasBasePath: string,
    examplesBasePath: string,
    reportOutputPath: string
  ): Promise<{ runtimeJob: RuntimeJob | null; report: ExecutionReport }> {
    const report = ExecutionReportFactory.createEmpty(jobId);
    let runtimeJob: RuntimeJob | null = null;

    // ========================================================================
    // Input Validation
    // ========================================================================
    const inputErrors: string[] = [];

    if (!jobsBasePath || typeof jobsBasePath !== 'string') {
      inputErrors.push('jobsBasePath is required and must be a non-empty string');
    }
    if (!jobId || typeof jobId !== 'string') {
      inputErrors.push('jobId is required and must be a non-empty string');
    }
    if (!schemasBasePath || typeof schemasBasePath !== 'string') {
      inputErrors.push('schemasBasePath is required and must be a non-empty string');
    }
    if (!examplesBasePath || typeof examplesBasePath !== 'string') {
      inputErrors.push('examplesBasePath is required and must be a non-empty string');
    }
    if (!reportOutputPath || typeof reportOutputPath !== 'string') {
      inputErrors.push('reportOutputPath is required and must be a non-empty string');
    }

    if (inputErrors.length > 0) {
      ExecutionReportFactory.addError(report, {
        code: 'INVALID_INPUT',
        message: `Input validation failed: ${inputErrors.join('; ')}`,
        stage: 'job-loading',
        timestamp: new Date().toISOString(),
      });
      await this.writeReport(report, reportOutputPath);
      return { runtimeJob: null, report };
    }

    try {
      // ========================================================================
      // Stage 1: Load Job
      // ========================================================================
      try {
        const loadStartTime = Date.now();

        runtimeJob = await this.jobLoader.loadJob(jobsBasePath, jobId);

        const loadEndTime = Date.now();
        report.result.jobLoaded = true;

        ExecutionReportFactory.addValidation(report, {
          name: 'Job Loading',
          status: 'passed',
          message: `Job ${jobId} loaded successfully`,
          details: {
            documentType: runtimeJob.documentType,
            sourceCount: runtimeJob.sources.length,
            loadTime: `${loadEndTime - loadStartTime}ms`,
          },
        });
      } catch (err) {
        ExecutionReportFactory.addError(report, {
          code: 'JOB_LOAD_FAILED',
          message: `Failed to load job: ${(err as Error).message}`,
          stage: 'job-loading',
          timestamp: new Date().toISOString(),
        });
        throw err;
      }

      // ========================================================================
      // Stage 2: Load and Validate Schema
      // ========================================================================
      if (!runtimeJob) {
        throw new Error('RuntimeJob is null');
      }

      let schema;
      try {
        const schemaLoadStartTime = Date.now();

        schema = await this.schemaLoader.loadSchema(
          schemasBasePath,
          runtimeJob.schema.schemaName
        );

        const schemaLoadEndTime = Date.now();
        report.result.schemaLoaded = true;

        report.metadata.schemaName = schema.schemaName;
        report.metadata.schemaVersion = schema.schemaVersion;
        report.statistics.schemaFieldCount = schema.totalFields;
        report.statistics.requiredFieldCount = schema.requiredFieldCount;

        ExecutionReportFactory.addValidation(report, {
          name: 'Schema Loading',
          status: 'passed',
          message: `Schema ${runtimeJob.schema.schemaName} loaded successfully`,
          details: {
            totalFields: schema.totalFields,
            requiredFields: schema.requiredFieldCount,
            loadTime: `${schemaLoadEndTime - schemaLoadStartTime}ms`,
          },
        });

        // Validate schema has required fields
        if (schema.totalFields === 0) {
          ExecutionReportFactory.addWarning(report, {
            code: 'EMPTY_SCHEMA',
            message: 'Schema has no fields defined',
            stage: 'schema-loading',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        ExecutionReportFactory.addError(report, {
          code: 'SCHEMA_LOAD_FAILED',
          message: `Failed to load schema: ${(err as Error).message}`,
          stage: 'schema-loading',
          timestamp: new Date().toISOString(),
        });
        throw err;
      }

      // ========================================================================
      // Stage 3: Analyze Example Files (Graceful Degradation - Optional)
      // ========================================================================
      let extractionHints;
      try {
        const analysisStartTime = Date.now();

        extractionHints = await this.exampleAnalysis.analyzeExamples(
          examplesBasePath,
          schema
        );

        const analysisEndTime = Date.now();
        report.result.examplesAnalyzed = true;
        report.statistics.exampleAnalysisTime = analysisEndTime - analysisStartTime;
        report.metadata.exampleCount = extractionHints.totalExamples;

        ExecutionReportFactory.addValidation(report, {
          name: 'Example Analysis',
          status: 'passed',
          message: `Analyzed examples successfully`,
          details: {
            totalExamples: extractionHints.totalExamples,
            hintsGenerated: extractionHints.hints.length,
            analysisTime: `${report.statistics.exampleAnalysisTime}ms`,
          },
        });
      } catch (err) {
        // Graceful degradation: Example analysis is optional
        const errorMsg = (err as Error).message;
        
        // Only add warning, not error - examples are optional
        ExecutionReportFactory.addWarning(report, {
          code: 'EXAMPLE_ANALYSIS_FAILED',
          message: `Example analysis failed (optional): ${errorMsg}`,
          stage: 'example-analysis',
          timestamp: new Date().toISOString(),
          details: { reason: errorMsg }
        });

        // Mark as analyzed anyway (with 0 examples)
        report.result.examplesAnalyzed = true;
        report.metadata.exampleCount = 0;

        ExecutionReportFactory.addValidation(report, {
          name: 'Example Analysis',
          status: 'warning',
          message: `No examples available (not critical)`,
          details: { reason: errorMsg }
        });
      }

      // ========================================================================
      // Stage 4: Validate Sources
      // ========================================================================
      try {
        this.validateSources(runtimeJob, report);
        report.result.sourcesValidated = true;

        ExecutionReportFactory.addValidation(report, {
          name: 'Source Validation',
          status: 'passed',
          message: `All ${runtimeJob.sources.length} source(s) validated successfully`,
          details: {
            sourceCount: runtimeJob.sources.length,
            totalSizeBytes: runtimeJob.sources.reduce((sum, s) => sum + s.sizeBytes, 0),
          },
        });
      } catch (err) {
        ExecutionReportFactory.addError(report, {
          code: 'SOURCE_VALIDATION_FAILED',
          message: `Source validation failed: ${(err as Error).message}`,
          stage: 'source-validation',
          timestamp: new Date().toISOString(),
        });
        throw err;
      }

      // ========================================================================
      // Stage 5: Create RuntimeJob (already created, just mark as complete)
      // ========================================================================
      report.result.runtimeJobCreated = true;
      report.metadata.documentType = runtimeJob.documentType;
      report.metadata.sourceCount = runtimeJob.sources.length;

      ExecutionReportFactory.addValidation(report, {
        name: 'RuntimeJob Creation',
        status: 'passed',
        message: 'RuntimeJob created successfully',
        details: {
          jobId: runtimeJob.jobId,
          status: runtimeJob.status,
        },
      });
    } catch (err) {
      ExecutionReportFactory.addError(report, {
        code: 'ORCHESTRATION_FAILED',
        message: `Orchestration failed: ${(err as Error).message}`,
        stage: 'runtime-job-creation',
        timestamp: new Date().toISOString(),
      });
    }

    // ========================================================================
    // Finalize Report
    // ========================================================================
    ExecutionReportFactory.finalize(report);

    // ========================================================================
    // Write Report to File
    // ========================================================================
    try {
      await this.writeReport(report, reportOutputPath);
    } catch (writeErr) {
      console.error('Failed to write execution report:', writeErr);
    }

    return { runtimeJob, report };
  }

  /**
   * Validate job sources with detailed error reporting
   */
  private validateSources(runtimeJob: RuntimeJob, report: ExecutionReport): void {
    if (runtimeJob.sources.length === 0) {
      throw new Error(
        'Job must have at least one source. Received empty sources array.'
      );
    }

    for (const source of runtimeJob.sources) {
      // Validate source structure with detailed messages
      if (!source.sourceId || source.sourceId.length === 0) {
        throw new Error(
          `Source validation failed: missing sourceId field. ` +
            `Each source must have a unique identifier.`
        );
      }

      if (!source.filePath || source.filePath.length === 0) {
        throw new Error(
          `Source '${source.sourceId}' validation failed: missing filePath. ` +
            `Each source must reference a file path.`
        );
      }

      if (!source.mimeType || source.mimeType.length === 0) {
        throw new Error(
          `Source '${source.sourceId}' validation failed: missing mimeType. ` +
            `MIME type is required (e.g., application/pdf, image/png).`
        );
      }

      if (!source.hash || source.hash.length === 0) {
        throw new Error(
          `Source '${source.sourceId}' validation failed: missing hash. ` +
            `Hash is required for file integrity verification.`
        );
      }

      if (source.sizeBytes <= 0) {
        ExecutionReportFactory.addWarning(report, {
          code: 'INVALID_SOURCE_SIZE',
          message: `Source '${source.sourceId}' has invalid size: ${source.sizeBytes} bytes. ` +
            `Expected positive integer.`,
          stage: 'source-validation',
          timestamp: new Date().toISOString(),
          details: { sourceId: source.sourceId, sizeBytes: source.sizeBytes }
        });
      }

      // Validate MIME type format (must contain /)
      if (!source.mimeType.includes('/')) {
        throw new Error(
          `Source '${source.sourceId}' validation failed: invalid MIME type format: '${source.mimeType}'. ` +
            `Expected format: 'type/subtype' (e.g., 'application/pdf', 'image/png', 'text/plain').`
        );
      }

      // Additional MIME type validation
      const [type, subtype] = source.mimeType.split('/');
      if (!type || !subtype || type.length === 0 || subtype.length === 0) {
        throw new Error(
          `Source '${source.sourceId}' validation failed: invalid MIME type components. ` +
            `Received: '${source.mimeType}'. Format should be 'type/subtype'.`
        );
      }
    }
  }

  /**
   * Write execution report to file
   */
  private async writeReport(
    report: ExecutionReport,
    reportOutputPath: string
  ): Promise<void> {
    const reportJson = JSON.stringify(report, null, 2);
    await writeFile(reportOutputPath, reportJson, 'utf-8');
  }

  /**
   * Get report path for job
   */
  getReportPath(jobsBasePath: string, jobId: string): string {
    return join(jobsBasePath, `${jobId}-execution-report.json`);
  }
}
