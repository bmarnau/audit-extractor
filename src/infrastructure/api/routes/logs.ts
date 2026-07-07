/**
 * Log Viewer Routes - Phase 13
 *
 * REST API für Log Viewing und Verwaltung mit Serviceintegration
 *
 * @version 0.13.0
 * @phase 13
 */

import { Router, Response, NextFunction } from 'express';
import { ApiRequest, ApiResponseError, createSuccessResponse } from '../server';

const router = Router();

/**
 * GET /api/logs - Get logs with multi-dimensional filtering
 */
router.get('/', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const offset = parseInt(req.query.offset as string) || 0;
    const query = req.query.query as string;
    const sources = req.query.source ? (req.query.source as string).split(',') : undefined;
    const levels = req.query.level ? (req.query.level as string).split(',') : undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    console.log(`[Logs] Fetching logs: limit=${limit} offset=${offset} query="${query}"`);

    // Load mock logs (in production, would be from database)
    const allLogs = getMockLogs();

    // Apply filters
    let filtered = allLogs;
    
    if (query) {
      const queryLower = query.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(queryLower) || 
        JSON.stringify(log.context || {}).toLowerCase().includes(queryLower)
      );
    }

    if (sources && sources.length > 0) {
      filtered = filtered.filter(log => sources.includes(log.source));
    }

    if (levels && levels.length > 0) {
      filtered = filtered.filter(log => levels.includes(log.level));
    }

    if (startDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= endDate);
    }

    const totalCount = filtered.length;
    const logs = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;

    console.log(`[Logs] Returned ${logs.length} logs (total: ${totalCount})`);
    res.json(createSuccessResponse({
      logs,
      totalCount,
      hasMore,
      limit,
      offset,
      filterUsed: { query, sources, levels, startDate, endDate },
    }));
  } catch (error) {
    console.error(`[Logs] Search error:`, error);
    const err = error as any;
    return next(new ApiResponseError(
      'LOG_SEARCH_FAILED',
      500,
      'Failed to search logs',
      { error: err.message }
    ));
  }
});

/**
 * GET /api/logs/sources - Get available log sources
 */
router.get('/sources', async (_req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const sources = ['parser', 'llm', 'validator', 'api', 'system'];

    res.json(createSuccessResponse({ sources }));
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
 * GET /api/logs/stats - Get log statistics
 */
router.get('/stats', async (_req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const stats = {
      totalEntries: 0,
      bySource: {},
      byLevel: {},
      errorCount: 0,
      warningCount: 0,
      averageResponseTime: 0,
      storageSize: 0,
    };

    res.json(createSuccessResponse(stats));
  } catch (error) {
    return next(new ApiResponseError(
      'STATS_FAILED',
      500,
      'Failed to get log statistics',
      { error: (error as any).message }
    ));
  }
});

/**
 * POST /api/logs/export - Export logs in specified format
 */
router.post('/export', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { format, filter, limit } = req.body;
    console.log(`[Logs] Exporting logs as ${format}`);

    if (!['json', 'csv', 'txt'].includes(format)) {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'format must be json, csv, or txt'
      ));
    }

    // Load all logs
    let logs = getMockLogs();
    
    // Apply filter if provided
    if (filter) {
      if (filter.query) {
        const q = filter.query.toLowerCase();
        logs = logs.filter((l: any) => l.message.toLowerCase().includes(q));
      }
      if (filter.levels && filter.levels.length > 0) {
        logs = logs.filter((l: any) => filter.levels.includes(l.level));
      }
      if (filter.sources && filter.sources.length > 0) {
        logs = logs.filter((l: any) => filter.sources.includes(l.source));
      }
    }

    // Limit results
    const limitNum = Math.min(limit || 10000, 50000);
    logs = logs.slice(0, limitNum);

    // Format export
    let exportedContent: string;
    if (format === 'json') {
      exportedContent = JSON.stringify(logs, null, 2);
    } else if (format === 'csv') {
      const headers = ['timestamp', 'level', 'source', 'message'];
      const rows = [headers.join(','), ...logs.map((l: any) => [
        `"${l.timestamp}"`,
        l.level,
        l.source,
        `"${l.message.replace(/"/g, '""')}"`,
      ].join(','))];
      exportedContent = rows.join('\n');
    } else {
      exportedContent = logs.map((l: any) => 
        `[${l.timestamp}] [${l.level}] [${l.source}] ${l.message}`
      ).join('\n');
    }

    const filename = `logs-export-${Date.now()}.${format}`;
    console.log(`[Logs] Successfully exported ${logs.length} log entries to ${filename}`);
    
    res.json(createSuccessResponse({
      exported: true,
      format,
      filename,
      entryCount: logs.length,
      contentLength: exportedContent.length,
      exportedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error(`[Logs] Export error:`, error);
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
 */
router.delete('/cleanup', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { retentionDays } = req.body;
    console.log(`[Logs] Cleanup request: retentionDays=${retentionDays}`);

    if (!retentionDays || retentionDays < 1) {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'retentionDays must be at least 1'
      ));
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // In production, would delete from database
    // For now, simulate cleanup
    const allLogs = getMockLogs();
    const logsToKeep = allLogs.filter(log => new Date(log.timestamp) > cutoffDate);
    const removedCount = allLogs.length - logsToKeep.length;

    const result = {
      cleaned: true,
      removedCount,
      cutoffDate: cutoffDate.toISOString(),
      cleanedAt: new Date().toISOString(),
    };

    console.log(`[Logs] Cleanup completed: removed ${removedCount} entries`);
    res.json(createSuccessResponse(result));
  } catch (error) {
    console.error(`[Logs] Cleanup error:`, error);
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
 * GET /api/logs/level/:level - Get logs by level
 */
router.get('/level/:level', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const level = req.params.level as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);

    if (!['debug', 'info', 'warn', 'error'].includes(level)) {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'level must be debug, info, warn, or error'
      ));
    }

    console.log(`[Logs] Getting logs by level: ${level}`);

    // Get all logs and filter by level
    const allLogs = getMockLogs();
    const filtered = allLogs.filter(log => log.level === level).slice(0, limit);

    console.log(`[Logs] Retrieved ${filtered.length} logs with level ${level}`);
    res.json(createSuccessResponse({
      logs: filtered,
      totalCount: filtered.length,
      level,
      limit,
    }));
  } catch (error) {
    console.error(`[Logs] Level filtering error:`, error);
    const err = error as any;
    return next(new ApiResponseError(
      'LOG_LEVEL_FAILED',
      500,
      'Failed to get logs by level',
      { error: err.message }
    ));
  }
});

// Helper function to get mock logs
function getMockLogs(): any[] {
  const sources = ['parser', 'llm', 'validator', 'api', 'system'];
  const levels = ['debug', 'info', 'warn', 'error'];
  const baseTime = Date.now();
  const logs = [];

  for (let i = 0; i < 100; i++) {
    logs.push({
      id: `log-${i}`,
      timestamp: new Date(baseTime - i * 60000).toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      message: generateLogMessage(),
      context: {
        documentId: `doc-${Math.floor(Math.random() * 10)}`,
        userId: 'user-123',
        duration: Math.floor(Math.random() * 5000),
      },
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function generateLogMessage(): string {
  const messages = [
    'Document parsed successfully',
    'LLM extraction completed',
    'Validation rule applied',
    'Confidence score calculated',
    'Hallucination detection running',
    'Backup created',
    'Configuration updated',
    'Error during processing',
    'Timeout in extraction',
    'Invalid input detected',
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export default router;
