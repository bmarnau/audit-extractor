/**
 * PdfParser
 *
 * Parsed PDF-Dokumente mit pdf-parse.
 * Extrahiert: Text, Metadaten, Image-Referenzen.
 *
 * Kritisch: Keine erfundenen Daten!
 * - Text nur wenn tatsächlich extrahierbar
 * - Images nur als Referenzen
 * - OCR nur wenn appliziert
 */

// @ts-ignore - pdf-parse lacks TypeScript declarations
import * as pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { BaseParser } from './BaseParser';
import { ParsingError } from './DocumentParser';

/**
 * Parser für PDF-Dokumente.
 */
export class PdfParser extends BaseParser {
  /**
   * Prüft, ob Datei eine PDF ist.
   */
  canHandle(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.pdf');
  }

  /**
   * Gibt Format zurück.
   */
  getSupportedFormat(): string {
    return 'pdf';
  }

  /**
   * Extrahiert nur Text aus PDF.
   */
  async extractText(fileBuffer: Buffer): Promise<string> {
    try {
      const pdf = await pdfParse(fileBuffer);

      if (!pdf.text || pdf.text.trim().length === 0) {
        console.warn('PDF contains no extractable text');
        return '';
      }

      return pdf.text;
    } catch (error) {
      throw new ParsingError(
        `Failed to extract text from PDF`,
        undefined,
        'pdf',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Extrahiert nur Metadaten aus PDF.
   */
  async extractMetadata(fileBuffer: Buffer, fileName: string): Promise<Record<string, unknown>> {
    try {
      const pdf = await pdfParse(fileBuffer);

      return {
        ...super.extractMetadata(fileBuffer, fileName),
        pages: pdf.numpages,
        title: pdf.info?.Title,
        author: pdf.info?.Author,
        subject: pdf.info?.Subject,
        creator: pdf.info?.Creator,
        createdAt: pdf.info?.CreationDate,
        modifiedAt: pdf.info?.ModDate,
        producer: pdf.info?.Producer,
        version: pdf.version,
      };
    } catch (error) {
      console.error('Failed to extract PDF metadata:', error);
      // Gebe Basis-Metadaten zurück, auch wenn Extraktion fehlschlägt
      return super.extractMetadata(fileBuffer, fileName);
    }
  }

  /**
   * Extrahiert Image-Referenzen aus PDF.
   * NICHT die Bilder selbst, nur Metadaten!
   */
  async extractImages(fileBuffer: Buffer): Promise<Record<string, unknown>[]> {
    try {
      await pdfParse(fileBuffer);

      // pdf-parse extrahiert standardmäßig keine Bilder
      // Wir könnten hier komplexere Image-Extraction hinzufügen,
      // aber für jetzt geben wir leeres Array zurück
      // (um Komplexität und Speicherverbrauch zu vermeiden)

      return [];
    } catch (error) {
      console.error('Failed to extract images from PDF:', error);
      return [];
    }
  }
}
