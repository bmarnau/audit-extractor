/**
 * Recommendations API Controller
 * HTTP endpoints for technical audit recommendations
 * 
 * @version 0.37.0
 * @phase 43B
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  RecommendationSearchQuerySchema,
  RecommendationDTOSchema,
  RecommendationsListResponseSchema,
} from '../dtos/technical-audit.dto.js';
import { recommendationsService } from '../services/recommendations.service.js';

const router = Router();

interface ValidatedRequest extends Request {
  validatedQuery?: Record<string, any>;
}

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
 * GET /api/technical-tests/recommendations
 */
router.get(
  '/',
  validateQuery(RecommendationSearchQuerySchema),
  async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = {
        limit: 10,
        offset: 0,
        ...req.validatedQuery,
      };
      const result = await recommendationsService.getRecommendations(query as any);

      const response = {
        success: true,
        data: {
          recommendations: result.recommendations,
          total: result.total,
          byPriority: result.byPriority,
          byStatus: result.byStatus,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error in GET /recommendations:', error);
      next(error);
    }
  }
);

/**
 * GET /api/technical-tests/recommendations/priority/:priority
 */
router.get(
  '/priority/:priority',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const priority = Array.isArray(req.params.priority) ? req.params.priority[0] : req.params.priority;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

      const validPriorities = ['Sofort erforderlich', 'Kurzfristig empfohlen', 'Mittelfristig empfohlen', 'Optional'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PRIORITY',
            message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
          },
        });
      }

      const recommendations = await recommendationsService.getByPriority(priority, limit);

      res.json({
        success: true,
        data: {
          recommendations,
          total: recommendations.length,
          byStatus: {
            'open': recommendations.filter(r => r.status === 'open').length,
            'in-progress': recommendations.filter(r => r.status === 'in-progress').length,
            'completed': recommendations.filter(r => r.status === 'completed').length,
          },
        },
      });
    } catch (error) {
      console.error('Error in GET /recommendations/priority/:priority:', error);
      next(error);
    }
  }
);

/**
 * GET /api/technical-tests/recommendations/status/:status
 */
router.get(
  '/status/:status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = Array.isArray(req.params.status) ? req.params.status[0] : req.params.status;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

      const validStatuses = ['open', 'in-progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
        });
      }

      const recommendations = await recommendationsService.getByStatus(status, limit);

      res.json({
        success: true,
        data: {
          recommendations,
          total: recommendations.length,
        },
      });
    } catch (error) {
      console.error('Error in GET /recommendations/status/:status:', error);
      next(error);
    }
  }
);

/**
 * GET /api/technical-tests/recommendations/:id
 */
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Recommendation ID must be a valid UUID',
          },
        });
      }

      const recommendation = await recommendationsService.getRecommendationById(id);

      if (!recommendation) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Recommendation not found',
          },
        });
      }

      res.json({
        success: true,
        data: recommendation,
      });
    } catch (error) {
      console.error('Error in GET /recommendations/:id:', error);
      next(error);
    }
  }
);

/**
 * GET /api/technical-tests/recommendations/statistics
 */
router.get(
  '/statistics',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await recommendationsService.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error in GET /recommendations/statistics:', error);
      next(error);
    }
  }
);

export default router;
