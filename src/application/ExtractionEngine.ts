import { ExtractedValue, SourceLocation, ExtractionWarning } from '@domain/ExtractionModels';
import { ExtractionRule, validateAgainstRule } from '@domain/ExtractionRule';

/**
 * ProvenanceAuditor - Verfolgt alle Extraktions-Schritte
 * Für Revision und Debugging
 */
export interface AuditEntry {
  timestamp: Date;
  action: 'extract' | 'validate' | 'warn' | 'filter';
  field: string;
  result: 'success' | 'failure' | 'skipped' | 'filtered';
  details: Record<string, any>;
}

export class ProvenanceAuditor {
  private entries: AuditEntry[] = [];

  record(entry: Omit<AuditEntry, 'timestamp'>): void {
    this.entries.push({
      ...entry,
      timestamp: new Date()
    });
  }

  getAuditTrail(): AuditEntry[] {
    return [...this.entries];
  }

  toJSON(): any {
    return {
      auditTrail: this.entries,
      recordCount: this.entries.length,
      startTime: this.entries[0]?.timestamp,
      endTime: this.entries[this.entries.length - 1]?.timestamp
    };
  }
}

/**
 * ExtractionEngine - Core Service
 * Führt Extraktionen aus und erzeugt nachverfolgbare Ergebnisse
 */
export class ExtractionEngine {
  private auditor: ProvenanceAuditor;

  constructor(private readonly ruleSet: ExtractionRule[]) {
    this.auditor = new ProvenanceAuditor();
  }

  extract<T>(
    field: string,
    extractedValue: T | null,
    sources: SourceLocation[],
    confidence: number,
    uncertainty?: string
  ): ExtractedValue<T> {
    const rule = this.ruleSet.find((r) => r.fieldName.toString() === field);

    const result: ExtractedValue<T> = {
      value: extractedValue,
      confidence,
      sources,
      uncertainty,
      extractedAt: new Date()
    };

    // Validation
    if (rule) {
      const validation = validateAgainstRule(result, rule);
      this.auditor.record({
        action: 'validate',
        field,
        result: validation.valid ? 'success' : 'failure',
        details: { errors: validation.errors, confidence }
      });

      if (!validation.valid) {
        result.uncertainty = validation.errors.join('; ');
      }
    }

    this.auditor.record({
      action: 'extract',
      field,
      result: result.value !== null ? 'success' : 'skipped',
      details: {
        confidence,
        sourcesCount: sources.length,
        hasUncertainty: !!uncertainty
      }
    });

    return result;
  }

  /**
   * Filtert Low-Confidence-Werte auf null
   * Enforcement: Keine Halluzinationen
   */
  applyConfidenceFilter(
    extracted: ExtractedValue<any>,
    minimumConfidence: number = 0.8
  ): ExtractedValue<any> {
    if (extracted.value === null) {
      return extracted;
    }

    if (extracted.confidence < minimumConfidence) {
      this.auditor.record({
        action: 'filter',
        field: 'unknown',
        result: 'filtered',
        details: {
          confidence: extracted.confidence,
          minimum: minimumConfidence,
          originalValue: extracted.value
        }
      });

      return {
        ...extracted,
        value: null,
        uncertainty: `Confidence ${extracted.confidence} below minimum ${minimumConfidence}`
      };
    }

    return extracted;
  }

  /**
   * Generiert Warnings für fehlende/unsichere Felder
   */
  generateWarnings(
    result: Map<string, ExtractedValue<any>>,
    requiredRules: ExtractionRule[]
  ): ExtractionWarning[] {
    const warnings: ExtractionWarning[] = [];

    for (const rule of requiredRules) {
      const fieldName = rule.fieldName.toString();
      const extracted = result.get(fieldName);

      if (!extracted || extracted.value === null) {
        if (rule.isRequired) {
          warnings.push({
            field: fieldName,
            level: 'error',
            message: `Required field '${fieldName}' is missing`,
            suggestion: `Check if field exists in document`
          });

          this.auditor.record({
            action: 'warn',
            field: fieldName,
            result: 'skipped',
            details: { reason: 'required_missing' }
          });
        } else {
          warnings.push({
            field: fieldName,
            level: 'info',
            message: `Optional field '${fieldName}' not found`
          });
        }
      } else if (extracted.confidence < 0.8) {
        warnings.push({
          field: fieldName,
          level: 'warning',
          message: `Field '${fieldName}' has low confidence: ${extracted.confidence}`,
          suggestion: extracted.uncertainty
        });

        this.auditor.record({
          action: 'warn',
          field: fieldName,
          result: 'success',
          details: { reason: 'low_confidence', confidence: extracted.confidence }
        });
      }
    }

    return warnings;
  }

  getAuditTrail(): AuditEntry[] {
    return this.auditor.getAuditTrail();
  }

  getAuditJSON(): any {
    return this.auditor.toJSON();
  }
}
