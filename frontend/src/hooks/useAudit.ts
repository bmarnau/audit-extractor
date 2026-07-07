/**
 * useAudit Hook - Audit Trail Management
 *
 * GET operations für Audit-Report-Abfragen mit Export
 *
 * @version 0.13.0
 * @phase 13
 */

import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface DocumentAuditReport {
  reportId: string;
  documentId: string;
  documentName: string;
  schemaName: string;
  records: Array<{
    id: string;
    fieldName: string;
    value: string;
    confidence: number;
    validationStatus: 'valid' | 'partial' | 'flagged';
    sources: Array<{
      chunkId: string;
      section: string;
      pageNumber: number;
      textSnippet: string;
      similarity: number;
    }>;
  }>;
  statistics: {
    totalFields: number;
    validFields: number;
    partialFields: number;
    flaggedFields: number;
    averageConfidence: number;
  };
  qualitySummary: string;
}

interface UseAuditResult {
  loading: boolean;
  error: string | null;
  fetchAuditReport: (documentId: string) => Promise<DocumentAuditReport>;
  exportAuditReport: (report: DocumentAuditReport, format: 'json' | 'markdown') => string;
}

export function useAudit(): UseAuditResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditReport = useCallback(async (documentId: string): Promise<DocumentAuditReport> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/audit/${documentId}`);
      if (!response.ok) throw new Error(`Failed to fetch audit report: ${response.statusText}`);
      const data = await response.json();
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch audit report';
      setError(message);
      console.error('[useAudit] Fetch failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportAuditReport = useCallback(
    (report: DocumentAuditReport, format: 'json' | 'markdown'): string => {
      if (format === 'json') {
        return JSON.stringify(report, null, 2);
      }

      // Markdown format
      let md = `# Audit Report\n\n`;
      md += `**Document:** ${report.documentName}\n`;
      md += `**Schema:** ${report.schemaName}\n`;
      md += `**Report ID:** ${report.reportId}\n\n`;

      md += `## Statistics\n\n`;
      md += `- Total Fields: ${report.statistics.totalFields}\n`;
      md += `- Valid: ${report.statistics.validFields}\n`;
      md += `- Partial: ${report.statistics.partialFields}\n`;
      md += `- Flagged: ${report.statistics.flaggedFields}\n`;
      md += `- Average Confidence: ${(report.statistics.averageConfidence * 100).toFixed(1)}%\n\n`;

      md += `## Quality Summary\n\n${report.qualitySummary}\n\n`;

      md += `## Field Audit Records\n\n`;
      for (const record of report.records) {
        md += `### ${record.fieldName}\n`;
        md += `- **Value:** ${record.value}\n`;
        md += `- **Confidence:** ${(record.confidence * 100).toFixed(1)}%\n`;
        md += `- **Status:** ${record.validationStatus}\n`;
        md += `- **Sources:** ${record.sources.length} sources\n`;

        for (const source of record.sources) {
          md += `  - ${source.section} (Page ${source.pageNumber}): "${source.textSnippet}"\n`;
        }
        md += '\n';
      }

      return md;
    },
    []
  );

  return {
    loading,
    error,
    fetchAuditReport,
    exportAuditReport,
  };
}
