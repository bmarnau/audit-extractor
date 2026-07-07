/**
 * Configuration Routes - Phase 13
 *
 * REST API für Konfigurationsverwaltung
 *
 * @version 0.13.0
 * @phase 13
 */

import { Router, Response, NextFunction } from 'express';
import { ApiRequest, ApiResponseError, createSuccessResponse } from '../server';
import { resolveService } from '@infrastructure/di/ServiceContainer';
import { ConfigManager } from '@infrastructure/config/ConfigManager';

const router = Router();

// Lazy resolve to avoid DI container initialization order issues
function getConfigManager() {
  return resolveService(ConfigManager);
}

/**
 * GET /api/config - Get current configuration
 */
router.get('/', async (_req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const config = getConfigManager().getConfig();
    res.json(createSuccessResponse(config));
  } catch (error) {
    return next(new ApiResponseError(
      'CONFIG_LOAD_FAILED',
      500,
      'Failed to load configuration',
      { error: (error as any).message }
    ));
  }
});

/**
 * PUT /api/config - Update entire configuration
 */
router.put('/', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { updates, changedBy, reason } = req.body;

    if (!updates) {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'updates field is required'
      ));
    }

    const updatedConfig = await getConfigManager().updateConfig(
      updates,
      changedBy,
      reason
    );

    res.json(createSuccessResponse(updatedConfig));
  } catch (error) {
    return next(new ApiResponseError(
      'CONFIG_UPDATE_FAILED',
      500,
      'Failed to update configuration',
      { error: (error as any).message }
    ));
  }
});

/**
 * PATCH /api/config/:section - Update specific section
 */
router.patch('/:section', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const section = (req.params.section as string);
    const { updates, changedBy, reason } = req.body;

    const validSections = ['chunking', 'confidence', 'llm', 'system'];
    if (!validSections.includes(section)) {
      return next(new ApiResponseError(
        'INVALID_SECTION',
        400,
        `Section must be one of: ${validSections.join(', ')}`
      ));
    }

    if (!updates) {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'updates field is required'
      ));
    }

    const updatedConfig = await getConfigManager().updateSection(
      section as 'chunking' | 'confidence' | 'llm' | 'system',
      updates,
      changedBy,
      reason
    );

    res.json(createSuccessResponse(updatedConfig));
  } catch (error) {
    return next(new ApiResponseError(
      'CONFIG_UPDATE_FAILED',
      500,
      'Failed to update configuration section',
      { error: (error as any).message }
    ));
  }
});

/**
 * GET /api/config/changes - Get configuration change history
 */
router.get('/changes', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const changes = getConfigManager().getChanges(limit);

    res.json(createSuccessResponse({
      changes,
      total: changes.length,
    }));
  } catch (error) {
    return next(new ApiResponseError(
      'CHANGELOG_LOAD_FAILED',
      500,
      'Failed to load changelog',
      { error: (error as any).message }
    ));
  }
});

/**
 * GET /api/config/changes/:changeId - Get specific change
 */
router.get('/changes/:changeId', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const changeId = (req.params.changeId as string);
    const change = getConfigManager().getChange(changeId);

    if (!change) {
      return next(new ApiResponseError(
        'CHANGE_NOT_FOUND',
        404,
        `Change ${changeId} not found`
      ));
    }

    res.json(createSuccessResponse(change));
  } catch (error) {
    return next(new ApiResponseError(
      'CHANGE_LOAD_FAILED',
      500,
      'Failed to load change record',
      { error: (error as any).message }
    ));
  }
});

/**
 * POST /api/config/revert/:version - Revert to previous version
 */
router.post('/revert/:version', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const version = req.params.version as string;

    const reverted = await getConfigManager().revertToVersion(parseInt(version));

    res.json(createSuccessResponse({
      message: `Reverted to configuration v${version}`,
      config: reverted,
    }));
  } catch (error) {
    return next(new ApiResponseError(
      'REVERT_FAILED',
      500,
      'Failed to revert configuration',
      { error: (error as any).message }
    ));
  }
});

/**
 * POST /api/config/export - Export configuration as JSON
 */
router.post('/export', async (_req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const exportedJson = getConfigManager().exportConfig();

    res.json(createSuccessResponse({
      exported: true,
      json: exportedJson,
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    return next(new ApiResponseError(
      'EXPORT_FAILED',
      500,
      'Failed to export configuration',
      { error: (error as any).message }
    ));
  }
});

/**
 * POST /api/config/import - Import configuration from JSON
 */
router.post('/import', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { json, changedBy, reason } = req.body;

    if (!json) {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'json field is required'
      ));
    }

    const imported = await getConfigManager().importConfig(
      json,
      changedBy,
      reason
    );

    res.json(createSuccessResponse({
      message: 'Configuration imported successfully',
      config: imported,
    }));
  } catch (error) {
    return next(new ApiResponseError(
      'IMPORT_FAILED',
      500,
      'Failed to import configuration',
      { error: (error as any).message }
    ));
  }
});

/**
 * GET /api/config/stats - Get configuration statistics
 */
router.get('/stats', async (_req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const stats = getConfigManager().getStats();
    res.json(createSuccessResponse(stats));
  } catch (error) {
    return next(new ApiResponseError(
      'STATS_FAILED',
      500,
      'Failed to get configuration statistics',
      { error: (error as any).message }
    ));
  }
});

/**
 * GET /api/config/audit - Get audit trail
 */
router.get('/audit', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const auditTrail = getConfigManager().getAuditTrail(limit);

    res.json(createSuccessResponse({
      auditTrail,
      total: auditTrail.length,
    }));
  } catch (error) {
    return next(new ApiResponseError(
      'AUDIT_FAILED',
      500,
      'Failed to get audit trail',
      { error: (error as any).message }
    ));
  }
});

export default router;
