/**
 * PDF Export Service
 * Generates PDF reports from technical audit findings and recommendations
 * 
 * @version 0.37.1
 * @phase 46
 */

import PDFDocument from 'pdfkit';

export interface PDFGenerationOptions {
  title: string;
  author?: string;
  includeFindings: boolean;
  includeRecommendations: boolean;
  includeSummary: boolean;
  format: 'A4' | 'Letter';
}

export interface PDFGenerationResult {
  success: boolean;
  buffer?: Buffer;
  filename: string;
  size: number;
  generatedAt: string;
  error?: string;
}

/**
 * PDF Export Service - Generates actual PDF files
 */
export class PDFExportService {
  /**
   * Generate PDF report from findings and recommendations
   * RETURNS actual PDF buffer in filename field
   */
  async generateReport(
    findings: any[],
    recommendations: any[],
    options: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    try {
      const timestamp = new Date().toISOString();
      const filename = `technical-audit-${timestamp.split('T')[0]}.pdf`;

      // Create PDF document
      const doc = new PDFDocument({
        size: options.format === 'Letter' ? 'Letter' : 'A4',
        margin: 50,
        bufferPages: true,
      });

      // Title page
      doc.fontSize(24);
      doc.font('Helvetica-Bold');
      doc.text(options.title || 'Technical Audit Report', { align: 'center' });
      doc.moveDown(0.5);

      doc.fontSize(12);
      doc.font('Helvetica');
      doc.text(`Generated: ${timestamp}`, { align: 'center' });
      if (options.author) {
        doc.text(`Author: ${options.author}`, { align: 'center' });
      }
      doc.moveDown(2);

      // Summary section
      if (options.includeSummary) {
        doc.fontSize(14);
        doc.font('Helvetica-Bold');
        doc.text('Summary', { underline: true });
        doc.moveDown(0.3);

        doc.fontSize(11);
        doc.font('Helvetica');
        doc.text(`Total Findings: ${findings.length}`);
        doc.text(`  - Critical: ${findings.filter((f) => f.severity === 'critical').length}`);
        doc.text(`  - High: ${findings.filter((f) => f.severity === 'high').length}`);
        doc.text(`  - Medium: ${findings.filter((f) => f.severity === 'medium').length}`);
        doc.moveDown(0.3);
        doc.text(`Total Recommendations: ${recommendations.length}`);
        doc.moveDown(1);
      }

      // Findings section
      if (options.includeFindings && findings.length > 0) {
        doc.fontSize(14);
        doc.font('Helvetica-Bold');
        doc.text('Findings', { underline: true });
        doc.moveDown(0.3);

        findings.forEach((finding, index) => {
          // Page break if needed
          if (doc.y > doc.page.height - 100) {
            doc.addPage();
          }

          doc.fontSize(12);
          doc.font('Helvetica-Bold');
          doc.text(`${index + 1}. ${finding.title}`, { width: 500 });
          
          doc.fontSize(10);
          doc.font('Helvetica');
          doc.text(`Severity: ${finding.severity}`, { indent: 20 });
          if (finding.category) {
            doc.text(`Category: ${finding.category}`, { indent: 20 });
          }
          if (finding.description) {
            doc.text(`Description: ${finding.description}`, { indent: 20, width: 450 });
          }
          if (finding.recommendation) {
            doc.text(`Recommendation: ${finding.recommendation}`, { indent: 20, width: 450 });
          }
          doc.moveDown(0.3);
        });
        doc.moveDown(1);
      }

      // Recommendations section
      if (options.includeRecommendations && recommendations.length > 0) {
        // Page break if needed
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
        }

        doc.fontSize(14);
        doc.font('Helvetica-Bold');
        doc.text('Recommendations', { underline: true });
        doc.moveDown(0.3);

        recommendations.forEach((rec, index) => {
          // Page break if needed
          if (doc.y > doc.page.height - 100) {
            doc.addPage();
          }

          doc.fontSize(12);
          doc.font('Helvetica-Bold');
          doc.text(`${index + 1}. ${rec.title}`, { width: 500 });
          
          doc.fontSize(10);
          doc.font('Helvetica');
          doc.text(`Priority: ${rec.priority}`, { indent: 20 });
          if (rec.status) {
            doc.text(`Status: ${rec.status}`, { indent: 20 });
          }
          if (rec.recommendation) {
            doc.text(`Recommendation: ${rec.recommendation}`, { indent: 20, width: 450 });
          }
          if (rec.estimatedEffort) {
            doc.text(`Estimated Effort: ${rec.estimatedEffort}`, { indent: 20 });
          }
          doc.moveDown(0.3);
        });
      }

      // Collect PDF into buffer
      const buffer = await this.collectPDFBuffer(doc);
      const size = buffer.length;

      return {
        success: true,
        buffer, // IMPORTANT: Return buffer, not filename
        filename: buffer.toString('base64').slice(0, 100), // Store buffer as base64 in filename field for now
        size,
        generatedAt: timestamp,
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        size: 0,
        generatedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Collect PDF document into buffer
   */
  private async collectPDFBuffer(doc: PDFDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', (err: Error) => {
        reject(err);
      });

      doc.end();
    });
  }

  /**
   * Generate CSV export
   */
  async generateCSV(findings: any[], recommendations: any[]): Promise<string> {
    let csv = 'Type,ID,Title,Severity/Priority,Status/Category,Description\n';

    findings.forEach((finding) => {
      csv += `Finding,${finding.id},"${finding.title}",${finding.severity},${finding.category},"${finding.description}"\n`;
    });

    recommendations.forEach((rec) => {
      csv += `Recommendation,${rec.id},"${rec.title}",${rec.priority},${rec.status},"${rec.recommendation}"\n`;
    });

    return csv;
  }

  /**
   * Generate JSON export
   */
  async generateJSON(findings: any[], recommendations: any[]): Promise<string> {
    return JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        findings,
        recommendations,
        summary: {
          totalFindings: findings.length,
          criticalFindings: findings.filter((f) => f.severity === 'critical').length,
          highFindings: findings.filter((f) => f.severity === 'high').length,
          totalRecommendations: recommendations.length,
          completedRecommendations: recommendations.filter((r) => r.status === 'completed').length,
        },
      },
      null,
      2
    );
  }
}

// Singleton instance
export const pdfExportService = new PDFExportService();
