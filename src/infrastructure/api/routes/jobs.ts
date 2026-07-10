/**
 * Job API Routes - REST Endpoints für asynchrone Job-Verarbeitung
 *
 * POST /api/jobs - Erstellt neuen Job
 * GET /api/jobs/{id} - Holt Job-Details
 * GET /api/jobs/{id}/result - Holt Job-Ergebnis
 * DELETE /api/jobs/{id} - Bricht Job ab
 *
 * @version 0.21.0
 * @phase 21
 */

import { Router, Request, Response } from 'express';
import { resolveService } from '@infrastructure/di/ServiceContainer';
import { JobService } from '@application/jobs/JobService';

export const createJobRoutes = (): Router => {
  const router = Router();

  // Lazy resolve to avoid DI container initialization order issues
  function getJobService(): JobService {
    return resolveService(JobService);
  }

  // ============================================================================
  // POST /api/jobs - Erstellt einen neuen Job
  // ============================================================================

  router.post('/', async (req: Request, res: Response): Promise<any> => {
    try {
      const jobService = getJobService();
      const { documentContent, ruleSet, extractionConfig, jobType, description } = req.body;

      if (!documentContent || typeof documentContent !== 'string') {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'documentContent is required and must be a string',
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          duration: Date.now(),
        });
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0];
      const job = await jobService.createJob({
        documentContent,
        ruleSet,
        extractionConfig,
        jobType,
        description,
        ipAddress,
      });

      return res.status(201).json({
        data: {
          id: job.id,
          status: job.status,
          requestedAt: job.requestedAt,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    } catch (error: any) {
      console.error('[JobRoutes] POST /api/jobs error:', error);
      return res.status(500).json({
        error: {
          code: 'JOB_CREATE_ERROR',
          message: error.message || 'Failed to create job',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    }
  });

  // ============================================================================
  // GET /api/jobs/{id} - Holt Job-Details
  // ============================================================================

  router.get('/:id', async (req: Request, res: Response): Promise<any> => {
    try {
      const jobService = getJobService();
      const { id } = req.params;
      const jobId = Array.isArray(id) ? id[0] : id;

      const job = await jobService.getJob(jobId);
      if (!job) {
        return res.status(404).json({
          error: {
            code: 'JOB_NOT_FOUND',
            message: `Job ${id} not found`,
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          duration: Date.now(),
        });
      }

      return res.status(200).json({
        data: {
          id: job.id,
          status: job.status,
          jobType: job.jobType,
          requestedAt: job.requestedAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          duration: job.duration,
          userId: job.userId,
          documentId: job.documentId,
          description: job.description,
          retryCount: job.retryCount,
          errorMessage: job.errorMessage,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    } catch (error: any) {
      console.error('[JobRoutes] GET /api/jobs/:id error:', error);
      return res.status(500).json({
        error: {
          code: 'JOB_GET_ERROR',
          message: error.message || 'Failed to get job',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    }
  });

  // ============================================================================
  // GET /api/jobs/{id}/result - Holt Job-Ergebnis
  // ============================================================================

  router.get('/:id/result', async (req: Request, res: Response): Promise<any> => {
    try {
      const jobService = getJobService();
      const { id } = req.params;
      const jobId = Array.isArray(id) ? id[0] : id;

      const result = await jobService.getJobResult(jobId);

      return res.status(200).json({
        data: result,
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: {
            code: 'JOB_NOT_FOUND',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          duration: Date.now(),
        });
      }

      console.error('[JobRoutes] GET /api/jobs/:id/result error:', error);
      return res.status(500).json({
        error: {
          code: 'JOB_RESULT_ERROR',
          message: error.message || 'Failed to get job result',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    }
  });

  // ============================================================================
  // DELETE /api/jobs/{id} - Bricht Job ab (Cancel)
  // ============================================================================

  router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
    try {
      const jobService = getJobService();
      const { id } = req.params;
      const jobId = Array.isArray(id) ? id[0] : id;

      const job = await jobService.cancelJob(jobId);

      return res.status(200).json({
        data: {
          id: job.id,
          status: job.status,
          message: 'Job cancelled',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: {
            code: 'JOB_NOT_FOUND',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          duration: Date.now(),
        });
      }

      if (error.message.includes('Cannot cancel')) {
        return res.status(400).json({
          error: {
            code: 'INVALID_JOB_STATUS',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          duration: Date.now(),
        });
      }

      console.error('[JobRoutes] DELETE /api/jobs/:id error:', error);
      return res.status(500).json({
        error: {
          code: 'JOB_CANCEL_ERROR',
          message: error.message || 'Failed to cancel job',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    }
  });

  // ============================================================================
  // GET /api/jobs - Liste von Jobs (optional mit Filtern)
  // ============================================================================

  router.get('/', async (req: Request, res: Response): Promise<any> => {
    try {
      const jobService = getJobService();
      const { status, jobType, limit = '50', offset = '0' } = req.query;

      const result = await jobService.queryJobs({
        status: status as string,
        jobType: jobType as string,
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0,
      });

      return res.status(200).json({
        data: {
          jobs: result.jobs.map((job: any) => ({
            id: job.id,
            status: job.status,
            jobType: job.jobType,
            requestedAt: job.requestedAt,
            duration: job.duration,
          })),
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.hasMore,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    } catch (error: any) {
      console.error('[JobRoutes] GET /api/jobs error:', error);
      return res.status(500).json({
        error: {
          code: 'JOB_QUERY_ERROR',
          message: error.message || 'Failed to query jobs',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    }
  });

  // ============================================================================
  // POST /api/jobs/{id}/retry - Manually retry failed job
  // ============================================================================

  router.post('/:id/retry', async (req: Request, res: Response): Promise<any> => {
    try {
      const jobService = getJobService();
      const { id } = req.params;
      const jobId = Array.isArray(id) ? id[0] : id;
      const { immediate = true } = req.body;

      const job = await jobService.retryFailedJob(jobId, immediate as boolean);

      return res.status(200).json({
        data: {
          id: job.id,
          status: job.status,
          retryCount: job.retryCount,
          message: immediate ? 'Job retry started immediately' : 'Job retry scheduled with backoff',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: {
            code: 'JOB_NOT_FOUND',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          duration: Date.now(),
        });
      }

      if (error.message.includes('Can only retry') || error.message.includes('Max retries exceeded')) {
        return res.status(400).json({
          error: {
            code: 'INVALID_JOB_STATUS',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          duration: Date.now(),
        });
      }

      console.error('[JobRoutes] POST /api/jobs/:id/retry error:', error);
      return res.status(500).json({
        error: {
          code: 'JOB_RETRY_ERROR',
          message: error.message || 'Failed to retry job',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    }
  });

  // ============================================================================
  // GET /api/jobs/dead-letter - List jobs in dead-letter queue
  // ============================================================================

  router.get('/dead-letter/queue', async (req: Request, res: Response): Promise<any> => {
    try {
      const jobService = getJobService();
      const { limit = '50', offset = '0' } = req.query;

      const result = await jobService.getDeadLetterQueue(
        parseInt(limit as string) || 50,
        parseInt(offset as string) || 0
      );

      return res.status(200).json({
        data: {
          deadLetterJobs: result.jobs ? result.jobs.map((job: any) => ({
            id: job.id,
            status: job.status,
            jobType: job.jobType,
            retryCount: job.retryCount,
            maxRetries: job.maxRetries,
            errorMessage: job.errorMessage?.substring(0, 200),
            failedAt: job.completedAt,
          })) : [],
          total: result.total || 0,
          limit: parseInt(limit as string) || 50,
          offset: parseInt(offset as string) || 0,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    } catch (error: any) {
      console.error('[JobRoutes] GET /api/jobs/dead-letter/queue error:', error);
      return res.status(500).json({
        error: {
          code: 'DEAD_LETTER_QUERY_ERROR',
          message: error.message || 'Failed to query dead-letter queue',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    }
  });

  // ============================================================================
  // GET /api/jobs/dead-letter/{id} - Analyze dead-letter job
  // ============================================================================

  router.get('/dead-letter/analyze/:id', async (req: Request, res: Response): Promise<any> => {
    try {
      const jobService = getJobService();
      const { id } = req.params;
      const jobId = Array.isArray(id) ? id[0] : id;

      const analysis = await jobService.analyzeDeadLetterJob(jobId);

      return res.status(200).json({
        data: analysis,
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: {
            code: 'JOB_NOT_FOUND',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          duration: Date.now(),
        });
      }

      if (error.message.includes('not in dead-letter queue')) {
        return res.status(400).json({
          error: {
            code: 'NOT_IN_DEAD_LETTER',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          duration: Date.now(),
        });
      }

      console.error('[JobRoutes] GET /api/jobs/dead-letter/analyze/:id error:', error);
      return res.status(500).json({
        error: {
          code: 'ANALYSIS_ERROR',
          message: error.message || 'Failed to analyze dead-letter job',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    }
  });

  // ============================================================================
  // GET /api/jobs/stats - Job statistics
  // ============================================================================

  router.get('/stats/summary', async (req: Request, res: Response): Promise<any> => {
    try {
      const jobService = getJobService();
      const stats = await jobService.getStatistics();

      return res.status(200).json({
        data: stats,
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    } catch (error: any) {
      console.error('[JobRoutes] GET /api/jobs/stats/summary error:', error);
      return res.status(500).json({
        error: {
          code: 'STATS_ERROR',
          message: error.message || 'Failed to get statistics',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        duration: Date.now(),
      });
    }
  });

  return router;
};

export default createJobRoutes;
