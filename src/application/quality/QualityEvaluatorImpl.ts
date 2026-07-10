/**
 * QualityEvaluator Implementation
 *
 * Metriken-basierte Qualitätsbewertung ohne Datenmodifikation.
 */

import { injectable } from 'tsyringe';
import { ExtractionResult } from '@domain/ExtractionModels';
import {
  IQualityEvaluator,
  QualityScore,
  QualityEvaluatorConfig,
  QualityEvaluatorError,
} from './QualityEvaluator';

/**
 * MetricsBasedQualityEvaluator - Read-only Qualitätsbewertung.
 */
@injectable()
export class MetricsBasedQualityEvaluator implements IQualityEvaluator {
  private weights = {
    completeness: 0.3,
    consistency: 0.2,
    verifiability: 0.35,
    schemaConformity: 0.15,
  };

  private schema?: Record<string, unknown>;

  constructor(config?: QualityEvaluatorConfig) {
    if (config?.weights) {
      // Validiere dass Gewichte sich zu 1.0 summieren
      const sum = Object.values(config.weights).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1.0) > 0.001) {
        throw new QualityEvaluatorError('Weights must sum to 1.0');
      }
      this.weights = config.weights;
    }

    if (config?.schema) {
      this.schema = config.schema;
    }
  }

  /**
   * Bewertet ExtractionResult.
   */
  async evaluate(result: ExtractionResult, totalExpectedFields: number): Promise<QualityScore> {
    try {
      // Berechne Einzelmetriken
      const completeness = this.evaluateCompleteness(result, totalExpectedFields);
      const consistency = this.evaluateConsistency(result);
      const verifiability = this.evaluateVerifiability(result);
      const schemaConformity = this.evaluateSchemaConformity(result);

      // Berechne Gesamtscore (gewichteter Durchschnitt)
      const overallScore =
        completeness * this.weights.completeness +
        consistency * this.weights.consistency +
        verifiability * this.weights.verifiability +
        schemaConformity * this.weights.schemaConformity;

      // Sammle Details
      const fieldsWithoutSources: string[] = [];
      for (const [fieldName, field] of result.extractedFields.entries()) {
        if (!field.sources || field.sources.length === 0) {
          fieldsWithoutSources.push(fieldName);
        }
      }

      const typeViolations = this.findTypeViolations(result);

      const qualityScore: QualityScore = {
        overallScore: Math.min(overallScore, 1.0),
        completeness,
        consistency,
        verifiability,
        schemaConformity,
        details: {
          totalExpectedFields,
          extractedFieldCount: result.extractedFields.size,
          missingFieldCount: result.missingFields.length,
          fieldsWithoutSources,
          typeViolations,
        },
        evaluatedAt: new Date(),
      };

      return qualityScore;
    } catch (error) {
      if (error instanceof QualityEvaluatorError) {
        throw error;
      }
      throw new QualityEvaluatorError(
        `Evaluation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Bewertet Vollständigkeit.
   */
  evaluateCompleteness(result: ExtractionResult, totalExpectedFields: number): number {
    if (totalExpectedFields === 0) {
      return 1.0;
    }

    const extracted = result.extractedFields.size;
    return Math.min(extracted / totalExpectedFields, 1.0);
  }

  /**
   * Bewertet Nachweisbarkeit (SourceReferences).
   */
  evaluateVerifiability(result: ExtractionResult): number {
    if (result.extractedFields.size === 0) {
      return 1.0; // Leer = OK
    }

    let fieldsWithSources = 0;

    for (const field of result.extractedFields.values()) {
      if (field.sources && field.sources.length > 0) {
        fieldsWithSources++;
      }
    }

    return fieldsWithSources / result.extractedFields.size;
  }

  /**
   * Bewertet Datentypkonsistenz.
   */
  evaluateConsistency(result: ExtractionResult): number {
    if (result.extractedFields.size === 0) {
      return 1.0;
    }

    // Tracke Violations
    let violations = 0;

    for (const [, field] of result.extractedFields.entries()) {
      // Prüfe Confidence Constraint (0.0-1.0)
      if (field.confidence < 0.0 || field.confidence > 1.0) {
        violations++;
      }

      // Prüfe dass Wert nicht null ist (bei extractedField)
      if (field.value === undefined) {
        violations++;
      }

      // Prüfe dass sources Array ist (wenn vorhanden)
      if (field.sources && !Array.isArray(field.sources)) {
        violations++;
      }
    }

    // Score = 1.0 - (violations / fields)
    return Math.max(1.0 - violations / result.extractedFields.size, 0.0);
  }

  /**
   * Bewertet Schema-Konformität.
   */
  evaluateSchemaConformity(result: ExtractionResult): number {
    // Wenn kein Schema gegeben, können wir das nicht bewerten
    if (!this.schema) {
      return 1.0;
    }

    // Prüfe ob alle extracted fields in schema properties sind
    const schemaProps = (this.schema.properties as Record<string, unknown>) || {};
    let conforming = 0;

    for (const fieldName of result.extractedFields.keys()) {
      if (schemaProps[fieldName]) {
        conforming++;
      }
    }

    if (result.extractedFields.size === 0) {
      return 1.0;
    }

    return conforming / result.extractedFields.size;
  }

  /**
   * Findet Datentypverletzungen.
   * @private
   */
  private findTypeViolations(result: ExtractionResult): string[] {
    const violations: string[] = [];

    for (const [fieldName, field] of result.extractedFields.entries()) {
      // Confidence außerhalb Range
      if (field.confidence < 0.0 || field.confidence > 1.0) {
        violations.push(`${fieldName}: confidence out of range [0.0-1.0]`);
      }

      // Value undefined (bei ExtractedValue darf value null sein)
      if (field.value === undefined) {
        violations.push(`${fieldName}: value is undefined`);
      }

      // Sources nicht Array
      if (field.sources && !Array.isArray(field.sources)) {
        violations.push(`${fieldName}: sources is not an array`);
      }
    }

    return violations;
  }
}
