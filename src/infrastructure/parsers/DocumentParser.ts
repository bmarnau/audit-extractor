/**
 * DocumentParser Interface
 *
 * Abstraktion für alle Datei-Parser.
 * Konvertiert verschiedene Dateitypen in standardisierte Document-Objekte.
 *
 * Kritisch: Keine Auto-Completion!
 * - Nur tatsächlich vorhandene Daten extrahieren
 * - Keine fehlenden Chunks erfinden
 * - OCR-Flag nur setzen wenn tatsächlich OCR appliziert wurde
 * - Bilder nur als Referenzen, nicht als Inhalte
 */

import { Document } from '@core/models';

/**
 * Parser-Interface für alle Dokumenttypen.
 */
export interface DocumentParser {
  /**
   * Prüft, ob der Parser diese Datei handhaben kann.
   *
   * @param fileName Name der Datei
   * @returns true falls Parser zuständig ist
   */
  canHandle(fileName: string): boolean;

  /**
   * Parsed ein Dokument aus Buffer/Stream.
   *
   * @param fileBuffer Dateiinhalt (Buffer)
   * @param fileName Name der Datei
   * @returns Vollständiges Document-Objekt
   * @throws ParsingError falls Fehler beim Parsing
   */
  parse(fileBuffer: Buffer, fileName: string): Promise<Document>;

  /**
   * Extrahiert nur Text aus Dokument.
   *
   * @param fileBuffer Dateiinhalt
   * @returns Extrahierter Text
   * @throws ParsingError falls Fehler beim Parsing
   */
  extractText(fileBuffer: Buffer): Promise<string>;

  /**
   * Extrahiert nur Metadaten.
   *
   * @param fileBuffer Dateiinhalt
   * @param fileName Name der Datei
   * @returns Metadaten (Größe, Format, etc.)
   * @throws ParsingError falls Fehler beim Parsing
   */
  extractMetadata(fileBuffer: Buffer, fileName: string): Promise<Record<string, unknown>>;

  /**
   * Extrahiert nur Bild-Referenzen (KEINE Bilder selbst!).
   *
   * @param fileBuffer Dateiinhalt
   * @returns Array von Bild-Metadaten (Pfade, Größen, Positionen)
   * @throws ParsingError falls Fehler beim Parsing
   */
  extractImages(fileBuffer: Buffer): Promise<Record<string, unknown>[]>;

  /**
   * Gibt den Dateityp zurück, den dieser Parser supported.
   *
   * @returns z.B. "pdf", "docx", "html"
   */
  getSupportedFormat(): string;
}

/**
 * Fehlerklasse für Parsing-Fehler.
 */
export class ParsingError extends Error {
  constructor(
    message: string,
    public readonly fileName?: string,
    public readonly format?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ParsingError';
  }
}
