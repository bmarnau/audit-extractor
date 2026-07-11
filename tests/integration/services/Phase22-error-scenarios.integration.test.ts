/**
 * Phase 22: Comprehensive Error Scenario Testing
 *
 * Tests for error handling, edge cases, and resilience
 * Validates graceful degradation and recovery mechanisms
 *
 * @version 0.22.0
 * @phase 22 - Job-Based Architecture with Error Resilience
 */

import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { container } from 'tsyringe';
import { join } from 'path';
import { writeFile, mkdir, rm } from 'fs/promises';
import { initializeServiceContainer } from '@infrastructure/di/ServiceContainer';
import { JobOrchestrator } from '@application/orchestration/JobOrchestrator';

describe('Phase 22: Error Scenario Resilience Tests', () => {
  let orchestrator: JobOrchestrator;
  let tempJobsDir: string;
  let tempSchemasDir: string;
  let tempExamplesDir: string;
  let tempOutputDir: string;

  beforeAll(async () => {
    // Initialize DI
    initializeServiceContainer();
    orchestrator = container.resolve(JobOrchestrator);

    // Setup temp directories
    const baseTemp = join(__dirname, '../../fixtures/temp-error-tests');
    tempJobsDir = join(baseTemp, 'jobs');
    tempSchemasDir = join(baseTemp, 'schemas');
    tempExamplesDir = join(baseTemp, 'examples');
    tempOutputDir = join(baseTemp, 'output');

    await mkdir(tempJobsDir, { recursive: true });
    await mkdir(tempSchemasDir, { recursive: true });
    await mkdir(tempExamplesDir, { recursive: true });
    await mkdir(tempOutputDir, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup
    try {
      const baseTemp = join(__dirname, '../../fixtures/temp-error-tests');
      await rm(baseTemp, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('Stage 1: Job Loading - Error Scenarios', () => {
    it('should handle missing job file gracefully', async () => {
      const jobId = 'JOB-MISSING-0001';
      const reportPath = join(tempOutputDir, `${jobId}-missing-file.json`);

      const { report } = await orchestrator.orchestrateJob(
        tempJobsDir,
        jobId,
        tempSchemasDir,
        tempExamplesDir,
        reportPath
      );

      expect(report.status).toBe('failure');
      expect(report.result.jobLoaded).toBe(false);
      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.errors[0].code).toBe('JOB_LOAD_FAILED');
      expect(report.errors[0].message).toContain('Job not found');
    });

    it('should handle invalid JSON in job file', async () => {
      const jobId = 'JOB-INVALID-JSON';
      const jobDir = join(tempJobsDir, jobId);
      await mkdir(jobDir, { recursive: true });

      // Write invalid JSON
      await writeFile(
        join(jobDir, 'job.json'),
        '{invalid json content without closing bracket'
      );

      const reportPath = join(tempOutputDir, `${jobId}-invalid-json.json`);

      const { report } = await orchestrator.orchestrateJob(
        tempJobsDir,
        jobId,
        tempSchemasDir,
        tempExamplesDir,
        reportPath
      );

      expect(report.status).toBe('failure');
      expect(report.result.jobLoaded).toBe(false);
      expect(report.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing required job fields', async () => {
      const jobId = 'JOB-MISSING-FIELDS';
      const jobDir = join(tempJobsDir, jobId);
      await mkdir(jobDir, { recursive: true });

      // Write job with missing documentType
      const incompleteJob = {
        jobId: jobId,
        // Missing: documentType
        status: 'queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sources: [],
        schema: { schemaId: 'test' },
        examples: [],
        options: {},
      };

      await writeFile(
        join(jobDir, 'job.json'),
        JSON.stringify(incompleteJob, null, 2)
      );

      const reportPath = join(tempOutputDir, `${jobId}-missing-fields.json`);

      const { report } = await orchestrator.orchestrateJob(
        tempJobsDir,
        jobId,
        tempSchemasDir,
        tempExamplesDir,
        reportPath
      );

      expect(report.status).toBe('failure');
      expect(report.result.jobLoaded).toBe(false);
      expect(report.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty sources array', async () => {
      const jobId = 'JOB-EMPTY-SOURCES';
      const jobDir = join(tempJobsDir, jobId);
      await mkdir(jobDir, { recursive: true });

      // Write job with empty sources
      const jobWithNoSources = {
        jobId: jobId,
        documentType: 'invoice',
        status: 'queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sources: [], // Empty!
        schema: { schemaId: 'test' },
        examples: [],
        options: {},
      };

      await writeFile(
        join(jobDir, 'job.json'),
        JSON.stringify(jobWithNoSources, null, 2)
      );

      const reportPath = join(tempOutputDir, `${jobId}-empty-sources.json`);

      const { report } = await orchestrator.orchestrateJob(
        tempJobsDir,
        jobId,
        tempSchemasDir,
        tempExamplesDir,
        reportPath
      );

      expect(report.status).toBe('failure');
      expect(report.result.jobLoaded).toBe(false);
    });
  });

  describe('Stage 2: Schema Loading - Error Scenarios', () => {
    it('should handle missing schema file', async () => {
      const jobId = 'JOB-MISSING-SCHEMA';
      const jobDir = join(tempJobsDir, jobId);
      await mkdir(jobDir, { recursive: true });

      // Write valid job
      const validJob = {
        jobId: jobId,
        documentType: 'invoice',
        status: 'queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sources: [
          {
            sourceId: 'src-001',
            filePath: '/docs/test.pdf',
            mimeType: 'application/pdf',
            hash: 'abc123',
            uploadedAt: new Date().toISOString(),
            sizeBytes: 1000,
          },
        ],
        schema: {
          schemaId: 'missing-schema',
          schemaName: 'nonexistent-schema',
          schemaPath: '/schemas/nonexistent.json',
          version: '1.0.0',
          fieldsCount: 0,
          uploadedAt: new Date().toISOString(),
        },
        examples: [],
        options: {
          enableHallucinationCheck: true,
          confidenceThreshold: 0.8,
          maxRetries: 3,
          timeoutMs: 30000,
          enableAuditLogging: true,
          notifyOnCompletion: false,
        },
      };

      await writeFile(
        join(jobDir, 'job.json'),
        JSON.stringify(validJob, null, 2)
      );

      const reportPath = join(tempOutputDir, `${jobId}-missing-schema.json`);

      const { report } = await orchestrator.orchestrateJob(
        tempJobsDir,
        jobId,
        tempSchemasDir,
        tempExamplesDir,
        reportPath
      );

      expect(report.status).toBe('failure');
      expect(report.result.jobLoaded).toBe(true); // Job loaded
      expect(report.result.schemaLoaded).toBe(false); // But schema failed
      expect(report.errors.some((e) => e.code === 'SCHEMA_LOAD_FAILED')).toBe(
        true
      );
    });

    it('should handle invalid schema structure', async () => {
      const jobId = 'JOB-INVALID-SCHEMA-STRUCT';
      const jobDir = join(tempJobsDir, jobId);
      await mkdir(jobDir, { recursive: true });

      // Write schema file with missing properties
      const invalidSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        // Missing required 'properties' field
      };

      await writeFile(
        join(tempSchemasDir, 'invalid-schema-struct.json'),
        JSON.stringify(invalidSchema, null, 2)
      );

      const validJob = {
        jobId: jobId,
        documentType: 'invoice',
        status: 'queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sources: [
          {
            sourceId: 'src-001',
            filePath: '/docs/test.pdf',
            mimeType: 'application/pdf',
            hash: 'abc123',
            uploadedAt: new Date().toISOString(),
            sizeBytes: 1000,
          },
        ],
        schema: {
          schemaId: 'invalid-schema-struct',
          schemaName: 'invalid-schema-struct',
          schemaPath: '/schemas/invalid-schema-struct.json',
          version: '1.0.0',
          fieldsCount: 0,
          uploadedAt: new Date().toISOString(),
        },
        examples: [],
        options: {
          enableHallucinationCheck: true,
          confidenceThreshold: 0.8,
          maxRetries: 3,
          timeoutMs: 30000,
          enableAuditLogging: true,
          notifyOnCompletion: false,
        },
      };

      await writeFile(
        join(jobDir, 'job.json'),
        JSON.stringify(validJob, null, 2)
      );

      const reportPath = join(tempOutputDir, `${jobId}-invalid-schema.json`);

      const { report } = await orchestrator.orchestrateJob(
        tempJobsDir,
        jobId,
        tempSchemasDir,
        tempExamplesDir,
        reportPath
      );

      expect(report.status).toBe('failure');
      expect(report.result.schemaLoaded).toBe(false);
      expect(report.errors.some((e) => e.code === 'SCHEMA_LOAD_FAILED')).toBe(
        true
      );
    });

    it('should handle schema with no fields gracefully (warning)', async () => {
      const jobId = 'JOB-EMPTY-SCHEMA';
      const jobDir = join(tempJobsDir, jobId);
      await mkdir(jobDir, { recursive: true });

      // Write empty schema
      const emptySchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {}, // Empty properties
        required: [],
      };

      await writeFile(
        join(tempSchemasDir, 'empty-schema.json'),
        JSON.stringify(emptySchema, null, 2)
      );

      const validJob = {
        jobId: jobId,
        documentType: 'invoice',
        status: 'queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sources: [
          {
            sourceId: 'src-001',
            filePath: '/docs/test.pdf',
            mimeType: 'application/pdf',
            hash: 'abc123',
            uploadedAt: new Date().toISOString(),
            sizeBytes: 1000,
          },
        ],
        schema: {
          schemaId: 'empty-schema',
          schemaName: 'empty-schema',
          schemaPath: '/schemas/empty-schema.json',
          version: '1.0.0',
          fieldsCount: 0,
          uploadedAt: new Date().toISOString(),
        },
        examples: [],
        options: {
          enableHallucinationCheck: true,
          confidenceThreshold: 0.8,
          maxRetries: 3,
          timeoutMs: 30000,
          enableAuditLogging: true,
          notifyOnCompletion: false,
        },
      };

      await writeFile(
        join(jobDir, 'job.json'),
        JSON.stringify(validJob, null, 2)
      );

      const reportPath = join(tempOutputDir, `${jobId}-empty-schema.json`);

      const { report } = await orchestrator.orchestrateJob(
        tempJobsDir,
        jobId,
        tempSchemasDir,
        tempExamplesDir,
        reportPath
      );

      // Should still succeed but with warning
      expect(report.result.schemaLoaded).toBe(true);
      expect(report.warnings.some((w) => w.code === 'EMPTY_SCHEMA')).toBe(true);
    });
  });

  describe('Stage 3: Example Analysis - Error Scenarios', () => {
    it('should handle missing example files gracefully (not critical)', async () => {
      const jobId = 'JOB-MISSING-EXAMPLES';
      const jobDir = join(tempJobsDir, jobId);
      await mkdir(jobDir, { recursive: true });

      // Create valid schema
      const validSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          name: { type: 'string' },
          amount: { type: 'number' },
        },
        required: ['name'],
      };

      await writeFile(
        join(tempSchemasDir, 'valid-schema.json'),
        JSON.stringify(validSchema, null, 2)
      );

      const validJob = {
        jobId: jobId,
        documentType: 'invoice',
        status: 'queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sources: [
          {
            sourceId: 'src-001',
            filePath: '/docs/test.pdf',
            mimeType: 'application/pdf',
            hash: 'abc123',
            uploadedAt: new Date().toISOString(),
            sizeBytes: 1000,
          },
        ],
        schema: {
          schemaId: 'valid-schema',
          schemaName: 'valid-schema',
          schemaPath: '/schemas/valid-schema.json',
          version: '1.0.0',
          fieldsCount: 2,
          uploadedAt: new Date().toISOString(),
        },
        examples: [],
        options: {
          enableHallucinationCheck: true,
          confidenceThreshold: 0.8,
          maxRetries: 3,
          timeoutMs: 30000,
          enableAuditLogging: true,
          notifyOnCompletion: false,
        },
      };

      await writeFile(
        join(jobDir, 'job.json'),
        JSON.stringify(validJob, null, 2)
      );

      const reportPath = join(tempOutputDir, `${jobId}-missing-examples.json`);

      const { report } = await orchestrator.orchestrateJob(
        tempJobsDir,
        jobId,
        tempSchemasDir,
        tempExamplesDir,
        reportPath
      );

      // Should succeed - examples are optional for graceful degradation
      expect(report.result.jobLoaded).toBe(true);
      expect(report.result.schemaLoaded).toBe(true);
      // Example analysis should still complete (with 0 hints if no examples)
      expect(report.result.examplesAnalyzed).toBe(true);
    });
  });

  describe('Stage 4: Source Validation - Error Scenarios', () => {
    it('should validate invalid MIME type format', async () => {
      const jobId = 'JOB-INVALID-MIME';
      const jobDir = join(tempJobsDir, jobId);
      await mkdir(jobDir, { recursive: true });

      const validSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      };

      await writeFile(
        join(tempSchemasDir, 'mime-test-schema.json'),
        JSON.stringify(validSchema, null, 2)
      );

      // Job with invalid MIME type
      const jobWithInvalidMime = {
        jobId: jobId,
        documentType: 'invoice',
        status: 'queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sources: [
          {
            sourceId: 'src-001',
            filePath: '/docs/test.pdf',
            mimeType: 'invalid-mime', // Invalid format
            hash: 'abc123',
            uploadedAt: new Date().toISOString(),
            sizeBytes: 1000,
          },
        ],
        schema: {
          schemaId: 'mime-test-schema',
          schemaName: 'mime-test-schema',
          schemaPath: '/schemas/mime-test-schema.json',
          version: '1.0.0',
          fieldsCount: 1,
          uploadedAt: new Date().toISOString(),
        },
        examples: [],
        options: {
          enableHallucinationCheck: true,
          confidenceThreshold: 0.8,
          maxRetries: 3,
          timeoutMs: 30000,
          enableAuditLogging: true,
          notifyOnCompletion: false,
        },
      };

      await writeFile(
        join(jobDir, 'job.json'),
        JSON.stringify(jobWithInvalidMime, null, 2)
      );

      const reportPath = join(tempOutputDir, `${jobId}-invalid-mime.json`);

      const { report } = await orchestrator.orchestrateJob(
        tempJobsDir,
        jobId,
        tempSchemasDir,
        tempExamplesDir,
        reportPath
      );

      expect(report.result.sourcesValidated).toBe(false);
      expect(report.errors.some((e) => e.code === 'SOURCE_VALIDATION_FAILED')).toBe(true);
    });

    it('should handle missing source fields', async () => {
      const jobId = 'JOB-MISSING-SOURCE-FIELDS';
      const jobDir = join(tempJobsDir, jobId);
      await mkdir(jobDir, { recursive: true });

      const validSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      };

      await writeFile(
        join(tempSchemasDir, 'source-field-schema.json'),
        JSON.stringify(validSchema, null, 2)
      );

      // Job with incomplete source
      const jobWithIncompleteSource = {
        jobId: jobId,
        documentType: 'invoice',
        status: 'queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sources: [
          {
            sourceId: 'src-001',
            filePath: '/docs/test.pdf',
            // Missing: mimeType, hash, etc.
          },
        ],
        schema: {
          schemaId: 'source-field-schema',
          schemaName: 'source-field-schema',
          schemaPath: '/schemas/source-field-schema.json',
          version: '1.0.0',
          fieldsCount: 1,
          uploadedAt: new Date().toISOString(),
        },
        examples: [],
        options: {
          enableHallucinationCheck: true,
          confidenceThreshold: 0.8,
          maxRetries: 3,
          timeoutMs: 30000,
          enableAuditLogging: true,
          notifyOnCompletion: false,
        },
      };

      await writeFile(
        join(jobDir, 'job.json'),
        JSON.stringify(jobWithIncompleteSource, null, 2)
      );

      const reportPath = join(tempOutputDir, `${jobId}-missing-source-fields.json`);

      const { report } = await orchestrator.orchestrateJob(
        tempJobsDir,
        jobId,
        tempSchemasDir,
        tempExamplesDir,
        reportPath
      );

      expect(report.result.sourcesValidated).toBe(false);
    });
  });

  describe('Edge Cases & Resilience', () => {
    it('should report is written even on failure', async () => {
      const jobId = 'JOB-REPORT-WRITTEN';
      const jobDir = join(tempJobsDir, jobId);
      await mkdir(jobDir, { recursive: true });

      // Invalid job to trigger failure
      const invalidJob = {
        jobId: jobId,
        // Missing documentType to cause failure
      };

      await writeFile(
        join(jobDir, 'job.json'),
        JSON.stringify(invalidJob, null, 2)
      );

      const reportPath = join(tempOutputDir, `${jobId}-report-written.json`);

      const { report } = await orchestrator.orchestrateJob(
        tempJobsDir,
        jobId,
        tempSchemasDir,
        tempExamplesDir,
        reportPath
      );

      // Report should be created even on failure
      expect(report).toBeDefined();
      expect(report.status).toBe('failure');
      expect(report.errors.length).toBeGreaterThan(0);
    });

    it('should accumulate errors from multiple stages', async () => {
      const jobId = 'JOB-MULTI-ERROR';
      const jobDir = join(tempJobsDir, jobId);
      await mkdir(jobDir, { recursive: true });

      // Job missing documentType (Stage 1 error)
      const multiErrorJob = {
        jobId: jobId,
        // Missing: documentType (Stage 1 error)
        status: 'queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sources: [],
        schema: { schemaId: 'test' },
        examples: [],
        options: {},
      };

      await writeFile(
        join(jobDir, 'job.json'),
        JSON.stringify(multiErrorJob, null, 2)
      );

      const reportPath = join(tempOutputDir, `${jobId}-multi-error.json`);

      const { report } = await orchestrator.orchestrateJob(
        tempJobsDir,
        jobId,
        tempSchemasDir,
        tempExamplesDir,
        reportPath
      );

      // Should have errors from Stage 1
      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.status).toBe('failure');
    });
  });
});
