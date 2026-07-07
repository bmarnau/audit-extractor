import { ExtractionResult } from '@domain/ExtractionModels';

/**
 * AuditReportGenerator - Erstellt nachverfolgbare Berichte
 * SOLID: Single Responsibility - nur Formatierung
 */
export class AuditReportGenerator {
  generateJSON(result: ExtractionResult): string {
    return JSON.stringify(this.toAuditObject(result), null, 2);
  }

  generateCSV(results: ExtractionResult[]): string {
    const headers = [
      'resultId',
      'documentId',
      'field',
      'value',
      'confidence',
      'sources',
      'warnings'
    ].join(',');

    const rows = results.flatMap((result) => {
      return Array.from(result.extractedFields.entries()).map(
        ([fieldName, extracted]) => {
          const sources = extracted.sources
            .map((s) => `${s.documentReference.documentId}:${s.pageNumber || 'N/A'}`)
            .join(';');

          return [
            this.escapeCsv(result.resultId),
            this.escapeCsv(result.documentReference.documentId),
            this.escapeCsv(fieldName),
            this.escapeCsv(String(extracted.value || '')),
            extracted.confidence.toFixed(2),
            this.escapeCsv(sources),
            this.escapeCsv(extracted.uncertainty || '')
          ].join(',');
        }
      );
    });

    return [headers, ...rows].join('\n');
  }

  generateMarkdown(result: ExtractionResult): string {
    let md = `# Extraction Result: ${result.resultId}\n\n`;
    md += `**Document**: ${result.documentReference.fileName}\n`;
    md += `**Type**: ${result.documentReference.documentType}\n`;
    md += `**Extracted at**: ${result.extractedAt.toISOString()}\n\n`;

    md += `## Extracted Fields (${result.extractedFields.size})\n\n`;

    for (const [fieldName, extracted] of result.extractedFields.entries()) {
      md += `### ${fieldName}\n`;
      md += `- **Value**: ${extracted.value ?? '_null_'}\n`;
      md += `- **Confidence**: ${(extracted.confidence * 100).toFixed(0)}%\n`;
      md += `- **Sources**: ${extracted.sources.length} location(s)\n`;
      if (extracted.uncertainty) {
        md += `- **⚠️ Uncertainty**: ${extracted.uncertainty}\n`;
      }
      md += '\n';
    }

    if (result.missingFields.length > 0) {
      md += `## Missing Fields (${result.missingFields.length})\n\n`;
      for (const field of result.missingFields) {
        md += `- ${field}\n`;
      }
      md += '\n';
    }

    if (result.warnings.length > 0) {
      md += `## Warnings (${result.warnings.length})\n\n`;
      for (const warning of result.warnings) {
        md += `- **${warning.field}** [${warning.level.toUpperCase()}]: ${warning.message}\n`;
        if (warning.suggestion) {
          md += `  - 💡 ${warning.suggestion}\n`;
        }
      }
    }

    return md;
  }

  private toAuditObject(result: ExtractionResult): any {
    return {
      resultId: result.resultId,
      documentReference: result.documentReference,
      extractedFields: Array.from(result.extractedFields.entries()).map(
        ([fieldName, extracted]) => ({
          field: fieldName,
          value: extracted.value,
          confidence: extracted.confidence,
          sourcesCount: extracted.sources.length,
          sources: extracted.sources.map((s) => ({
            documentId: s.documentReference.documentId,
            pageNumber: s.pageNumber,
            sectionId: s.sectionId,
            textSnippet: s.textSnippet
          })),
          uncertainty: extracted.uncertainty
        })
      ),
      missingFields: result.missingFields,
      warningsCount: result.warnings.length,
      warnings: result.warnings,
      metadata: {
        extractedAt: result.extractedAt.toISOString(),
        version: result.version,
        ruleSetVersion: result.ruleSetVersion
      }
    };
  }

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
