/**
 * Log Viewer Routes - Phase 20
 *
 * REST API für Log Viewing mit PostgreSQL Persistenz
 * Unterstützt: Filtering, Search, Stats, Export (JSON/CSV)
 *
 * @version 0.20.0
 * @phase 20
 */

import { Router, Response, NextFunction } from 'express';
import { ApiRequest, ApiResponseError, createSuccessResponse } from '../server';
import { AuditLogRepository } from '../../repositories/AuditLogRepository';

const router = Router();
const logRepository = new AuditLogRepository();

/**
 * GET /api/logs - Query logs with multi-dimensional filtering
 * Query params: limit, offset, levels, sources, startDate, endDate, search, documentId, field
 */
router.get('/', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const offset = parseInt(req.query.offset as string) || 0;
    const searchQuery = req.query.search as string | undefined;
    const levels = req.query.levels ? (req.query.levels as string).split(',') : undefined;
    const sources = req.query.sources ? (req.query.sources as string).split(',') : undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const documentId = req.query.documentId as string | undefined;
    const field = req.query.field as string | undefined;

    console.log(`[LogViewer] Query logs: limit=${limit}, search="${searchQuery}", levels=${levels?.join(',')}`);

    const { logs, total } = await logRepository.query({
      limit,
      offset,
      levels,
      sources,
      startDate,
      endDate,
      searchQuery,
      documentId,
      field,
    });

    const hasMore = offset + limit < total;

    console.log(`[LogViewer] Returned ${logs.length} logs (total: ${total})`);
    res.json(createSuccessResponse({
      logs: logs.map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level,
        source: log.source,
        message: log.message,
        documentId: log.documentId,
        field: log.field,
        duration: log.duration,
        requestId: log.requestId,
        context: log.context,
      })),
      totalCount: total,
      hasMore,
      limit,
      offset,
    }, req));
  } catch (error) {
    console.error(`[LogViewer] Query error:`, error);
    const err = error as any;
    return next(new ApiResponseError(
      'LOG_QUERY_FAILED',
      500,
      'Failed to query logs',
      { error: err.message }
    ));
  }
});

/**
 * GET /api/logs/stats - Get log statistics
 */
router.get('/stats', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await logRepository.getStatistics();

    res.json(createSuccessResponse({
      totalEntries: stats.totalEntries,
      byLevel: stats.byLevel,
      bySource: stats.bySource,
      errorCount: stats.errorCount,
      warningCount: stats.warningCount,
      last24Hours: stats.last24Hours,
      generatedAt: new Date().toISOString(),
    }, req));
  } catch (error) {
    console.error(`[LogViewer] Stats error:`, error);
    const err = error as any;
    return next(new ApiResponseError(
      'LOG_STATS_FAILED',
      500,
      'Failed to get log statistics',
      { error: err.message }
    ));
  }
});

/**
 * GET /api/logs/sources - Get available log sources
 */
router.get('/sources', async (_req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const sources = ['parser', 'llm', 'validator', 'api', 'system', 'schema', 'extraction'];
    const levels = ['debug', 'info', 'warn', 'error'];

    res.json(createSuccessResponse({ sources, levels }, _req));
  } catch (error) {
    return next(new ApiResponseError(
      'SOURCES_FAILED',
      500,
      'Failed to get log sources',
      { error: (error as any).message }
    ));
  }
});

/**
 * POST /api/logs/export - Export logs in specified format (json, csv)
 * Body: { format: 'json'|'csv', levels?: [], sources?: [], startDate?: ISO, endDate?: ISO, limit?: number }
 */
router.post('/export', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { format, levels, sources, startDate, endDate, limit } = req.body;

    if (!['json', 'csv'].includes(format)) {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'format must be json or csv'
      ));
    }

    console.log(`[LogViewer] Exporting logs as ${format}`);

    const filter = {
      limit: Math.min(limit || 10000, 50000),
      levels,
      sources,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    let exportedContent: string;
    const filename = `logs-${format}-${new Date().toISOString().slice(0, 10)}.${format}`;

    if (format === 'json') {
      exportedContent = await logRepository.exportAsJson(filter);
    } else {
      exportedContent = await logRepository.exportAsCsv(filter);
    }

    console.log(`[LogViewer] Exported ${(exportedContent.match(/\n/g) || []).length + 1} entries`);

    res.json(createSuccessResponse({
      exported: true,
      format,
      filename,
      contentLength: exportedContent.length,
      exportedAt: new Date().toISOString(),
      dataUrl: `data:text/${format === 'csv' ? 'csv' : 'json'};charset=utf-8,${encodeURIComponent(exportedContent)}`,
    }, req));
  } catch (error) {
    console.error(`[LogViewer] Export error:`, error);
    const err = error as any;
    return next(new ApiResponseError(
      'EXPORT_FAILED',
      500,
      'Failed to export logs',
      { error: err.message }
    ));
  }
});

/**
 * DELETE /api/logs/cleanup - Cleanup old logs based on retention policy
 * Body: { daysToRetain: number }
 */
router.delete('/cleanup', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { daysToRetain } = req.body;

    if (!daysToRetain || daysToRetain < 1 || daysToRetain > 365) {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'daysToRetain must be between 1 and 365'
      ));
    }

    console.log(`[LogViewer] Cleanup: removing logs older than ${daysToRetain} days`);

    const removedCount = await logRepository.clearOldLogs(daysToRetain);

    res.json(createSuccessResponse({
      cleaned: true,
      removedCount,
      daysRetained: daysToRetain,
      cutoffDate: new Date(Date.now() - daysToRetain * 24 * 60 * 60 * 1000).toISOString(),
      cleanedAt: new Date().toISOString(),
    }, req));
  } catch (error) {
    console.error(`[LogViewer] Cleanup error:`, error);
    const err = error as any;
    return next(new ApiResponseError(
      'CLEANUP_FAILED',
      500,
      'Failed to cleanup logs',
      { error: err.message }
    ));
  }
});

/**
 * POST /api/logs/create - Create a log entry (for internal use)
 * Body: { level, source, message, context?, documentId?, field? }
 */
router.post('/create', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { level, source, message, context, documentId, field, duration, requestId } = req.body;

    if (!level || !source || !message) {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'level, source, and message are required'
      ));
    }

    const logEntry = await logRepository.log({
      level: level as any,
      source: source as any,
      message,
      context,
      documentId,
      field,
      duration,
      requestId,
    });

    res.status(201).json(createSuccessResponse({
      id: logEntry.id,
      timestamp: logEntry.timestamp,
      message: 'Log entry created',
    }, req));
  } catch (error) {
    console.error(`[LogViewer] Create error:`, error);
    const err = error as any;
    return next(new ApiResponseError(
      'LOG_CREATE_FAILED',
      500,
      'Failed to create log entry',
      { error: err.message }
    ));
  }
});

export default router;
