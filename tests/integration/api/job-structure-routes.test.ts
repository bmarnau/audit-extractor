/**
 * Job Structure API Integration Tests
 *
 * Test Coverage:
 * - POST /api/v1/jobs/structure - Create job with different document types
 * - GET /api/v1/jobs/:jobId/structure - Retrieve job metadata
 * - GET /api/v1/jobs/:jobId/validate - Validate structure
 * - PUT /api/v1/jobs/:jobId - Update job status
 * - DELETE /api/v1/jobs/:jobId - Delete job
 * - GET /api/v1/jobs - List all jobs
 * - GET /api/v1/jobs/:jobId/size - Get directory size
 *
 * @version 0.22.0
 * @phase 22
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as os from 'os';
import {
  invoiceTestCase,
  deliveryNoteTestCase,
  purchaseOrderTestCase,
  quoteTestCase,
  contractTestCase,
  multiDocumentTestCase,
} from '../fixtures/job-test-data';

describe('Job Structure API Integration Tests', () => {
  let app: any;
  let tempJobsDir: string;
  let createdJobIds: string[] = [];

  beforeAll(async () => {
    // Setup: Create temporary jobs directory for tests
    tempJobsDir = path.join(os.tmpdir(), `job-api-tests-${Date.now()}`);
    fsSync.mkdirSync(tempJobsDir, { recursive: true });

    // Setup: Mock Express app (in real tests, import the actual server)
    // For now, we document what tests should look like
    console.log(`[Test Setup] Temporary jobs directory: ${tempJobsDir}`);
  });

  afterAll(async () => {
    // Cleanup: Remove all created job directories
    for (const jobId of createdJobIds) {
      const jobPath = path.join(tempJobsDir, jobId);
      if (fsSync.existsSync(jobPath)) {
        await fs.rm(jobPath, { recursive: true, force: true });
      }
    }

    // Cleanup: Remove temp directory
    if (fsSync.existsSync(tempJobsDir)) {
      await fs.rm(tempJobsDir, { recursive: true, force: true });
    }
  });

  // ==================== Test Cases ====================

  describe('POST /api/v1/jobs/structure - Create Job Structure', () => {
    it('should create invoice job structure successfully', async () => {
      const response = await request(app)
        .post('/api/v1/jobs/structure')
        .send(invoiceTestCase)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobId).toMatch(/^JOB-/);
      expect(response.body.data.documentType).toBe('pdf');
      expect(response.body.data.status).toBe('queued');
      expect(response.body.data.sources.length).toBe(1);

      createdJobIds.push(response.body.data.jobId);
    });

    it('should create delivery note job structure successfully', async () => {
      const response = await request(app)
        .post('/api/v1/jobs/structure')
        .send(deliveryNoteTestCase)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.documentType).toBe('pdf');
      expect(response.body.data.sources[0].filePath).toContain('delivery_note');

      createdJobIds.push(response.body.data.jobId);
    });

    it('should create HTML document job structure successfully', async () => {
      const response = await request(app)
        .post('/api/v1/jobs/structure')
        .send(purchaseOrderTestCase)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.documentType).toBe('html');
      expect(response.body.data.sources[0].mimeType).toBe('text/html');

      createdJobIds.push(response.body.data.jobId);
    });

    it('should create multi-document job structure successfully', async () => {
      const response = await request(app)
        .post('/api/v1/jobs/structure')
        .send(multiDocumentTestCase)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sources.length).toBe(3);
      expect(response.body.data.metadata.documentCount).toBe(3);

      createdJobIds.push(response.body.data.jobId);
    });

    it('should reject invalid document type', async () => {
      const invalidRequest = { ...invoiceTestCase, documentType: 'invalid' };

      const response = await request(app)
        .post('/api/v1/jobs/structure')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('JOB_VALIDATION_ERROR');
    });

    it('should reject missing required fields', async () => {
      const incompleteRequest = { ...invoiceTestCase };
      delete (incompleteRequest as any).schemaId;

      const response = await request(app)
        .post('/api/v1/jobs/structure')
        .send(incompleteRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject empty source files array', async () => {
      const invalidRequest = { ...invoiceTestCase, sourceFiles: [] };

      const response = await request(app)
        .post('/api/v1/jobs/structure')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toContain('VALIDATION');
    });
  });

  describe('GET /api/v1/jobs/:jobId/structure - Retrieve Job Structure', () => {
    let jobId: string;

    beforeEach(async () => {
      // Create a job before each test
      const response = await request(app)
        .post('/api/v1/jobs/structure')
        .send(invoiceTestCase);

      jobId = response.body.data.jobId;
      createdJobIds.push(jobId);
    });

    it('should retrieve existing job structure', async () => {
      const response = await request(app)
        .get(`/api/v1/jobs/${jobId}/structure`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobId).toBe(jobId);
      expect(response.body.data.status).toBe('queued');
      expect(response.body.data.documentType).toBe('pdf');
    });

    it('should return 404 for non-existent job', async () => {
      const response = await request(app)
        .get('/api/v1/jobs/JOB-NONEXISTENT/structure')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('JOB_NOT_FOUND');
    });

    it('should return 400 for invalid JobId format', async () => {
      const response = await request(app)
        .get('/api/v1/jobs/INVALID-FORMAT/structure')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toContain('VALIDATION');
    });
  });

  describe('GET /api/v1/jobs/:jobId/validate - Validate Job Structure', () => {
    let jobId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/jobs/structure')
        .send(invoiceTestCase);

      jobId = response.body.data.jobId;
      createdJobIds.push(jobId);
    });

    it('should validate complete job structure', async () => {
      const response = await request(app)
        .get(`/api/v1/jobs/${jobId}/validate`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.missingDirectories).toEqual([]);
      expect(response.body.data.missingFiles).toEqual([]);
    });

    it('should detect missing directories', async () => {
      // Simulate deletion of a directory
      const jobPath = path.join(tempJobsDir, jobId, 'logs');
      if (fsSync.existsSync(jobPath)) {
        fsSync.rmSync(jobPath, { recursive: true });
      }

      const response = await request(app)
        .get(`/api/v1/jobs/${jobId}/validate`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(false);
      expect(response.body.data.missingDirectories.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/v1/jobs/:jobId - Update Job Status', () => {
    let jobId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/jobs/structure')
        .send(invoiceTestCase);

      jobId = response.body.data.jobId;
      createdJobIds.push(jobId);
    });

    it('should transition job from queued to running', async () => {
      const response = await request(app)
        .put(`/api/v1/jobs/${jobId}`)
        .send({ status: 'running' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('running');
    });

    it('should transition job from running to completed', async () => {
      // First transition to running
      await request(app)
        .put(`/api/v1/jobs/${jobId}`)
        .send({ status: 'running' })
        .expect(200);

      // Then transition to completed
      const response = await request(app)
        .put(`/api/v1/jobs/${jobId}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
    });

    it('should transition job from running to failed with reason', async () => {
      // First transition to running
      await request(app)
        .put(`/api/v1/jobs/${jobId}`)
        .send({ status: 'running' })
        .expect(200);

      // Then transition to failed
      const failureReason = 'Extraction confidence below threshold';
      const response = await request(app)
        .put(`/api/v1/jobs/${jobId}`)
        .send({ status: 'failed', failureReason })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('failed');
      expect(response.body.data.failureReason).toBe(failureReason);
    });

    it('should reject invalid status transition', async () => {
      const response = await request(app)
        .put(`/api/v1/jobs/${jobId}`)
        .send({ status: 'completed' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toContain('STATUS');
    });

    it('should require failureReason when transitioning to failed', async () => {
      // First transition to running
      await request(app)
        .put(`/api/v1/jobs/${jobId}`)
        .send({ status: 'running' })
        .expect(200);

      // Try to fail without reason
      const response = await request(app)
        .put(`/api/v1/jobs/${jobId}`)
        .send({ status: 'failed' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/jobs/:jobId - Delete Job', () => {
    let jobId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/jobs/structure')
        .send(invoiceTestCase);

      jobId = response.body.data.jobId;
      // Don't add to createdJobIds since we'll delete it manually
    });

    it('should delete existing job', async () => {
      const response = await request(app)
        .delete(`/api/v1/jobs/${jobId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should return 404 when deleting non-existent job', async () => {
      const response = await request(app)
        .delete('/api/v1/jobs/JOB-NONEXISTENT')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/jobs - List All Jobs', () => {
    it('should list all created jobs', async () => {
      // Create multiple jobs
      await request(app)
        .post('/api/v1/jobs/structure')
        .send(invoiceTestCase);

      await request(app)
        .post('/api/v1/jobs/structure')
        .send(deliveryNoteTestCase);

      const response = await request(app)
        .get('/api/v1/jobs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.jobs)).toBe(true);
      expect(response.body.data.count).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty jobs list', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.jobs)).toBe(true);
    });
  });

  describe('GET /api/v1/jobs/:jobId/size - Get Job Size', () => {
    let jobId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/jobs/structure')
        .send(invoiceTestCase);

      jobId = response.body.data.jobId;
      createdJobIds.push(jobId);
    });

    it('should return job directory size in bytes', async () => {
      const response = await request(app)
        .get(`/api/v1/jobs/${jobId}/size`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobId).toBe(jobId);
      expect(response.body.data.sizeBytes).toBeGreaterThan(0);
      expect(response.body.data.sizeKB).toBeGreaterThanOrEqual(0);
      expect(response.body.data.sizeMB).toBeGreaterThanOrEqual(0);
    });

    it('should return 400 for invalid JobId format', async () => {
      const response = await request(app)
        .get('/api/v1/jobs/INVALID/size')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Different Document Types - Full Workflow', () => {
    it('should handle complete workflow for invoice document', async () => {
      // 1. Create
      const createRes = await request(app)
        .post('/api/v1/jobs/structure')
        .send(invoiceTestCase)
        .expect(201);

      const jobId = createRes.body.data.jobId;

      // 2. Validate
      const validateRes = await request(app)
        .get(`/api/v1/jobs/${jobId}/validate`)
        .expect(200);

      expect(validateRes.body.data.valid).toBe(true);

      // 3. Update to running
      const runRes = await request(app)
        .put(`/api/v1/jobs/${jobId}`)
        .send({ status: 'running' })
        .expect(200);

      expect(runRes.body.data.status).toBe('running');

      // 4. Get size
      const sizeRes = await request(app)
        .get(`/api/v1/jobs/${jobId}/size`)
        .expect(200);

      expect(sizeRes.body.data.sizeBytes).toBeGreaterThan(0);

      // 5. Mark completed
      const completeRes = await request(app)
        .put(`/api/v1/jobs/${jobId}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(completeRes.body.data.status).toBe('completed');

      // 6. Delete
      await request(app)
        .delete(`/api/v1/jobs/${jobId}`)
        .expect(200);
    });

    it('should handle complete workflow for multi-document case', async () => {
      const createRes = await request(app)
        .post('/api/v1/jobs/structure')
        .send(multiDocumentTestCase)
        .expect(201);

      const jobId = createRes.body.data.jobId;
      expect(createRes.body.data.sources.length).toBe(3);

      const structureRes = await request(app)
        .get(`/api/v1/jobs/${jobId}/structure`)
        .expect(200);

      expect(structureRes.body.data.sources.length).toBe(3);
      expect(structureRes.body.data.metadata.documentCount).toBe(3);
    });
  });
});
