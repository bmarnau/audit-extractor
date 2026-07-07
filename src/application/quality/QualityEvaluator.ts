/**
 * Quality Evaluator Interface
 *
 * Bewertet Qualität von ExtractionResults.
 * Metrics: Vollständigkeit, Konsistenz, Nachweisbarkeit, Schema-Konformität.
 *
 * Kritisch: Verändert NIEMALS die Daten!
 */

import { ExtractionResult } from '@domain/ExtractionModels';

/**
 * Quality Score Metriken.
 */
export interface QualityScore {
  /**
   * Gesamtscore (0.0-1.0).
   * Gewichteter Durchschnitt aller Metriken.
   */
  overallScore: number;

  /**
   * Einzelmetriken.
   */
  completeness: number;      // Wie viele Felder vorhanden?
  consistency: number;        // Sind Werte konsistent formatiert?
  verifiability: number;      // Haben alle Werte SourceReferences?
  schemaConformity: number;   // Entsprechen die Werte dem Schema?

  /**
   * Detaillierte Analyse.
   */
  details: {
    totalExpectedFields: number;
    extractedFieldCount: number;
    missingFieldCount: number;
    fieldsWithoutSources: string[];
    typeViolations: string[];
  };

  /**
   * Bewertung durchgeführt.
   */
  evaluatedAt: Date;
}

/**
 * Quality Evaluator Configuration.
 */
export interface QualityEvaluatorConfig {
  /**
   * Gewichte für Metriken (sollte sich zu 1.0 summieren).
   */
  weights?: {
    completeness: number;
    consistency: number;
    verifiability: number;
    schemaConformity: number;
  };

  /**
   * Expected Schema für Schema-Konformität.
   */
  schema?: Record<string, unknown>;
}

/**
 * IQualityEvaluator - Bewertung ohne Datenmodifikation.
 */
export interface IQualityEvaluator {
  /**
   * Bewertet ExtractionResult.
   *
   * @param result ExtractionResult zum Bewerten
   * @param totalExpectedFields Wie viele Felder insgesamt erwartet?
   * @returns QualityScore (Result unverändert)
   */
  evaluate(result: ExtractionResult, totalExpectedFields: number): Promise<QualityScore>;

  /**
   * Bewertet nur Vollständigkeit.
   *
   * @param result ExtractionResult
   * @param totalExpectedFields Erwartet
   * @returns Score 0.0-1.0
   */
  evaluateCompleteness(result: ExtractionResult, totalExpectedFields: number): number;

  /**
   * Bewertet Nachweisbarkeit (SourceReferences).
   *
   * @param result ExtractionResult
   * @returns Score 0.0-1.0
   */
  evaluateVerifiability(result: ExtractionResult): number;

  /**
   * Bewertet Datentypkonsistenz.
   *
   * @param result ExtractionResult
   * @returns Score 0.0-1.0
   */
  evaluateConsistency(result: ExtractionResult): number;

  /**
   * Bewertet Schema-Konformität.
   *
   * @param result ExtractionResult
   * @returns Score 0.0-1.0
   */
  evaluateSchemaConformity(result: ExtractionResult): number;
}

/**
 * Fehlerklasse.
 */
export class QualityEvaluatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QualityEvaluatorError';
  }
}
