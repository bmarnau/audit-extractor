/**
 * Audit Routes - Phase 13
 *
 * REST API für Audit Trail Management mit Serviceintegration
 *
 * @version 0.13.0
 * @phase 13
 */

import { Router, Response, NextFunction } from 'express';
import { ApiRequest, ApiResponseError, createSuccessResponse } from '../server';
import { DocumentAuditReport } from '@domain/AuditCenter';

const router = Router();

/**
 * GET /api/audit/:documentId - Get audit report for document
 */
router.get('/:documentId', async (_req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const documentId = _req.params.documentId as string;
    console.log(`[Audit] GET audit report for document: ${documentId}`);

    if (!documentId || typeof documentId !== 'string' || documentId.trim() === '') {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'documentId is required and must be a non-empty string'
      ));
    }

    // Generate mock audit report
    const report = generateMockAuditReport(documentId);

    console.log(`[Audit] Successfully retrieved audit report: ${report.reportId}`);
    res.json(createSuccessResponse(report, _req));
  } catch (error) {
    console.error(`[Audit] Error retrieving audit report:`, error);
    const err = error as any;
    if (err.statusCode) return next(err);
    return next(new ApiResponseError(
      'AUDIT_FAILED',
      500,
      'Failed to retrieve audit report',
      { error: err.message }
    ));
  }
});

/**
 * GET /api/audit/:documentId/field/:fieldName - Get audit for specific field
 */
router.get('/:documentId/field/:fieldName', async (_req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const documentId = _req.params.documentId as string;
    const fieldName = _req.params.fieldName as string;
    console.log(`[Audit] GET field audit for ${documentId}.${fieldName}`);

    if (!documentId || !fieldName) {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'documentId and fieldName are required'
      ));
    }

    // Generate mock report and extract field record
    const report = generateMockAuditReport(documentId);
    const fieldRecord = report.records.find((r: any) => r.fieldName === fieldName);

    if (!fieldRecord) {
      return next(new ApiResponseError(
        'FIELD_NOT_FOUND',
        404,
        `Field ${fieldName} not found in audit report`
      ));
    }

    console.log(`[Audit] Successfully retrieved field audit for ${fieldName}`);
    res.json(createSuccessResponse(fieldRecord, _req));
  } catch (error) {
    console.error(`[Audit] Error retrieving field audit:`, error);
    const err = error as any;
    if (err.statusCode) return next(err);
    return next(new ApiResponseError(
      'FIELD_AUDIT_FAILED',
      500,
      'Failed to retrieve field audit',
      { error: err.message }
    ));
  }
});

/**
 * POST /api/audit/export - Export audit report in specified format
 */
router.post('/export', async (_req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { documentId, format } = _req.body;
    console.log(`[Audit] Exporting audit report for ${documentId} as ${format}`);

    if (!documentId) {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'documentId is required'
      ));
    }

    if (!['json', 'markdown', 'html'].includes(format)) {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'format must be json, markdown, or html'
      ));
    }

    // Generate audit report
    const report = generateMockAuditReport(documentId);

    // Export in specified format
    let exportedContent: string;
    if (format === 'json') {
      exportedContent = JSON.stringify(report, null, 2);
    } else if (format === 'markdown') {
      exportedContent = formatAuditReportMarkdown(report);
    } else {
      exportedContent = formatAuditReportHtml(report);
    }

    const filename = `audit-${documentId}-${Date.now()}.${format === 'markdown' ? 'md' : format}`;
    
    console.log(`[Audit] Successfully exported audit report: ${filename}`);
    res.json(createSuccessResponse({
      exported: true,
      format,
      filename,
      contentLength: exportedContent.length,
      content: format === 'json' ? JSON.parse(exportedContent) : undefined,
      exportedAt: new Date().toISOString(),
    }, _req));
  } catch (error) {
    console.error(`[Audit] Error exporting audit report:`, error);
    const err = error as any;
    if (err.statusCode) return next(err);
    return next(new ApiResponseError(
      'EXPORT_FAILED',
      500,
      'Failed to export audit report',
      { error: err.message }
    ));
  }
});

// Helper function to generate mock audit report
function generateMockAuditReport(documentId: string): DocumentAuditReport {
  const mockSourceReference = {
    chunkId: 'chunk-1',
    section: 'header',
    pageNumber: 1,
    textSnippet: 'Sample text snippet',
    offset: 0,
    length: 20,
    similarity: 0.95,
    sourceConfidence: 0.98,
  };

  return {
    reportId: `audit-${documentId}-${Date.now()}`,
    documentId,
    documentName: `Document-${documentId}`,
    schemaName: 'invoice',
    records: [
      {
        id: 'r1',
        fieldName: 'invoice_number',
        value: 'INV-2024-001',
        confidence: 0.98,
        sources: [mockSourceReference],
        primarySource: mockSourceReference,
        pageNumbers: [1],
        sections: ['header'],
        sourceChunks: ['Invoice Number: INV-2024-001'],
        validationStatus: 'valid',
        validationMessages: [],
        hallucinationFlags: [],
        extractionMethod: 'llm',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'r2',
        fieldName: 'invoice_date',
        value: '2024-01-15',
        confidence: 0.95,
        sources: [mockSourceReference],
        primarySource: mockSourceReference,
        pageNumbers: [1],
        sections: ['header'],
        sourceChunks: ['Date: 01/15/2024'],
        validationStatus: 'valid',
        validationMessages: [],
        hallucinationFlags: [],
        extractionMethod: 'llm',
        timestamp: new Date().toISOString(),
      },
    ],
    statistics: {
      totalFields: 2,
      validFields: 2,
      partialFields: 0,
      flaggedFields: 0,
      averageConfidence: 0.965,
      fieldsWithSources: 2,
      totalSources: 2,
    },
    qualitySummary: {
      overallQuality: 0.98,
      sourceQuality: 0.95,
      validationQuality: 1.0,
      hallucinationRisk: 0.02,
    },
    issues: [],
    executionSummary: {
      startTime: new Date(Date.now() - 5000).toISOString(),
      endTime: new Date().toISOString(),
      duration: 5000,
      extractor: 'llm-extraction-v1',
      validator: 'hallucination-validator-v1',
    },
    generatedAt: new Date().toISOString(),
    version: '0.37.1',
  };
}

// Helper function to format audit report as Markdown
function formatAuditReportMarkdown(report: DocumentAuditReport): string {
  const md = [
    `# Audit Report: ${report.documentId}`,
    `**Document**: ${report.documentName}`,
    `**Schema**: ${report.schemaName}`,
    `**Generated**: ${report.generatedAt}`,
    `\n## Statistics`,
    `- Total Fields: ${report.statistics.totalFields}`,
    `- Valid Fields: ${report.statistics.validFields}`,
    `- Average Confidence: ${(report.statistics.averageConfidence * 100).toFixed(1)}%`,
    `\n## Records`,
    ...report.records.map((r: any) => [
      `### ${r.fieldName}`,
      `- **Value**: ${r.value || 'N/A'}`,
      `- **Confidence**: ${(r.confidence * 100).toFixed(1)}%`,
      `- **Status**: ${r.validationStatus}`,
    ].join('\n')),
  ];
  return md.join('\n\n');
}

// Helper function to format audit report as HTML
function formatAuditReportHtml(report: DocumentAuditReport): string {
  return `<!DOCTYPE html><html><head><title>Audit Report: ${report.documentId}</title></head><body><h1>Audit Report: ${report.documentId}</h1><table><tr><th>Field</th><th>Value</th><th>Confidence</th></tr>${report.records.map((r: any) => `<tr><td>${r.fieldName}</td><td>${r.value || 'N/A'}</td><td>${(r.confidence * 100).toFixed(1)}%</td></tr>`).join('')}</table></body></html>`;
}

/**
 * GET /api/audit/stats - Get audit statistics
 */
router.get('/stats', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const stats = {
      totalDocuments: 0,
      totalFields: 0,
      averageConfidence: 0,
      hallucinationRiskAverage: 0,
      flaggedFieldsCount: 0,
    };

    res.json(createSuccessResponse(stats, req));
  } catch (error) {
    return next(new ApiResponseError(
      'STATS_FAILED',
      500,
      'Failed to get audit statistics',
      { error: (error as any).message }
    ));
  }
});

export default router;
