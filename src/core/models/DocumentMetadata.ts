/**
 * DocumentMetadata Model
 *
 * Speichert Metadaten eines Dokuments für Audit und Validierung.
 * KEIN Speicher für Inhalte - nur Metadaten.
 *
 * @example
 * const meta: DocumentMetadata = {
 *   hash: "sha256:abc123...",
 *   size: 1024000,
 *   uploadedAt: new Date(),
 *   format: "pdf"
 * };
 */

/**
 * Unterstützte Dokumentformate.
 */
export enum DocumentFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  XLSX = 'xlsx',
  HTML = 'html',
  TXT = 'txt',
  JSON = 'json',
  UNKNOWN = 'unknown',
}

/**
 * Metadaten eines Dokuments.
 * Enthält Audit-Informationen, aber KEINE Inhalte.
 */
export interface DocumentMetadata {
  /** SHA256-Hash des Dokumentinhalts (für Integrität und Deduplizierung) */
  hash: string;

  /** Größe des Dokuments in Bytes */
  size: number;

  /** Zeitstempel des Hochladens */
  uploadedAt: Date;

  /** Dokumentformat (pdf, docx, html, etc.) */
  format: DocumentFormat;

  /** Sprache des Dokuments (z.B. "de", "en", "fr") */
  language?: string;

  /** Encoding des Inhalts (z.B. "utf-8", "iso-8859-1") */
  encoding?: string;

  /** OCR wurde angewendet (true/false) */
  ocrApplied?: boolean;

  /** Optionale Quelle/Herkunft (z.B. "email", "website", "scanner") */
  source?: string;

  /** Optionaler Benutzer/System, der das Dokument hochgeladen hat */
  uploadedBy?: string;

  /** Optionale Versionsnummer */
  version?: number;

  /** Optionale Beschreibung */
  description?: string;
}
