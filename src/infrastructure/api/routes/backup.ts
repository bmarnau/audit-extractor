/**
 * Backup Routes - Phase 13
 *
 * REST API für Backup- und Restore-Verwaltung
 *
 * @version 0.13.0
 * @phase 13
 */

import { Router, Response, NextFunction } from 'express';
import { ApiRequest, ApiResponseError, createSuccessResponse } from '../server';
import { resolveService } from '@infrastructure/di/ServiceContainer';
import { BackupService } from '@infrastructure/services/BackupService';

const router = Router();

// Lazy resolve to avoid DI container initialization order issues
function getBackupService() {
  return resolveService(BackupService);
}

/**
 * POST /api/backup/create - Create backup
 */
router.post('/create', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { backupName, reason, backupBy } = req.body;

    if (!backupName) {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'backupName is required'
      ));
    }

    const backup = await getBackupService().createBackup(backupName, reason, backupBy);

    console.log('[Backup Route] Created backup:', {
      backupId: backup.backupId,
      status: backup.status,
      totalSize: backup.totalSize,
      duration: backup.duration,
    });

    res.json(createSuccessResponse({
      backupId: backup.backupId,
      status: backup.status,
      message: `Backup "${backupName}" created successfully`,
      backup,
    }));
  } catch (error) {
    return next(new ApiResponseError(
      'BACKUP_CREATE_FAILED',
      500,
      'Failed to create backup',
      { error: (error as any).message }
    ));
  }
});

/**
 * GET /api/backup/list - List backups
 */
router.get('/list', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const backups = await getBackupService().listBackups(limit);

    res.json(createSuccessResponse({
      backups,
      total: backups.length,
      limit,
    }));
  } catch (error) {
    return next(new ApiResponseError(
      'BACKUP_LIST_FAILED',
      500,
      'Failed to list backups',
      { error: (error as any).message }
    ));
  }
});

/**
 * GET /api/backup/stats - Get backup statistics
 * MUST be before /:backupId route to avoid being matched as a backupId
 */
router.get('/stats', async (_req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getBackupService().getStatistics();

    res.json(createSuccessResponse({
      statistics: stats,
    }));
  } catch (error) {
    return next(new ApiResponseError(
      'STATS_FAILED',
      500,
      'Failed to get backup statistics',
      { error: (error as any).message }
    ));
  }
});

/**
 * GET /api/backup/:backupId/download - Download backup file
 * MUST be before /:backupId route to match properly
 */
router.get('/:backupId/download', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const backupId = req.params.backupId as string;
    const filePath = await getBackupService().getBackupFile(backupId);

    res.download(filePath, `${backupId}.tar.gz`, (err: any) => {
      if (err) {
        console.error('Failed to download backup:', err);
      }
    });
  } catch (error) {
    return next(new ApiResponseError(
      'BACKUP_DOWNLOAD_FAILED',
      500,
      'Failed to download backup',
      { error: (error as any).message }
    ));
  }
});

/**
 * GET /api/backup/:backupId - Get backup details
 */
router.get('/:backupId', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const backupId = req.params.backupId as string;
    const backup = await getBackupService().getBackup(backupId);

    if (!backup) {
      return next(new ApiResponseError(
        'BACKUP_NOT_FOUND',
        404,
        `Backup ${backupId} not found`
      ));
    }

    res.json(createSuccessResponse(backup));
  } catch (error) {
    return next(new ApiResponseError(
      'BACKUP_DETAILS_FAILED',
      500,
      'Failed to get backup details',
      { error: (error as any).message }
    ));
  }
});

/**
 * POST /api/backup/:backupId/restore - Restore from backup
 */
router.post('/:backupId/restore', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const backupId = req.params.backupId as string;
    const { targetLocation, overwrite, items, verifyChecksums, reason, restoreBy } = req.body;

    if (!targetLocation) {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'targetLocation is required'
      ));
    }

    const result = await getBackupService().restoreFromBackup({
      backupId,
      targetLocation,
      items,
      overwrite: overwrite !== false,
      verifyChecksums: verifyChecksums === true,
      reason,
      restoredBy: restoreBy,
    });

    res.json(createSuccessResponse({
      restoreId: result.restoreId,
      status: result.status,
      message: `Restore started successfully`,
      result,
    }));
  } catch (error) {
    return next(new ApiResponseError(
      'RESTORE_FAILED',
      500,
      'Failed to restore from backup',
      { error: (error as any).message }
    ));
  }
});

/**
 * DELETE /api/backup/:backupId - Delete backup
 */
router.delete('/:backupId', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const backupId = req.params.backupId as string;
    // reason and deletedBy from req.body could be used for audit logging

    await getBackupService().deleteBackup(backupId);

    res.json(createSuccessResponse({
      message: `Backup ${backupId} deleted successfully`,
      deletedAt: new Date().toISOString(),
    }));
  } catch (error) {
    return next(new ApiResponseError(
      'BACKUP_DELETE_FAILED',
      500,
      'Failed to delete backup',
      { error: (error as any).message }
    ));
  }
});

export default router;
