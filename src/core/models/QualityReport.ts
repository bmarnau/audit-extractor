/**
 * QualityReport Model
 *
 * Speichert Qualitätsmetriken für Extraktionsergebnisse.
 * Misst: Vollständigkeit, Genauigkeit, Konsistenz.
 *
 * @example
 * const quality: QualityReport = {
 *   id: "quality-001",
 *   resultId: "result-001",
 *   completenessScore: 0.75,
 *   accuracyScore: 0.92,
 *   metrics: { ... },
 *   createdAt: new Date()
 * };
 */

/**
 * Qualitätsmetriken für ein Extraktionsergebnis.
 */
export interface QualityReport {
  /** Eindeutige Report-ID */
  id: string;

  /** Referenz zum Extraktionsergebnis */
  resultId: string;

  /** Referenz zum Dokument */
  documentId: string;

  /** Vollständigkeits-Score (0-1): Wieviele Felder wurden gefunden? */
  completenessScore: number;

  /** Genauigkeits-Score (0-1): Wieviele Extraktionen haben hohes Vertrauen? */
  accuracyScore: number;

  /** Konsistenz-Score (0-1): Wieviele Werte passen zu Constraints? */
  consistencyScore: number;

  /** Gesamt-Score (Durchschnitt der obigen) */
  overallScore: number;

  /** Detaillierte Metriken */
  metrics: QualityMetrics;

  /** Qualitäts-Rating (poor, fair, good, excellent) */
  rating: 'poor' | 'fair' | 'good' | 'excellent';

  /** Empfehlungen zur Verbesserung */
  recommendations: string[];

  /** Zeitstempel der Report-Erstellung */
  createdAt: Date;

  /** Optionale Notizen */
  notes?: string;
}

/**
 * Detaillierte Qualitätsmetriken.
 */
export interface QualityMetrics {
  /** Gesamtanzahl erwarteter Felder */
  totalFieldsExpected: number;

  /** Gesamtanzahl gefundener Felder */
  totalFieldsFound: number;

  /** Gesamtanzahl fehlender Felder */
  totalFieldsMissing: number;

  /** Felder mit hohem Vertrauen (>= 0.9) */
  highConfidenceCount: number;

  /** Felder mit mittlerem Vertrauen (0.7-0.89) */
  mediumConfidenceCount: number;

  /** Felder mit niedrigem Vertrauen (< 0.7) */
  lowConfidenceCount: number;

  /** Durchschnittliches Vertrauens-Level */
  averageConfidence: number;

  /** Felder mit Validierungsfehlern */
  validationErrorCount: number;

  /** Felder mit Warnungen */
  warningCount: number;

  /** Durchschnittliche Verarbeitungszeit pro Feld (ms) */
  avgProcessingTimePerField?: number;

  /** Weitere Custom Metriken */
  [key: string]: number | undefined;
}
