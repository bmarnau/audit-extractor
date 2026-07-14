/**
 * Build Information Routes
 *
 * Provides system build and version information
 * Used by Dashboard to display build metadata
 *
 * @version 0.34.0
 */

import { Router, Response, NextFunction } from 'express';
import { ApiRequest, createSuccessResponse } from '../server';
import { PROJECT_VERSION } from '../../../version';

const router = Router();

/**
 * GET /api/buildInfo - Get build and version information
 */
router.get('/', async (_req: ApiRequest, res: Response, _next: NextFunction) => {
  try {
    const buildInfo = {
      version: PROJECT_VERSION,
      buildNumber: process.env.BUILD_NUMBER || 'local-build',
      buildTime: process.env.BUILD_TIME || new Date().toISOString(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };

    console.log('[BuildInfo] GET /api/buildInfo', buildInfo);
    res.json(createSuccessResponse(buildInfo));
  } catch (error) {
    console.error('[BuildInfo] Error getting build info:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BUILD_INFO_ERROR',
        message: 'Failed to retrieve build information',
      },
    });
  }
});

export default router;
