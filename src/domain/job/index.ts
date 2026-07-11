/**
 * Job Domain Layer - Index/Barrel Export
 *
 * Zentraler Export aller Job-Domain Modelle
 *
 * @version 0.22.0
 * @phase 22 - Job-Based Architecture
 */

// Value Objects & Enums
export { JobId } from './JobId';
export {
  JobStatus,
  DocumentType,
  JobSource,
  JobSchema,
  JobExample,
  JobOptions,
  JobSourceFactory,
  JobSchemaFactory,
  JobExampleFactory,
  JobOptionsFactory,
  DEFAULT_JOB_OPTIONS,
} from './JobValueObjects';

// Aggregate Root
export { Job } from './Job';

// DTOs
export type {
  RuntimeJob,
  CreateJobRequest,
  UpdateJobRequest,
  JobResponse,
  JobListResponse,
} from './RuntimeJob';

// Errors
export {
  JobError,
  JobValidationError,
  JobNotFoundError,
  JobStatusError,
  JobDirectoryError,
  JobPersistenceError,
  JobDirectoryValidationError,
  JobSourceError,
  isJobError,
} from './JobErrors';
