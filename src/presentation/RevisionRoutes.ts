/**
 * Phase 15e: Revision System API Routes
 * 
 * Endpoints für Run-History und Comparison
 */

import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { RunComparisonService } from '../application/revision/RunComparisonService';
import { RunHistoryService } from '../application/revision/RunHistoryService';
import { ExtractedRun } from '../domain/model/ExtractedRun';
import { v4 as uuidv4 } from 'uuid';

export const createRevisionRoutes = (): Router => {
  const router = Router();
  
  let comparisonService: RunComparisonService;
  let historyService: RunHistoryService;
  
  try {
    comparisonService = container.resolve(RunComparisonService) as RunComparisonService;
    historyService = container.resolve(RunHistoryService) as RunHistoryService;
  } catch (err) {
    console.error('[RevisionRoutes] Error resolving services:', err);
    throw err;
  }

  // Middleware chain for revision routes
  router.use((_req: any, _res: any, next: any) => {
    next();
  });

  /**
   * POST /api/revision/save-run
   * Save an extraction run with metadata
   */
  router.post('/save-run', async (req: Request, res: Response): Promise<any> => {
    try {
      const {
        documentId,
        documentName,
        ruleSetId,
        extractedFields,
        coverage,
        isValid,
        validationErrors,
        warnings,
        averageConfidence,
        fieldCount,
        successfulFields,
        failedFields,
        executionTimeMs,
        ruleVersion,
        aggressiveness,
        customKeywords,
        status,
        errorMessage,
        notes,
      } = req.body;

      if (!documentId || !ruleSetId) {
        return res.status(400).json({ error: 'documentId and ruleSetId required' });
      }

      const run: ExtractedRun = {
        runId: uuidv4(),
        timestamp: new Date(),
        documentId,
        documentName,
        ruleSetId,
        extractedFields: new Map(Object.entries(extractedFields || {})),
        coverage,
        isValid,
        validationErrors,
        warnings,
        averageConfidence,
        fieldCount,
        successfulFields,
        failedFields: failedFields || [],
        executionTimeMs,
        ruleVersion,
        aggressiveness,
        customKeywords,
        status: status || 'success',
        errorMessage,
        notes,
      };

      await historyService.saveRun(run);

      res.status(201).json({
        runId: run.runId,
        timestamp: run.timestamp,
        coverage: run.coverage,
        message: 'Run saved successfully',
      });
      return;
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  /**
   * GET /api/revision/run/:runId
   * Get a specific run
   */
  router.get('/run/:runId', async (req: Request, res: Response): Promise<any> => {
    try {
      const runId = (req.params.runId as string) || '';
      const run = await historyService.getRun(runId);

      if (!run) {
        return res.status(404).json({ error: 'Run not found' });
      }

      // Convert Map to Object for JSON
      res.json({
        ...run,
        extractedFields: Object.fromEntries(run.extractedFields),
      });
      return;
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  /**
   * GET /api/revision/history/:documentId
   * Get all runs for a document
   */
  router.get('/history/:documentId', async (req: Request, res: Response) => {
    try {
      const documentId = (req.params.documentId as string) || '';
      const runs = await historyService.getRunHistory(documentId);

      res.json({
        documentId,
        runCount: runs.length,
        runs: runs.map((r: ExtractedRun) => ({
          runId: r.runId,
          timestamp: r.timestamp,
          ruleSetId: r.ruleSetId,
          coverage: r.coverage,
          averageConfidence: r.averageConfidence,
          status: r.status,
          fieldCount: r.fieldCount,
          successfulFields: r.successfulFields,
        })),
      });
      return;
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  /**
   * POST /api/revision/compare
   * Compare two extraction runs
   */
  router.post('/compare', async (req: Request, res: Response): Promise<any> => {
    try {
      const run1Id = (req.body.run1Id as string) || '';
      const run2Id = (req.body.run2Id as string) || '';

      if (!run1Id || !run2Id) {
        return res.status(400).json({ error: 'run1Id and run2Id required' });
      }

      const run1 = await historyService.getRun(run1Id);
      const run2 = await historyService.getRun(run2Id);

      if (!run1 || !run2) {
        return res.status(404).json({ error: 'One or both runs not found' });
      }

      const comparison = await comparisonService.compareRuns(run1, run2);

      res.json({
        similarities: comparison.similarities,
        totalChanges: comparison.totalChanges,
        highImpactChanges: comparison.highImpactChanges,
        coverageChange: comparison.coverageChange,
        confidenceChange: comparison.confidenceChange,
        addedFields: comparison.addedFields,
        removedFields: comparison.removedFields,
        modifiedFields: comparison.modifiedFields,
        differences: comparison.differences.map((d: any) => ({
          field: d.field,
          oldValue: d.oldValue,
          newValue: d.newValue,
          severity: d.severity,
          explanation: d.explanation,
        })),
        changesSummary: comparisonService.generateChangesSummary(comparison),
      });
      return;
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  /**
   * GET /api/revision/runs?filter=...
   * List runs with filtering
   */
  router.get('/runs', async (req: Request, res: any): Promise<any> => {
    try {
      let { documentId, ruleSetId, status, limit = '20', offset = '0', search } = req.query;

      // Ensure strings
      if (Array.isArray(limit)) limit = limit[0];
      if (Array.isArray(offset)) offset = offset[0];
      if (Array.isArray(search)) search = search[0];
      if (Array.isArray(documentId)) documentId = documentId[0];
      if (Array.isArray(ruleSetId)) ruleSetId = ruleSetId[0];
      if (Array.isArray(status)) status = status[0];

      if (typeof ruleSetId === 'string' && ruleSetId.includes(',')) {
        ruleSetId = ruleSetId.split(',')[0];
      }
      if (typeof status === 'string' && status.includes(',')) {
        status = status.split(',')[0];
      }

      let runs;

      if (search) {
        runs = await historyService.searchRuns(search as string);
      } else {
        const filter = {
          documentId: documentId as string | undefined,
          ruleSetId: ruleSetId as string | undefined,
          status: status as any,
        };

        runs = await historyService.listRuns(
          filter,
          parseInt(limit as string),
          parseInt(offset as string),
        );
      }

      res.json({
        runCount: runs.length,
        runs: runs.map((r: ExtractedRun) => ({
          runId: r.runId,
          timestamp: r.timestamp,
          documentId: r.documentId,
          documentName: r.documentName,
          ruleSetId: r.ruleSetId,
          coverage: r.coverage,
          averageConfidence: r.averageConfidence,
          status: r.status,
          fieldCount: r.fieldCount,
        })),
      });
      return;
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  /**
   * DELETE /api/revision/run/:runId
   * Delete a run
   */
  router.delete('/run/:runId', async (req: Request, res: Response) => {
    try {
      const runId = (req.params.runId as string) || '';
      await historyService.deleteRun(runId);

      res.json({ message: 'Run deleted successfully' });
      return;
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  /**
   * POST /api/revision/stats
   * Get statistics about runs
   */
  router.post('/stats', async (req: Request, res: Response) => {
    try {
      const { documentId, ruleSetId } = req.body;

      const filter = {
        documentId,
        ruleSetId,
      };

      const totalRuns = await historyService.countRuns(filter);
      const allRuns = await historyService.listRuns(filter, 10000);

      const avgCoverage =
        allRuns.length > 0
          ? allRuns.reduce((sum: number, r: ExtractedRun) => sum + r.coverage, 0) / allRuns.length
          : 0;

      const avgConfidence =
        allRuns.length > 0
          ? allRuns.reduce((sum: number, r: ExtractedRun) => sum + r.averageConfidence, 0) / allRuns.length
          : 0;

      const successCount = allRuns.filter((r: ExtractedRun) => r.status === 'success').length;
      const partialCount = allRuns.filter((r: ExtractedRun) => r.status === 'partial').length;
      const failedCount = allRuns.filter((r: ExtractedRun) => r.status === 'failed').length;

      res.json({
        totalRuns,
        successCount,
        partialCount,
        failedCount,
        averageCoverage: Math.round(avgCoverage * 100) / 100,
        averageConfidence: Math.round(avgConfidence * 100) / 100,
        successRate:
          totalRuns > 0 ? Math.round((successCount / totalRuns) * 100) : 0,
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  console.log('[RevisionRoutes] Router created with', router.stack?.length || 0, 'layers');
  return router;
};
