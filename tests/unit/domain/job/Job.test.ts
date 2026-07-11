/**
 * Job Domain Models - Unit Tests
 *
 * Test Coverage:
 * - JobId Value Object
 * - Job Aggregate Root
 * - Invariant-Validierung
 * - Status-Übergänge
 * - Error-Handling
 *
 * @version 0.22.0
 * @phase 22 - Job-Based Architecture
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  JobId,
  Job,
  JobStatus,
  DocumentType,
  JobSourceFactory,
  JobSchemaFactory,
  JobExampleFactory,
  JobOptionsFactory,
  JobValidationError,
  JobStatusError,
  JobDirectoryValidationError,
} from '@domain/job';

describe('Job Domain Models', () => {
  // ==================== JobId Tests ====================

  describe('JobId Value Object', () => {
    it('should create JobId with UUID format', () => {
      const jobId = JobId.create();
      expect(jobId.toString()).toMatch(/^JOB-[A-Z0-9]{4,}$/);
    });

    it('should create JobId with index format', () => {
      const jobId = JobId.createWithIndex(5);
      expect(jobId.toString()).toBe('JOB-0005');

      const jobId2 = JobId.createWithIndex(1234);
      expect(jobId2.toString()).toBe('JOB-1234');
    });

    it('should validate JobId format', () => {
      expect(JobId.isValid('JOB-ABC1')).toBe(true);
      expect(JobId.isValid('JOB-0001')).toBe(true);
      expect(JobId.isValid('job-abc1')).toBe(false);
      expect(JobId.isValid('INVALID')).toBe(false);
      expect(JobId.isValid('JOB-')).toBe(false);
    });

    it('should reconstruct JobId from string', () => {
      const jobId = JobId.fromString('JOB-TEST');
      expect(jobId.toString()).toBe('JOB-TEST');
    });

    it('should throw on invalid JobId format', () => {
      expect(() => JobId.fromString('invalid')).toThrow(
        'Invalid JobId format: invalid'
      );
    });

    it('should compare JobId for equality', () => {
      const jobId1 = JobId.fromString('JOB-TEST');
      const jobId2 = JobId.fromString('JOB-TEST');
      const jobId3 = JobId.fromString('JOB-OTHER');

      expect(jobId1.equals(jobId2)).toBe(true);
      expect(jobId1.equals(jobId3)).toBe(false);
    });

    it('should be usable in Map/Set', () => {
      const jobId1 = JobId.fromString('JOB-001');
      const jobId2 = JobId.fromString('JOB-001');
      const set = new Set<string>();
      set.add(jobId1.hash);
      set.add(jobId2.hash);
      expect(set.size).toBe(1); // Same hash
    });
  });

  // ==================== Job Aggregate Tests ====================

  describe('Job Aggregate Root', () => {
    let validProps: {
      documentType: DocumentType;
      sources: ReturnType<typeof JobSourceFactory.create>[];
      schema: ReturnType<typeof JobSchemaFactory.create>;
      examples: ReturnType<typeof JobExampleFactory.create>[];
      options?: Partial<Record<string, unknown>>;
    };

    beforeEach(() => {
      validProps = {
        documentType: DocumentType.PDF,
        sources: [
          JobSourceFactory.create({
            filePath: 'invoice.pdf',
            mimeType: 'application/pdf',
            hash: 'abc123',
            sizeBytes: 102400,
          }),
        ],
        schema: JobSchemaFactory.create({
          schemaId: 'schema-1',
          schemaName: 'invoice-v1.0',
          schemaPath: 'schema/invoice.json',
          version: '1.0.0',
          fieldsCount: 5,
        }),
        examples: [
          JobExampleFactory.create({
            exampleName: 'invoice-example',
            examplePath: 'examples/invoice-1.json',
            associatedRules: [],
          }),
        ],
      };
    });

    it('should create new Job', () => {
      const job = Job.create(validProps);
      expect(job.getJobId()).toBeDefined();
      expect(job.getStatus()).toBe(JobStatus.QUEUED);
      expect(job.getDocumentType()).toBe(DocumentType.PDF);
      expect(job.getSources().length).toBe(1);
    });

    it('should throw when creating Job without sources', () => {
      expect(() =>
        Job.create({
          ...validProps,
          sources: [],
        })
      ).toThrow('Job must have at least one source');
    });

    it('should apply default options when creating Job', () => {
      const job = Job.create(validProps);
      const options = job.getOptions();
      expect(options.enableHallucinationCheck).toBe(true);
      expect(options.confidenceThreshold).toBe(0.8);
      expect(options.maxRetries).toBe(3);
    });

    it('should override default options', () => {
      const job = Job.create({
        ...validProps,
        options: {
          confidenceThreshold: 0.95,
          maxRetries: 5,
        },
      });
      const options = job.getOptions();
      expect(options.confidenceThreshold).toBe(0.95);
      expect(options.maxRetries).toBe(5);
      expect(options.enableHallucinationCheck).toBe(true); // Still default
    });

    it('should transition status: QUEUED -> RUNNING', () => {
      const job = Job.create(validProps);
      expect(job.getStatus()).toBe(JobStatus.QUEUED);

      job.startProcessing();
      expect(job.getStatus()).toBe(JobStatus.RUNNING);
    });

    it('should transition status: RUNNING -> COMPLETED', () => {
      const job = Job.create(validProps);
      job.startProcessing();
      job.markCompleted();
      expect(job.getStatus()).toBe(JobStatus.COMPLETED);
      expect(job.getCompletedAt()).toBeDefined();
    });

    it('should transition status: RUNNING -> FAILED', () => {
      const job = Job.create(validProps);
      job.startProcessing();
      job.markFailed('Test failure');
      expect(job.getStatus()).toBe(JobStatus.FAILED);
      expect(job.getFailureReason()).toBe('Test failure');
    });

    it('should throw on invalid status transition', () => {
      const job = Job.create(validProps);
      job.startProcessing();
      job.markCompleted();

      expect(() => job.startProcessing()).toThrow();
      expect(() => job.markFailed('error')).toThrow();
    });

    it('should not allow marking failed job as completed', () => {
      const job = Job.create(validProps);
      job.startProcessing();
      job.markFailed('reason');
      expect(() => job.markCompleted()).toThrow();
    });

    it('should support cancel', () => {
      const job = Job.create(validProps);
      job.cancel();
      expect(job.getStatus()).toBe(JobStatus.CANCELLED);
    });

    it('should not allow cancel on completed job', () => {
      const job = Job.create(validProps);
      job.startProcessing();
      job.markCompleted();
      expect(() => job.cancel()).toThrow();
    });

    it('should support metadata', () => {
      const job = Job.create(validProps);
      job.setMetadata('user', 'john@example.com');
      job.setMetadata('department', 'sales');

      expect(job.getMetadata('user')).toBe('john@example.com');
      expect(job.getMetadata('department')).toBe('sales');
    });

    it('should restore Job from persistent data', () => {
      const now = new Date().toISOString();
      const job = Job.restore({
        jobId: 'JOB-0001',
        documentType: 'pdf',
        status: 'running',
        sources: validProps.sources,
        schema: validProps.schema,
        examples: validProps.examples,
        options: JobOptionsFactory.create(),
        createdAt: now,
        updatedAt: now,
      });

      expect(job.getJobId().toString()).toBe('JOB-0001');
      expect(job.getStatus()).toBe(JobStatus.RUNNING);
      expect(job.getDocumentType()).toBe(DocumentType.PDF);
    });

    it('should convert to DTO', () => {
      const job = Job.create(validProps);
      const dto = job.toDTO();

      expect(dto.jobId).toMatch(/^JOB-/);
      expect(dto.documentType).toBe('pdf');
      expect(dto.status).toBe('queued');
      expect(dto.sources.length).toBe(1);
      expect(dto.options.confidenceThreshold).toBe(0.8);
    });

    it('should check isCompleted()', () => {
      const job = Job.create(validProps);
      expect(job.isCompleted()).toBe(false);

      job.startProcessing();
      job.markCompleted();
      expect(job.isCompleted()).toBe(true);
    });

    it('should check isFailed()', () => {
      const job = Job.create(validProps);
      expect(job.isFailed()).toBe(false);

      job.startProcessing();
      job.markFailed('error');
      expect(job.isFailed()).toBe(true);
    });

    it('should check isProcessable()', () => {
      const job = Job.create(validProps);
      expect(job.isProcessable()).toBe(true);

      job.startProcessing();
      expect(job.isProcessable()).toBe(true);

      job.markCompleted();
      expect(job.isProcessable()).toBe(false);
    });

    it('should maintain immutable sources array', () => {
      const job = Job.create(validProps);
      const sources = job.getSources();
      expect(() => {
        // @ts-ignore - Testing immutability
        sources.push({});
      }).toThrow();
    });
  });

  // ==================== Error Tests ====================

  describe('Error Handling', () => {
    it('should serialize JobValidationError to JSON', () => {
      const error = new JobValidationError('Validation failed', {
        confidenceThreshold: [
          'must be between 0 and 1',
        ],
      });

      const json = error.toJSON();
      expect(json.code).toBe('JOB_VALIDATION_ERROR');
      expect(json.details.confidenceThreshold[0]).toContain('between 0 and 1');
    });

    it('should create JobNotFoundError', () => {
      const error = new JobNotFoundError('JOB-0001');
      expect(error.code).toBe('JOB_NOT_FOUND');
      expect(error.jobId).toBe('JOB-0001');
      expect(error.statusCode).toBe(404);
    });

    it('should create JobStatusError', () => {
      const error = new JobStatusError('JOB-0001', 'completed', 'cancel');
      expect(error.code).toBe('JOB_INVALID_STATUS');
      expect(error.currentStatus).toBe('completed');
      expect(error.operation).toBe('cancel');
    });

    it('should create JobDirectoryValidationError', () => {
      const error = new JobDirectoryValidationError(
        '/jobs/JOB-0001',
        ['logs/', 'output/'],
        ['schema/invalid.json']
      );
      expect(error.code).toBe('JOB_DIRECTORY_VALIDATION_ERROR');
      expect(error.missingItems).toContain('logs/');
      expect(error.invalidItems).toContain('schema/invalid.json');
    });
  });
});
