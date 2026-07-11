import { readFile } from 'fs/promises';
import { join } from 'path';
import { injectable } from 'tsyringe';
import { RuntimeJob } from '@domain/job/RuntimeJob';
import {
  JobValidationError,
  JobNotFoundError,
  JobPersistenceError,
} from '@domain/job/JobErrors';
import { JobId } from '@domain/job/JobId';

/**
 * Service to load and validate job.json files from disk
 * Converts file content to RuntimeJob domain objects
 * Validates all required fields and references
 */
@injectable()
export class JobLoaderService {
  /**
   * Load and validate a job.json file
   * @param jobsBasePath Base path to jobs directory (e.g., "jobs")
   * @param jobId Job identifier (e.g., "JOB-0001")
   * @returns RuntimeJob with validated data
   * @throws JobNotFoundError if file doesn't exist
   * @throws JobValidationError if validation fails
   * @throws JobPersistenceError if file read fails
   */
  async loadJob(jobsBasePath: string, jobId: string): Promise<RuntimeJob> {
    // Validate JobId format
    if (!JobId.isValid(jobId)) {
      throw new JobValidationError(
        `Invalid JobId format: ${jobId}. Expected format: JOB-XXXX`,
        { jobId: ['Invalid format'] }
      );
    }

    const jobFilePath = join(jobsBasePath, jobId, 'job.json');
    let fileContent: string;

    // Load file
    try {
      fileContent = await readFile(jobFilePath, 'utf-8');
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new JobNotFoundError(jobId);
        }
      }
      const err = error instanceof Error ? error : new Error(String(error));
      throw new JobPersistenceError('load job file', jobId, err);
    }

    // Parse JSON
    let jobData: unknown;
    try {
      jobData = JSON.parse(fileContent);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new JobPersistenceError('parse job JSON', jobId, err);
    }

    // Validate structure
    const runtimeJob = this.validateAndCreateRuntimeJob(jobData, jobId);

    return runtimeJob;
  }

  /**
   * Validate job data and create RuntimeJob instance
   * @param data Parsed JSON data
   * @param jobId Expected job ID for validation
   * @returns Valid RuntimeJob
   * @throws JobValidationError if validation fails
   */
  private validateAndCreateRuntimeJob(
    data: unknown,
    jobId: string
  ): RuntimeJob {
    // Type guard: must be object
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new JobValidationError('Job data must be a valid object', {
        receivedType: [typeof data],
      });
    }

    const jobObj = data as Record<string, unknown>;
    const errors: Record<string, string[]> = {};

    // Validate jobId
    if (!jobObj.jobId || typeof jobObj.jobId !== 'string') {
      errors.jobId = ['Missing or invalid jobId field'];
    } else if (jobObj.jobId !== jobId) {
      errors.jobId = [
        `JobId mismatch: file contains ${jobObj.jobId}, expected ${jobId}`,
      ];
    }

    // Validate documentType
    if (!jobObj.documentType || typeof jobObj.documentType !== 'string') {
      errors.documentType = ['Missing or invalid documentType field'];
    }

    // Validate schema exists
    if (!jobObj.schema || typeof jobObj.schema !== 'object') {
      errors.schema = ['Missing or invalid schema field'];
    }

    // Validate at least one source
    if (!Array.isArray(jobObj.sources) || jobObj.sources.length === 0) {
      errors.sources = ['At least one source file is required'];
    }

    // If errors exist, throw
    if (Object.keys(errors).length > 0) {
      throw new JobValidationError(
        'Job validation failed: required fields missing or invalid',
        errors
      );
    }

    // All validations passed, return typed RuntimeJob
    return jobObj as unknown as RuntimeJob;
  }

  /**
   * Load multiple jobs from a list of job IDs
   * @param jobsBasePath Base path to jobs directory
   * @param jobIds Array of job IDs to load
   * @returns Array of RuntimeJobs (failed loads are skipped with error logging)
   */
  async loadJobs(jobsBasePath: string, jobIds: string[]): Promise<RuntimeJob[]> {
    const loadedJobs: RuntimeJob[] = [];
    const failedLoads: Array<{ jobId: string; error: Error }> = [];

    for (const jobId of jobIds) {
      try {
        const job = await this.loadJob(jobsBasePath, jobId);
        loadedJobs.push(job);
      } catch (error) {
        failedLoads.push({
          jobId,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }

    // If all loads failed, throw error with summary
    if (loadedJobs.length === 0 && failedLoads.length > 0) {
      const failedJobIds = failedLoads.map((f) => f.jobId);
      const firstError = failedLoads[0].error;
      throw new JobPersistenceError(
        'load multiple jobs',
        failedJobIds[0],
        firstError
      );
    }

    return loadedJobs;
  }
}
