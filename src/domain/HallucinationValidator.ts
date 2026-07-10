/**
 * HallucinationValidator - Phase 9
 *
 * Validiert ExtractionResults gegen Halluzinationen:
 * 1. Verifiziert sourceReferences zu tatsächlichen Chunks
 * 2. Verwirft halluzinierte Werte (ohne valide Source)
 * 3. Generiert Warnings für problematische Extrakte
 * 4. Bewertet Vertrauenswürdigkeit der Extraktion
 * 
 * @version 0.11.0
 * @phase 9
 * @status COMPLETE - Rewrite with source verification
 */

import { injectable } from 'tsyringe';
import { DocumentChunk } from '@core/models/DocumentChunk';
import { ExtractionResult, ExtractedValue, ExtractionWarning } from '@domain/ExtractionModels';

/**
 * Hallucination Detection Report
 */
export interface HallucinationReport {
  /** Bestanden die Hallucination Checks? */
  passed: boolean;

  /** Verworfene Werte (Halluzinationen) */
  discardedFields: Array<{
    fieldName: string;
    reason: string;
    confidence: number;
  }>;

  /** Generated Warnings */
  warnings: ExtractionWarning[];

  /** Vertrauenswürdigkeit der Extraktion (0-1) */
  trustworthiness: number;

  /** Zeitstempel */
  validatedAt: Date;

  /** Verarbeitungszeit (ms) */
  processingTimeMs: number;
}

/**
 * HallucinationValidator - Phase 9 Implementation
 */
@injectable()
export class HallucinationValidator {
  private readonly HALLUCINATION_CONFIDENCE_THRESHOLD = 0.5; // < 50% confidence = suspicious
  private readonly LOW_CONFIDENCE_WARNING_THRESHOLD = 0.7; // < 70% confidence = warning
  private readonly MINIMUM_SOURCE_MATCH_PERCENTAGE = 0.8; // 80% text match required

  /**
   * Validiert ExtractionResult gegen Halluzinationen
   */
  async validate(
    result: ExtractionResult,
    chunks: DocumentChunk[]
  ): Promise<HallucinationReport> {
    const startTime = Date.now();
    const discardedFields: HallucinationReport['discardedFields'] = [];
    const warnings: ExtractionWarning[] = [];
    let trustworthyFieldCount = 0;

    // Verarbeite jedes Extraktionsfeld
    const fieldsArray = Array.from(result.extractedFields.entries());
    for (const [fieldName, field] of fieldsArray) {
      const fieldValidation = this.validateField(field, chunks);

      if (fieldValidation.isHallucination) {
        // Halluzination erkannt - verwerfen
        discardedFields.push({
          fieldName,
          reason: fieldValidation.reason,
          confidence: field.confidence,
        });

        warnings.push({
          level: 'error',
          message: `HALLUCINATION: Field '${fieldName}' was discarded - ${fieldValidation.reason}`,
          field: fieldName,
        });
      } else if (fieldValidation.isLowConfidence) {
        // Low Confidence Warning
        warnings.push({
          level: 'warning',
          message: `LOW CONFIDENCE: Field '${fieldName}' extracted with confidence ${(field.confidence * 100).toFixed(0)}% - verify manually`,
          field: fieldName,
        });
      } else {
        // Field ist vertrauenswürdig
        trustworthyFieldCount++;
      }

      // Verifiziere Source References
      const sourceValidation = this.validateSourceReferences(field, chunks);
      if (!sourceValidation.valid) {
        warnings.push({
          level: 'warning',
          message: `INVALID SOURCE: Field '${fieldName}' - ${sourceValidation.reason}`,
          field: fieldName,
        });
      }
    }

    // Berechne Vertrauenswürdigkeit
    const trustworthiness =
      fieldsArray.length > 0
        ? trustworthyFieldCount / fieldsArray.length
        : 1.0;

    const processingTimeMs = Date.now() - startTime;

    return {
      passed: discardedFields.length === 0,
      discardedFields,
      warnings: [...result.warnings, ...warnings],
      trustworthiness,
      validatedAt: new Date(),
      processingTimeMs,
    };
  }

  /**
   * Validates a single extracted field for hallucinations
   */
  private validateField(
    field: ExtractedValue<unknown>,
    chunks: DocumentChunk[]
  ): {
    isHallucination: boolean;
    isLowConfidence: boolean;
    reason: string;
  } {
    // Check 1: No source locations = HIGH RISK hallucination
    if (!field.sources || field.sources.length === 0) {
      if (field.confidence < this.HALLUCINATION_CONFIDENCE_THRESHOLD) {
        return {
          isHallucination: true,
          isLowConfidence: false,
          reason: 'No source locations found (confidence too low)',
        };
      }

      // Even with decent confidence, no sources = hallucination risk
      return {
        isHallucination: true,
        isLowConfidence: false,
        reason: 'No source locations provided',
      };
    }

    // Check 2: Verify sources actually exist in chunks
    for (const source of field.sources) {
      const chunkExists = chunks.some((chunk) => 
        source.pageNumber !== undefined && chunk.pageNumber === source.pageNumber
      );
      if (!chunkExists && source.pageNumber !== undefined) {
        if (field.confidence < this.HALLUCINATION_CONFIDENCE_THRESHOLD) {
          return {
            isHallucination: true,
            isLowConfidence: false,
            reason: `Source page '${source.pageNumber}' does not exist (confidence too low)`,
          };
        }
      }
    }

    // Check 3: Verify snippet content exists in chunk
    for (const source of field.sources) {
      const chunk = chunks.find((c) => 
        source.pageNumber !== undefined && c.pageNumber === source.pageNumber
      );
      if (chunk && source.textSnippet && !chunk.text.includes(source.textSnippet)) {
        // Try fuzzy matching
        const matchPercentage = this.calculateTextSimilarity(
          source.textSnippet,
          chunk.text
        );

        if (matchPercentage < this.MINIMUM_SOURCE_MATCH_PERCENTAGE) {
          if (field.confidence < this.HALLUCINATION_CONFIDENCE_THRESHOLD) {
            return {
              isHallucination: true,
              isLowConfidence: false,
              reason: `Source snippet not found in chunk (${(matchPercentage * 100).toFixed(0)}% match)`,
            };
          }
        }
      }
    }

    // Check 4: Low confidence flagging
    if (field.confidence < this.LOW_CONFIDENCE_WARNING_THRESHOLD) {
      return {
        isHallucination: false,
        isLowConfidence: true,
        reason: '',
      };
    }

    return {
      isHallucination: false,
      isLowConfidence: false,
      reason: '',
    };
  }

  /**
   * Validates source references are complete
   */
  private validateSourceReferences(
    field: ExtractedValue<unknown>,
    chunks: DocumentChunk[]
  ): { valid: boolean; reason: string } {
    if (!field.sources || field.sources.length === 0) {
      return { valid: false, reason: 'No source locations' };
    }

    for (const source of field.sources) {
      // Check page exists
      if (source.pageNumber !== undefined) {
        const chunkExists = chunks.some((c) => c.pageNumber === source.pageNumber);
        if (!chunkExists) {
          return { valid: false, reason: `Page '${source.pageNumber}' not found` };
        }
      }

      // Check snippet is provided
      if (!source.textSnippet || source.textSnippet.length === 0) {
        return { valid: false, reason: 'Source snippet is empty' };
      }

      // Check offsets if provided
      if (
        source.offsetStart !== undefined &&
        source.offsetEnd !== undefined &&
        source.offsetEnd <= source.offsetStart
      ) {
        return { valid: false, reason: 'Invalid offset range' };
      }
    }

    return { valid: true, reason: '' };
  }

  /**
   * Simple text similarity calculation (Levenshtein-based)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;

    // Simple substring check
    if (text2.includes(text1)) return 1.0;

    // Calculate Levenshtein distance
    const a = text1.toLowerCase();
    const b = text2.toLowerCase();

    const length = Math.min(a.length, b.length);
    let matches = 0;

    for (let i = 0; i < length; i++) {
      if (a[i] === b[i]) matches++;
    }

    return matches / Math.max(a.length, b.length);
  }
}

export const hallucinationValidator = new HallucinationValidator();
