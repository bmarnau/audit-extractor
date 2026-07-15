/**
 * Test Reports Module Exports - Phase 38E+
 * 
 * Zentrale Exports für alle Report Generator Komponenten.
 */

export { HtmlReportGenerator } from './HtmlReportGenerator.js';

// Phase 38F+
// export { PdfReportGenerator } from './PdfReportGenerator.js';
// export { MarkdownReportGenerator } from './MarkdownReportGenerator.js';

// Convenience Export
export async function generateHtmlReport(runDir: string): Promise<string> {
  const { HtmlReportGenerator } = await import('./HtmlReportGenerator.js');
  const generator = new HtmlReportGenerator(runDir);
  return generator.generate();
}
