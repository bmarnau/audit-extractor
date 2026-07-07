/**
 * ParserFactory
 *
 * Factory für automatische Parser-Auswahl basierend auf Dateityp.
 * Router: Datei → Richtiger Parser.
 */

import { DocumentParser, ParsingError } from './DocumentParser';
import { PdfParser } from './PdfParser';
import { DocxParser } from './DocxParser';
import { HtmlParser } from './HtmlParser';

/**
 * Factory für Parser-Instanzen.
 */
export class ParserFactory {
  private static readonly parsers: DocumentParser[] = [new PdfParser(), new DocxParser(), new HtmlParser()];

  /**
   * Findet den richtigen Parser für eine Datei.
   *
   * @param fileName Name der Datei (mit Extension)
   * @returns Parser-Instanz
   * @throws ParsingError falls kein Parser für Datei gefunden
   */
  static getParser(fileName: string): DocumentParser {
    for (const parser of this.parsers) {
      if (parser.canHandle(fileName)) {
        return parser;
      }
    }

    const ext = fileName.split('.').pop()?.toLowerCase() ?? 'unknown';
    throw new ParsingError(
      `No parser available for file type: ${ext}`,
      fileName,
      ext
    );
  }

  /**
   * Gibt alle verfügbaren Parser zurück.
   *
   * @returns Array von Parser-Instanzen
   */
  static getParsers(): DocumentParser[] {
    return [...this.parsers];
  }

  /**
   * Gibt alle unterstützten Dateitypen zurück.
   *
   * @returns Array von Dateitypen (z.B. ["pdf", "docx", "html"])
   */
  static getSupportedFormats(): string[] {
    return this.parsers.map((p) => p.getSupportedFormat());
  }

  /**
   * Prüft, ob Dateityp unterstützt wird.
   *
   * @param fileName Name der Datei
   * @returns true falls unterstützt
   */
  static isSupported(fileName: string): boolean {
    return this.parsers.some((p) => p.canHandle(fileName));
  }

  /**
   * Parsed eine Datei automatisch mit dem richtigen Parser.
   *
   * @param fileBuffer Datei-Inhalt
   * @param fileName Name der Datei
   * @returns Geparste Document
   * @throws ParsingError falls Parser nicht gefunden oder Parsing fehlschlägt
   */
  static async parse(fileBuffer: Buffer, fileName: string) {
    const parser = this.getParser(fileName);
    return parser.parse(fileBuffer, fileName);
  }
}
