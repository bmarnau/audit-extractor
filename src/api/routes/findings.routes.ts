/**
 * Findings API Controller
 * HTTP endpoints for technical audit findings
 * 
 * Routes:
 * - GET /api/technical-tests/findings
 * - GET /api/technical-tests/findings/critical
 * - GET /api/technical-tests/findings/high
 * - GET /api/technical-tests/findings/search
 * 
 * @version 0.37.0
 * @phase 43
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  FindingSearchQuerySchema,
  FindingDTOSchema,
  FindingsListResponseSchema,
  ErrorResponseSchema,
} from '../dtos/technical-audit.dto.js';
import { findingsService } from '../services/findings.service.js';

const router = Router();

// Type for validated request
interface ValidatedRequest extends Request {
  validatedQuery?: Record<string, any>;
}

/**
 * Middleware: Validate query parameters
 */
function validateQuery(schema: z.ZodSchema) {
  return (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.validatedQuery = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
          },
        });
      }
      next(error);
    }
  };
}

/**
 * GET /api/technical-tests/findings
 * Get all findings with filtering
 * 
 * Query Parameters:
 * - q: search text
 * - severity: critical|high|medium|low
 * - category: Performance|Security|...
 * - since: ISO8601 date
 * - until: ISO8601 date
 * - limit: number (default 10, max 100)
 * - offset: number (default 0)
 * - component: impacted component name
 */
router.get(
  '/',
  validateQuery(FindingSearchQuerySchema),
  async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = {
        limit: 10,
        offset: 0,
        ...req.validatedQuery,
      };
      const result = await findingsService.getFindings(query as any);

      const response = {
        success: true,
        data: {
          findings: result.findings,
          total: result.total,
          filtered: result.filtered,
          severityBreakdown: result.severityBreakdown,
        },
      };

      // Validate response schema
      const validated = FindingsListResponseSchema.parse(response);
      res.json(validated);
    } catch (error) {
      console.error('Error in GET /findings:', error);
      next(error);
    }
  }
);

/**
 * GET /api/technical-tests/findings/critical
 * Get critical severity findings only
 * 
 * Query Parameters:
 * - limit: number (default 10)
 */
router.get(
  '/critical',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(
        parseInt(req.query.limit as string) || 10,
        100
      );
      const findings = await findingsService.getCriticalFindings(limit);

      const response = {
        success: true,
        data: {
          findings,
          total: findings.length,
          filtered: findings.length,
          severityBreakdown: {
            critical: findings.length,
            high: 0,
            medium: 0,
            low: 0,
          },
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error in GET /findings/critical:', error);
      next(error);
    }
  }
);

/**
 * GET /api/technical-tests/findings/high
 * Get high severity findings
 * 
 * Query Parameters:
 * - limit: number (default 10)
 */
router.get(
  '/high',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(
        parseInt(req.query.limit as string) || 10,
        100
      );
      const findings = await findingsService.getHighFindings(limit);

      const response = {
        success: true,
        data: {
          findings,
          total: findings.length,
          filtered: findings.length,
          severityBreakdown: {
            critical: 0,
            high: findings.length,
            medium: 0,
            low: 0,
          },
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error in GET /findings/high:', error);
      next(error);
    }
  }
);

/**
 * GET /api/technical-tests/findings/search
 * Search findings with comprehensive filtering
 * 
 * Query Parameters: (same as GET /)
 * - q: search text
 * - severity: critical|high|medium|low
 * - category: Performance|Security|...
 * - since: ISO8601 date
 * - until: ISO8601 date
 * - limit: number
 * - offset: number
 * - component: component name
 */
router.get(
  '/search',
  validateQuery(FindingSearchQuerySchema),
  async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = {
        limit: 10,
        offset: 0,
        ...req.validatedQuery,
      };
      const result = await findingsService.getFindings(query as any);

      const response = {
        success: true,
        data: {
          findings: result.findings,
          total: result.total,
          filtered: result.filtered,
          severityBreakdown: result.severityBreakdown,
          query: query, // Echo back the query for debugging
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error in GET /findings/search:', error);
      next(error);
    }
  }
);

/**
 * GET /api/technical-tests/findings/:id
 * Get a specific finding by ID
 */
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      // Validate UUID
      if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Finding ID must be a valid UUID',
          },
        });
      }

      const finding = await findingsService.getFindingById(id);

      if (!finding) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Finding not found',
          },
        });
      }

      res.json({
        success: true,
        data: finding,
      });
    } catch (error) {
      console.error('Error in GET /findings/:id:', error);
      next(error);
    }
  }
);

/**
 * GET /api/technical-tests/findings/statistics
 * Get findings statistics
 */
router.get(
  '/statistics',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await findingsService.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error in GET /findings/statistics:', error);
      next(error);
    }
  }
);

export default router;
