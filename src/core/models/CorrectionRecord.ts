/**
 * CorrectionRecord Model
 *
 * Speichert Korrektionen von fehlerhaften Extraktionen.
 * Wird für Verbesserungen und Lernzwecke verwendet.
 *
 * @example
 * const correction: CorrectionRecord = {
 *   id: "correction-001",
 *   originalValue: "Meyer",
 *   correctedValue: "Meyer GmbH",
 *   field: "customerName",
 *   reason: "Incomplete extraction"
 * };
 */

/**
 * Kategorie eines Fehlers.
 */
export enum ErrorCategory {
  INCOMPLETE = 'incomplete',
  INCORRECT = 'incorrect',
  WRONG_TYPE = 'wrong-type',
  HALLUCINATION = 'hallucination',
  MISSING_VALUE = 'missing-value',
  EXTRA_VALUE = 'extra-value',
  FORMAT_ERROR = 'format-error',
  OTHER = 'other',
}

/**
 * Eine korrigierte Extraktion.
 */
export interface CorrectionRecord {
  /** Eindeutige Korrektur-ID */
  id: string;

  /** Referenz zum Dokument */
  documentId: string;

  /** Betroffenes Feld */
  field: string;

  /** Der ursprüngliche (falsche) Wert */
  originalValue: unknown;

  /** Der korrigierte (richtige) Wert */
  correctedValue: unknown;

  /** Kategorie des Fehlers */
  category: ErrorCategory;

  /** Grund für die Korrektur */
  reason: string;

  /** Wer hat die Korrektur durchgeführt? */
  correctedBy?: string;

  /** Wann wurde die Korrektur durchgeführt? */
  correctedAt: Date;

  /** Vertrauenscore der ursprünglichen Extraktion */
  originalConfidence?: number;

  /** Pattern, das zu dem Fehler geführt hat */
  relatedPattern?: string;

  /** Quelle im Dokument, die die Korrektur bestätigt */
  sourceReference?: string;

  /** Wurde dieser Fehler bereits in ein neues Pattern/Rule integriert? */
  integrated: boolean;

  /** Wenn integrated=true, welche Rule wurde aktualisiert? */
  integratedIntoRule?: string;

  /** Optionale Notizen */
  notes?: string;

  /** Ähnliche Fehler (IDs von anderen CorrectionRecords) */
  relatedCorrections?: string[];
}

/**
 * Sammlung von Korrektionsberichten.
 */
export interface CorrectionReports {
  /** Korrektionen gruppiert nach Feld */
  corrections: Map<string, CorrectionRecord[]>;

  /** Zeitstempel der Sammlung */
  createdAt: Date;

  /** Gesamtanzahl der Korrektionen */
  totalCorrections: number;

  /** Fehler, die noch nicht in Rules integriert sind */
  pendingIntegration: CorrectionRecord[];

  /** Häufigste Fehler-Kategorien */
  commonErrors: Map<ErrorCategory, number>;

  /** Durchschnittliche Häufigkeit pro Fehler-Kategorie */
  averageFrequency: number;
}
