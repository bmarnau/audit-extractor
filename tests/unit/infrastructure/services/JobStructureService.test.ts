/**
 * JobStructureService - Unit Tests
 *
 * Test Coverage:
 * - Verzeichnis-Erstellung
 * - Metadaten-Persistierung
 * - Validierung
 * - Fehlerbehandlung
 *
 * @version 0.22.0
 * @phase 22 - Job-Based Architecture
 */

import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  JobStructureService,
  JobDirectoryStructure,
} from '@infrastructure/services/JobStructureService';
import { Job, JobId, DocumentType, JobSourceFactory, JobSchemaFactory, JobExampleFactory } from '@domain/job';
import {
  JobDirectoryError,
  JobPersistenceError,
  JobDirectoryValidationError,
} from '@domain/job/JobErrors';

describe('JobStructureService', () => {
  let service: JobStructureService;
  let tempDir: string;

  beforeEach(async () => {
    // Erstelle temporäres Verzeichnis für Tests
    tempDir = path.join(os.tmpdir(), `job-service-test-${Date.now()}`);
    fsSync.mkdirSync(tempDir, { recursive: true });

    service = new JobStructureService(tempDir);
  });

  afterEach(async () => {
    // Cleanup
    if (fsSync.existsSync(tempDir)) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  // ==================== Job Creation ====================

  describe('createJobStructure', () => {
    it('should create job directory structure', async () => {
      const job = Job.create({
        documentType: DocumentType.PDF,
        sources: [
          JobSourceFactory.create({
            filePath: 'test.pdf',
            mimeType: 'application/pdf',
            hash: 'hash123',
            sizeBytes: 1024,
          }),
        ],
        schema: JobSchemaFactory.create({
          schemaId: 'schema-1',
          schemaName: 'invoice',
          schemaPath: 'schema.json',
          version: '1.0.0',
          fieldsCount: 5,
        }),
        examples: [],
      });

      const structure = await service.createJobStructure(job);

      // Prüfe dass alle Verzeichnisse erstellt wurden
      expect(fsSync.existsSync(structure.sourcesPath)).toBe(true);
      expect(fsSync.existsSync(structure.schemaPath)).toBe(true);
      expect(fsSync.existsSync(structure.examplesPath)).toBe(true);
      expect(fsSync.existsSync(structure.outputPath)).toBe(true);
      expect(fsSync.existsSync(structure.logsPath)).toBe(true);

      // Prüfe dass job.json erstellt wurde
      expect(fsSync.existsSync(structure.jobMetadataPath)).toBe(true);
    });

    it('should create job.json with correct structure', async () => {
      const job = Job.create({
        documentType: DocumentType.HTML,
        sources: [
          JobSourceFactory.create({
            filePath: 'document.html',
            mimeType: 'text/html',
            hash: 'hash456',
            sizeBytes: 2048,
          }),
        ],
        schema: JobSchemaFactory.create({
          schemaId: 'schema-2',
          schemaName: 'html-extractor',
          schemaPath: 'schema.json',
          version: '2.0.0',
          fieldsCount: 3,
        }),
        examples: [],
      });

      const structure = await service.createJobStructure(job);
      const metadata = await service.loadJobMetadata(job.getJobId().toString());

      expect(metadata.jobId).toBe(job.getJobId().toString());
      expect(metadata.documentType).toBe('html');
      expect(metadata.status).toBe('queued');
      expect(metadata.sources.length).toBe(1);
    });
  });

  // ==================== Metadata Operations ====================

  describe('Metadata Operations', () => {
    let job: Job;
    let jobId: string;

    beforeEach(async () => {
      job = Job.create({
        documentType: DocumentType.PDF,
        sources: [
          JobSourceFactory.create({
            filePath: 'test.pdf',
            mimeType: 'application/pdf',
            hash: 'hash789',
            sizeBytes: 5000,
          }),
        ],
        schema: JobSchemaFactory.create({
          schemaId: 'schema-3',
          schemaName: 'test',
          schemaPath: 'schema.json',
          version: '1.0.0',
          fieldsCount: 1,
        }),
        examples: [],
      });

      jobId = job.getJobId().toString();
      await service.createJobStructure(job);
    });

    it('should load job metadata', async () => {
      const metadata = await service.loadJobMetadata(jobId);

      expect(metadata.jobId).toBe(jobId);
      expect(metadata.documentType).toBe('pdf');
      expect(metadata.status).toBe('queued');
    });

    it('should update job metadata', async () => {
      await service.updateJobMetadata(jobId, {
        status: 'running',
      });

      const updated = await service.loadJobMetadata(jobId);
      expect(updated.status).toBe('running');
      expect(updated.jobId).toBe(jobId); // unchanged
    });

    it('should throw when loading non-existent job', async () => {
      expect(() =>
        service.loadJobMetadata('JOB-NONEXISTENT')
      ).rejects.toThrow(JobPersistenceError);
    });
  });

  // ==================== Validation ====================

  describe('validateJobDirectory', () => {
    let jobId: string;

    beforeEach(async () => {
      const job = Job.create({
        documentType: DocumentType.PDF,
        sources: [
          JobSourceFactory.create({
            filePath: 'test.pdf',
            mimeType: 'application/pdf',
            hash: 'hash000',
            sizeBytes: 1000,
          }),
        ],
        schema: JobSchemaFactory.create({
          schemaId: 'schema-4',
          schemaName: 'test',
          schemaPath: 'schema.json',
          version: '1.0.0',
          fieldsCount: 1,
        }),
        examples: [],
      });

      jobId = job.getJobId().toString();
      await service.createJobStructure(job);
    });

    it('should validate complete job directory', async () => {
      const result = await service.validateJobDirectory(jobId);

      expect(result.valid).toBe(true);
      expect(result.missingDirectories).toEqual([]);
      expect(result.missingFiles).toEqual([]);
    });

    it('should detect missing directories', async () => {
      const paths = service.getJobPaths(jobId);
      await fs.rm(paths.logsPath, { recursive: true });

      const result = await service.validateJobDirectory(jobId);

      expect(result.valid).toBe(false);
      expect(result.missingDirectories.length).toBeGreaterThan(0);
    });

    it('should detect missing job.json', async () => {
      const paths = service.getJobPaths(jobId);
      await fs.rm(paths.jobMetadataPath);

      const result = await service.validateJobDirectory(jobId);

      expect(result.valid).toBe(false);
      expect(result.missingFiles).toContain('job.json');
    });
  });

  // ==================== Directory Operations ====================

  describe('Directory Operations', () => {
    it('should list all jobs', async () => {
      // Erstelle 3 Jobs
      for (let i = 1; i <= 3; i++) {
        const job = Job.create({
          documentType: DocumentType.PDF,
          sources: [
            JobSourceFactory.create({
              filePath: `test${i}.pdf`,
              mimeType: 'application/pdf',
              hash: `hash${i}`,
              sizeBytes: 1000,
            }),
          ],
          schema: JobSchemaFactory.create({
            schemaId: `schema-${i}`,
            schemaName: 'test',
            schemaPath: 'schema.json',
            version: '1.0.0',
            fieldsCount: 1,
          }),
          examples: [],
        });

        await service.createJobStructure(job);
      }

      const jobs = await service.listJobs();
      expect(jobs.length).toBe(3);
      expect(jobs.every((j) => j.startsWith('JOB-'))).toBe(true);
    });

    it('should return empty array when no jobs exist', async () => {
      const jobs = await service.listJobs();
      expect(jobs).toEqual([]);
    });

    it('should delete job directory', async () => {
      const job = Job.create({
        documentType: DocumentType.PDF,
        sources: [
          JobSourceFactory.create({
            filePath: 'test.pdf',
            mimeType: 'application/pdf',
            hash: 'hash111',
            sizeBytes: 1000,
          }),
        ],
        schema: JobSchemaFactory.create({
          schemaId: 'schema-5',
          schemaName: 'test',
          schemaPath: 'schema.json',
          version: '1.0.0',
          fieldsCount: 1,
        }),
        examples: [],
      });

      const jobId = job.getJobId().toString();
      const structure = await service.createJobStructure(job);

      expect(fsSync.existsSync(structure.rootPath)).toBe(true);

      await service.deleteJobDirectory(jobId);

      expect(fsSync.existsSync(structure.rootPath)).toBe(false);
    });

    it('should calculate directory size', async () => {
      const job = Job.create({
        documentType: DocumentType.PDF,
        sources: [
          JobSourceFactory.create({
            filePath: 'test.pdf',
            mimeType: 'application/pdf',
            hash: 'hash222',
            sizeBytes: 1000,
          }),
        ],
        schema: JobSchemaFactory.create({
          schemaId: 'schema-6',
          schemaName: 'test',
          schemaPath: 'schema.json',
          version: '1.0.0',
          fieldsCount: 1,
        }),
        examples: [],
      });

      const jobId = job.getJobId().toString();
      await service.createJobStructure(job);

      const size = await service.getJobDirectorySize(jobId);

      // job.json hat minimal Content, sollte > 0 sein
      expect(size).toBeGreaterThan(0);
    });
  });

  // ==================== Path Generation ====================

  describe('getJobPaths', () => {
    it('should generate correct paths for job', () => {
      const jobId = 'JOB-0001';
      const paths = service.getJobPaths(jobId);

      expect(paths.rootPath).toContain('JOB-0001');
      expect(paths.sourcesPath).toContain('sources');
      expect(paths.schemaPath).toContain('schema');
      expect(paths.examplesPath).toContain('examples');
      expect(paths.outputPath).toContain('output');
      expect(paths.logsPath).toContain('logs');
      expect(paths.jobMetadataPath).toContain('job.json');
      expect(paths.allPaths.length).toBe(6);
    });
  });

  // ==================== Helpers ====================

  describe('Helper Methods', () => {
    it('should check directory exists (sync)', () => {
      const dir = path.join(tempDir, 'test-dir');
      fsSync.mkdirSync(dir);

      expect(service.directoryExistsSync(dir)).toBe(true);
      expect(service.directoryExistsSync(path.join(tempDir, 'non-existent'))).toBe(
        false
      );
    });
  });

  // ==================== Error Handling ====================

  describe('Error Handling', () => {
    it('should throw on invalid job directory for validation', async () => {
      expect(() =>
        service.validateJobDirectory('JOB-INVALID-PATH')
      ).rejects.toThrow();
    });

    it('should throw on delete non-existent directory', async () => {
      expect(() =>
        service.deleteJobDirectory('JOB-NONEXISTENT')
      ).rejects.toThrow(JobDirectoryError);
    });
  });
});
