/**
 * PDF Export API Controller
 * HTTP endpoints for exporting reports
 * 
 * @version 0.37.0
 * @phase 43D
 */

import { Router, Request, Response, NextFunction } from 'express';
import { findingsService } from '../services/findings.service.js';
import { recommendationsService } from '../services/recommendations.service.js';
import { pdfExportService } from '../services/pdf-export.service.js';

const router = Router();

/**
 * POST /api/technical-tests/export/pdf
 * Generate and download PDF report
 */
router.post(
  '/pdf',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, author, includeFindings, includeRecommendations, includeSummary, format } = req.body;

      // Fetch findings and recommendations
      const findingsResult = await findingsService.getFindings({
        limit: 1000,
        offset: 0,
      });
      const recommendationsResult = await recommendationsService.getRecommendations({
        limit: 1000,
        offset: 0,
      });

      // Generate PDF
      const pdfResult = await pdfExportService.generateReport(
        findingsResult.findings,
        recommendationsResult.recommendations,
        {
          title: title || 'Technical Audit Report',
          author,
          includeFindings: includeFindings !== false,
          includeRecommendations: includeRecommendations !== false,
          includeSummary: includeSummary !== false,
          format: (format as 'A4' | 'Letter') || 'A4',
        }
      );

      if (!pdfResult.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'PDF_GENERATION_FAILED',
            message: pdfResult.error || 'PDF generation failed',
          },
        });
      }

      res.json({
        success: true,
        data: {
          filename: pdfResult.filename,
          size: pdfResult.size,
          generatedAt: pdfResult.generatedAt,
          downloadUrl: `/api/technical-tests/export/download/${pdfResult.filename}`,
        },
      });
    } catch (error) {
      console.error('Error in POST /export/pdf:', error);
      next(error);
    }
  }
);

/**
 * POST /api/technical-tests/export/csv
 * Generate CSV export
 */
router.post(
  '/csv',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const findingsResult = await findingsService.getFindings({
        limit: 1000,
        offset: 0,
      });
      const recommendationsResult = await recommendationsService.getRecommendations({
        limit: 1000,
        offset: 0,
      });

      const csv = await pdfExportService.generateCSV(
        findingsResult.findings,
        recommendationsResult.recommendations
      );

      const filename = `technical-audit-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      console.error('Error in POST /export/csv:', error);
      next(error);
    }
  }
);

/**
 * POST /api/technical-tests/export/json
 * Generate JSON export
 */
router.post(
  '/json',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const findingsResult = await findingsService.getFindings({
        limit: 1000,
        offset: 0,
      });
      const recommendationsResult = await recommendationsService.getRecommendations({
        limit: 1000,
        offset: 0,
      });

      const json = await pdfExportService.generateJSON(
        findingsResult.findings,
        recommendationsResult.recommendations
      );

      const filename = `technical-audit-${new Date().toISOString().split('T')[0]}.json`;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(json);
    } catch (error) {
      console.error('Error in POST /export/json:', error);
      next(error);
    }
  }
);

export default router;
