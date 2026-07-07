/**
 * Audit Center - Phase 12
 *
 * Zentrale Audit-Verwaltung für alle extrahierten Felder.
 * Trackt: Wert, Confidence, Source, Seitennummer, Abschnitt, Ursprungschunk
 *
 * @version 0.12.0
 * @phase 12
 * @status COMPLETE
 */

/**
 * Source Reference für ein Feld
 */
export interface SourceReference {
  /** Chunk ID */
  chunkId: string;

  /** Abschnitt im Dokument */
  section: string;

  /** Seitennummer */
  pageNumber: number;

  /** Text-Ausschnitt */
  textSnippet: string;

  /** Offset im Text */
  offset: number;

  /** Länge des Textes */
  length: number;

  /** Ähnlichkeitswert (0-1) */
  similarity: number;

  /** Konfidenz der Quelle (0-1) */
  sourceConfidence: number;
}

/**
 * Audit Record für ein extrahiertes Feld
 */
export interface FieldAuditRecord {
  /** Eindeutige ID */
  id: string;

  /** Feldname */
  fieldName: string;

  /** Extrahierter Wert */
  value: unknown;

  /** Confidence Score (0-1) */
  confidence: number;

  /** Source References (Nachweise) */
  sources: SourceReference[];

  /** Primäre Quelle (beste Übereinstimmung) */
  primarySource?: SourceReference;

  /** Seitennummern der Quellen */
  pageNumbers: number[];

  /** Abschnitte der Quellen */
  sections: string[];

  /** Ursprüngliche Chunks */
  sourceChunks: string[];

  /** Validierungsstatus */
  validationStatus: 'valid' | 'partial' | 'flagged';

  /** Validierungsmeldungen */
  validationMessages: string[];

  /** Hallucination Flags */
  hallucinationFlags: string[];

  /** Extraktionsmethode */
  extractionMethod: string;

  /** Timestamp */
  timestamp: string;

  /** Zusätzliche Metadaten */
  metadata?: Record<string, unknown>;
}

/**
 * Document Audit Report
 */
export interface DocumentAuditReport {
  /** Report ID */
  reportId: string;

  /** Dokument ID */
  documentId: string;

  /** Dokument Name */
  documentName: string;

  /** Schema Name */
  schemaName: string;

  /** Gesamte Audit Records */
  records: FieldAuditRecord[];

  /** Statistiken */
  statistics: {
    totalFields: number;
    validFields: number;
    partialFields: number;
    flaggedFields: number;
    averageConfidence: number;
    fieldsWithSources: number;
    totalSources: number;
  };

  /** Qualitäts-Zusammenfassung */
  qualitySummary: {
    overallQuality: number;
    sourceQuality: number;
    validationQuality: number;
    hallucinationRisk: number;
  };

  /** Issues */
  issues: Array<{
    fieldName: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
  }>;

  /** Extraktionszusammenfassung */
  executionSummary: {
    startTime: string;
    endTime: string;
    duration: number;
    extractor: string;
    validator: string;
  };

  /** Report erstellt */
  generatedAt: string;

  /** Version */
  version: string;
}

/**
 * Audit Entry für History Tracking
 */
export interface AuditEntry {
  /** Entry ID */
  id: string;

  /** Feldname */
  fieldName: string;

  /** Action */
  action: 'extracted' | 'validated' | 'flagged' | 'corrected' | 'discarded';

  /** Alter Wert (falls Änderung) */
  oldValue?: unknown;

  /** Neuer Wert */
  newValue: unknown;

  /** Reason */
  reason?: string;

  /** Actor */
  actor?: string;

  /** Timestamp */
  timestamp: string;
}
