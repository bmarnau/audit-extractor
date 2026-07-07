/**
 * ExtractionResult Model
 *
 * Speichert die Extraktionsergebnisse für ein Dokument.
 * Enthält extrahierte Werte, fehlende Felder und Warnungen.
 *
 * @example
 * const result: ExtractionResult = {
 *   id: "result-001",
 *   documentId: "doc-001",
 *   ruleSetId: "invoice-v1.0.0",
 *   extractedFields: { ... },
 *   missingFields: ["dueDate"],
 *   warnings: [ ... ],
 *   extractedAt: new Date()
 * };
 */

/**
 * Ein extrahiertes Feld mit Wert, Quelle und Vertrauenscore.
 */
export interface ExtractedField<T = unknown> {
  /** Der extrahierte Wert */
  value: T;

  /** Vertrauenscore (0-1) */
  confidence: number;

  /** Quellen im Dokument */
  sources: SourceReference[];

  /** Unsicherheit/Grund für niedriges Vertrauen */
  uncertainty?: string;

  /** Zeitstempel der Extraktion */
  extractedAt: Date;
}

/**
 * Referenz auf die Stelle im Dokument, wo der Wert gefunden wurde.
 */
export interface SourceReference {
  /** Chunk-ID */
  chunkId: string;

  /** Text-Snippet aus dem Chunk */
  textSnippet: string;

  /** Start-Offset im Chunk */
  offsetStart?: number;

  /** End-Offset im Chunk */
  offsetEnd?: number;

  /** Seitennummer (falls vorhanden) */
  pageNumber?: number;
}

/**
 * Ergebnis der Extraktion für ein Dokument.
 */
export interface ExtractionResult {
  /** Eindeutige Result-ID */
  id: string;

  /** Referenz zum Dokument */
  documentId: string;

  /** Verwendete Rule-Set ID (für Versionierung) */
  ruleSetId: string;

  /** Extrahierte Felder (Map: fieldName → ExtractedField) */
  extractedFields: Map<string, ExtractedField>;

  /** Felder, die nicht gefunden wurden */
  missingFields: string[];

  /** Warnungen während der Extraktion */
  warnings: ExtractionWarning[];

  /** Zeitstempel der Extraktion */
  extractedAt: Date;

  /** Insgesamt benötigte Zeit (Millisekunden) */
  processingTimeMs?: number;

  /** Version des Extraktionsergebnisses */
  version: string;

  /** Optionale Notizen zum Ergebnis */
  notes?: string;
}

/**
 * Warnung während der Extraktion.
 */
export interface ExtractionWarning {
  /** Betroffenes Feld */
  field: string;

  /** Warnungsstufe */
  level: 'info' | 'warning' | 'error';

  /** Warnungsmeldung */
  message: string;

  /** Optionale Suggestion zur Behebung */
  suggestion?: string;

  /** Zeitstempel */
  createdAt: Date;
}
