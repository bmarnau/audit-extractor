/**
 * Job Structure API Routes - Phase 22
 *
 * REST Endpoints für Job-Struktur Management
 * Basierend auf Domain-Driven Design
 *
 * POST /api/v1/jobs/structure - Erstellt neue Job-Struktur
 * GET /api/v1/jobs/:jobId/structure - Holt Job-Struktur-Details
 * GET /api/v1/jobs/:jobId/validate - Validiert Struktur
 * DELETE /api/v1/jobs/:jobId - Löscht Job
 * GET /api/v1/jobs - Liste aller Jobs
 *
 * @version 0.22.0
 * @phase 22 - Job-Based Architecture
 */

import { Router, Request, Response } from 'express';
import { resolveService } from '@infrastructure/di/ServiceContainer';
import { JobStructureApplicationService } from '@application/jobs/JobStructureApplicationService';
import {
  JobValidationError,
  JobNotFoundError,
  JobStatusError,
  CreateJobRequest,
} from '@domain/job';

export const createJobStructureRoutes = (): Router => {
  const router = Router();

  function getJobStructureService(): JobStructureApplicationService {
    return resolveService(JobStructureApplicationService);
  }

  // ============================================================================
  // POST /api/v1/jobs/structure - Erstelle neue Job-Struktur
  // ============================================================================
  /**
   * Request Body:
   * {
   *   "documentType": "pdf" | "html" | "image" | "text",
   *   "sourceFiles": [
   *     {
   *       "filePath": "invoice.pdf",
   *       "mimeType": "application/pdf",
   *       "hash": "sha256hash",
   *       "sizeBytes": 102400
   *     }
   *   ],
   *   "schemaId": "schema-1",
   *   "schemaPath": "schema/invoice.json",
   *   "schemaVersion": "1.0.0",
   *   "options": {
   *     "enableHallucinationCheck": true,
   *     "confidenceThreshold": 0.8,
   *     "maxRetries": 3,
   *     "timeoutMs": 30000
   *   }
   * }
   */
  router.post('/structure', async (req: Request, res: Response): Promise<any> => {
    try {
      const service = getJobStructureService();
      const createRequest: CreateJobRequest = req.body;

      // Validierung geschieht im Service
      const runtimeJob = await service.createJob(createRequest);

      return res.status(201).json({
        success: true,
        data: runtimeJob,
        message: 'Job structure created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[JobStructureRoutes] POST /structure error:', error);

      if (error instanceof JobValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: (error as any).details,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'JOB_STRUCTURE_CREATE_ERROR',
          message: error.message || 'Failed to create job structure',
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ============================================================================
  // GET /api/v1/jobs/:jobId/structure - Holt Job-Struktur-Details
  // ============================================================================
  router.get('/:jobId/structure', async (req: Request, res: Response): Promise<any> => {
    try {
      const service = getJobStructureService();
      const jobId = req.params.jobId as string;

      const runtimeJob = await service.getJobStatus(jobId);

      return res.status(200).json({
        success: true,
        data: runtimeJob,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[JobStructureRoutes] GET /:jobId/structure error:', error);

      if (error instanceof JobNotFoundError) {
        return res.status(404).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (error instanceof JobValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'JOB_STRUCTURE_GET_ERROR',
          message: error.message || 'Failed to get job structure',
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ============================================================================
  // GET /api/v1/jobs/:jobId/validate - Validiere Job-Struktur
  // ============================================================================
  router.get('/:jobId/validate', async (req: Request, res: Response): Promise<any> => {
    try {
      const service = getJobStructureService();
      const jobId = req.params.jobId as string;

      const validationResult = await service.validateJobStructure(jobId);

      return res.status(200).json({
        success: true,
        data: {
          valid: validationResult.valid,
          missingDirectories: validationResult.missingDirectories,
          missingFiles: validationResult.missingFiles,
          issues: validationResult.issues,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[JobStructureRoutes] GET /:jobId/validate error:', error);

      if (error instanceof JobNotFoundError) {
        return res.status(404).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (error instanceof JobValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'JOB_STRUCTURE_VALIDATE_ERROR',
          message: error.message || 'Failed to validate job structure',
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ============================================================================
  // PUT /api/v1/jobs/:jobId - Aktualisiere Job-Status
  // ============================================================================
  /**
   * Request Body:
   * {
   *   "status": "running" | "completed" | "failed" | "cancelled",
   *   "failureReason": "optional error message"
   * }
   */
  router.put('/:jobId', async (req: Request, res: Response): Promise<any> => {
    try {
      const service = getJobStructureService();
      const jobId = req.params.jobId as string;
      const { status, failureReason } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'status is required',
          },
          timestamp: new Date().toISOString(),
        });
      }

      const runtimeJob = await service.updateJobStatus(jobId, status, failureReason);

      return res.status(200).json({
        success: true,
        data: runtimeJob,
        message: `Job status updated to ${status}`,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[JobStructureRoutes] PUT /:jobId error:', error);

      if (error instanceof JobNotFoundError) {
        return res.status(404).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (error instanceof JobStatusError || error instanceof JobValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'JOB_STRUCTURE_UPDATE_ERROR',
          message: error.message || 'Failed to update job status',
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ============================================================================
  // DELETE /api/v1/jobs/:jobId - Lösche Job
  // ============================================================================
  router.delete('/:jobId', async (req: Request, res: Response): Promise<any> => {
    try {
      const service = getJobStructureService();
      const jobId = req.params.jobId as string;

      await service.deleteJob(jobId);

      return res.status(200).json({
        success: true,
        message: `Job ${jobId} deleted successfully`,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[JobStructureRoutes] DELETE /:jobId error:', error);

      if (error instanceof JobNotFoundError) {
        return res.status(404).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (error instanceof JobValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'JOB_STRUCTURE_DELETE_ERROR',
          message: error.message || 'Failed to delete job',
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ============================================================================
  // GET /api/v1/jobs - Liste aller Jobs
  // ============================================================================
  router.get('/', async (_req: Request, res: Response): Promise<any> => {
    try {
      const service = getJobStructureService();
      const result = await service.listJobs();

      return res.status(200).json({
        success: true,
        data: {
          jobs: result.jobIds,
          count: result.count,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[JobStructureRoutes] GET / error:', error);

      return res.status(500).json({
        success: false,
        error: {
          code: 'JOB_STRUCTURE_LIST_ERROR',
          message: error.message || 'Failed to list jobs',
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ============================================================================
  // GET /api/v1/jobs/:jobId/size - Holt Verzeichnisgröße
  // ============================================================================
  router.get('/:jobId/size', async (req: Request, res: Response): Promise<any> => {
    try {
      const service = getJobStructureService();
      const jobId = req.params.jobId as string;

      const sizeBytes = await service.getJobSize(jobId);

      return res.status(200).json({
        success: true,
        data: {
          jobId,
          sizeBytes,
          sizeKB: Math.round(sizeBytes / 1024),
          sizeMB: Math.round((sizeBytes / 1024 / 1024) * 100) / 100,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[JobStructureRoutes] GET /:jobId/size error:', error);

      if (error instanceof JobValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'JOB_STRUCTURE_SIZE_ERROR',
          message: error.message || 'Failed to get job size',
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
};
