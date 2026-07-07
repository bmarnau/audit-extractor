/**
 * Result Repository Interface
 *
 * Persistierung von ExtractionResults mit Versionierung.
 * Speichert JSON und Reports.
 *
 * Kritisch: Keine Daten-Modifikation!
 */

import { ExtractionResult } from '@domain/ExtractionModels';

/**
 * Versioning Metadaten.
 */
export interface VersionInfo {
  version: number;
  documentId: string;
  documentType: string;
  createdAt: Date;
  filePath: string;
}

/**
 * Result Speicher-Locator.
 */
export interface ResultLocation {
  json: string;      // results/json/...
  report: string;    // results/reports/...
}

/**
 * IResultRepository - Versionierte Result-Persistierung.
 */
export interface IResultRepository {
  /**
   * Speichert ExtractionResult mit automatischer Versionierung.
   *
   * @param result ExtractionResult zum Speichern
   * @param baseName z.B. "invoice_2024-01-15"
   * @returns VersionInfo mit Versionsnummer
   */
  saveResult(result: ExtractionResult, baseName: string): Promise<VersionInfo>;

  /**
   * Lädt ExtractionResult nach Versionsnummer.
   *
   * @param baseName z.B. "invoice_2024-01-15"
   * @param version Versionsnummer (optional, neueste falls nicht gegeben)
   * @returns ExtractionResult oder null falls nicht vorhanden
   */
  loadResult(baseName: string, version?: number): Promise<ExtractionResult | null>;

  /**
   * Listet alle Versionen auf.
   *
   * @param baseName z.B. "invoice_2024-01-15"
   * @returns Array von VersionInfo (sortiert, neueste zuerst)
   */
  listVersions(baseName: string): Promise<VersionInfo[]>;

  /**
   * Löscht spezifische Version.
   *
   * @param baseName z.B. "invoice_2024-01-15"
   * @param version Versionsnummer
   * @returns true falls erfolgreich
   */
  deleteVersion(baseName: string, version: number): Promise<boolean>;

  /**
   * Speichert Report (Markdown, PDF, etc.).
   *
   * @param content Report-Content (Markdown)
   * @param baseName z.B. "invoice_2024-01-15"
   * @param format "markdown" | "html" (default: markdown)
   * @returns Speicherpfad
   */
  saveReport(content: string, baseName: string, format?: 'markdown' | 'html'): Promise<string>;

  /**
   * Gibt Speicher-Locationen zurück.
   */
  getLocations(): ResultLocation;
}

/**
 * Fehlerklasse.
 */
export class ResultRepositoryError extends Error {
  constructor(
    message: string,
    public readonly baseName?: string,
    public readonly version?: number
  ) {
    super(message);
    this.name = 'ResultRepositoryError';
  }
}
