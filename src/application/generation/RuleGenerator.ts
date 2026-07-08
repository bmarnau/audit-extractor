/**
 * RuleGenerator - Generiert Extraktions-Regeln aus Schema + Beispielen
 *
 * Pipeline:
 * 1. Load Schema
 * 2. Load Examples
 * 3. Match Examples zu Schema
 * 4. Inferriere Patterns
 * 5. Generiere Rules
 * 6. Validiere Rules
 * 7. Return GeneratedRules
 */

import { GeneratedRule, validateGeneratedRule, toExtractionRule } from '@domain/generation/GeneratedRule';
import { InferenceRequest } from '@domain/generation/PatternInference';
import { ExampleDataLoader, LoadedExample } from './ExampleDataLoader';
import { PatternInferrer } from './PatternInferrer';

/**
 * Input für RuleGenerator
 */
export interface RuleGenerationRequest {
  /** Name des Reports (z.B. "invoice") */
  reportName: string;

  /** Das Schema (Zielstruktur) */
  schema: {
    documentType: string;
    fields: {
      fieldName: string;
      fieldType: string;
      isRequired: boolean;
      description?: string;
      constraints?: {
        minLength?: number;
        maxLength?: number;
      };
    }[];
  };

  /** Beispiel-Daten laden von */
  exampleDataSource?: {
    name: string;
    data?: Record<string, unknown>;
  };

  /** Versionsnummer */
  version?: string;

  /** Owner/Team */
  owner?: string;
}

/**
 * Output vom RuleGenerator
 */
export interface RuleGenerationResult {
  /** Report Name */
  reportName: string;

  /** Alle generierten Rules */
  rules: GeneratedRule[];

  /** Wie viele Rules erfolgreich generiert? */
  successCount: number;

  /** Wie viele haben Probleme? */
  warningCount: number;

  /** Gesamte Confidence (Average) */
  averageConfidence: number;

  /** War Generierung erfolgreich? */
  success: boolean;

  /** Fehler (falls nicht erfolgreich) */
  errors?: string[];

  /** Warnungen */
  warnings: string[];

  /** Empfehlungen */
  recommendations: string[];

  /** Wann wurde generiert? */
  generatedAt: Date;

  /** Wie lange hat es gedauert? */
  durationMs: number;
}

/**
 * RuleGenerator - Generiert Rules von Schema + Examples
 */
export class RuleGenerator {
  constructor(
    private readonly exampleLoader: ExampleDataLoader,
    private readonly patternInferrer: PatternInferrer
  ) {}

  /**
   * Hauptmethode: Generiere Rules
   */
  async generate(request: RuleGenerationRequest): Promise<RuleGenerationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const generatedRules: GeneratedRule[] = [];

    // Validiere Request
    const requestValidation = this.validateRequest(request);
    if (!requestValidation.valid) {
      return {
        reportName: request.reportName,
        rules: [],
        successCount: 0,
        warningCount: 0,
        averageConfidence: 0,
        success: false,
        errors: requestValidation.errors,
        warnings,
        recommendations,
        generatedAt: new Date(),
        durationMs: Date.now() - startTime
      };
    }

    // 1. Lade Beispiel-Daten
    let exampleData: LoadedExample | null = null;
    if (request.exampleDataSource?.name) {
      try {
        exampleData = await this.exampleLoader.loadExample(request.exampleDataSource.name);
      } catch (e) {
        warnings.push(`Could not load example data: ${e instanceof Error ? e.message : String(e)}`);
      }
    } else if (request.exampleDataSource?.data) {
      exampleData = {
        name: request.reportName,
        data: request.exampleDataSource.data,
        fieldCount: Object.keys(request.exampleDataSource.data).length,
        fieldNames: Object.keys(request.exampleDataSource.data),
        loadedAt: new Date(),
        filePath: '<inline>',
        fileSizeBytes: JSON.stringify(request.exampleDataSource.data).length
      };
    }

    // 2. Für jedes Feld im Schema: Generiere Rule
    for (const schemaField of request.schema.fields) {
      try {
        const rule = await this.generateRuleForField(
          schemaField,
          exampleData,
          request.reportName,
          request.version
        );

        generatedRules.push(rule);

        // Sammle Warnungen aus Rule
        if (rule.warnings && rule.warnings.length > 0) {
          warnings.push(...rule.warnings.map(w => `${schemaField.fieldName}: ${w}`));
        }

        // ReDoS-Risiko
        if (rule.hasReDoSRisk) {
          warnings.push(`${schemaField.fieldName}: Potential ReDoS risk in pattern`);
        }

        // Low Confidence
        if (rule.confidence < 0.5) {
          warnings.push(`${schemaField.fieldName}: Low confidence (${rule.confidence})`);
          recommendations.push(`${schemaField.fieldName}: Consider manual review`);
        }
      } catch (e) {
        errors.push(
          `Failed to generate rule for ${schemaField.fieldName}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    // 3. Validiere alle Rules
    let validRuleCount = 0;
    for (const rule of generatedRules) {
      const validation = validateGeneratedRule(rule);
      if (!validation.valid) {
        warnings.push(
          `Rule ${rule.fieldName} has validation errors: ${validation.errors.join(', ')}`
        );
      } else {
        validRuleCount++;
      }
    }

    // 4. Berechne Metriken
    const averageConfidence =
      generatedRules.length > 0
        ? generatedRules.reduce((sum, r) => sum + r.confidence, 0) / generatedRules.length
        : 0;

    const warningCount = warnings.length;

    // 5. Recommendations
    if (averageConfidence < 0.7) {
      recommendations.push('Average confidence is low - consider improving training data');
    }

    if (generatedRules.length < request.schema.fields.length) {
      recommendations.push('Could not generate rules for all fields - please review');
    }

    return {
      reportName: request.reportName,
      rules: generatedRules,
      successCount: generatedRules.length,
      warningCount,
      averageConfidence,
      success: errors.length === 0 && generatedRules.length === request.schema.fields.length,
      errors: errors.length > 0 ? errors : undefined,
      warnings,
      recommendations,
      generatedAt: new Date(),
      durationMs: Date.now() - startTime
    };
  }

  /**
   * Generiere Rule für ein einzelnes Feld
   */
  private async generateRuleForField(
    schemaField: {
      fieldName: string;
      fieldType: string;
      isRequired: boolean;
      description?: string;
      constraints?: { minLength?: number; maxLength?: number };
    },
    exampleData: LoadedExample | null,
    reportName: string,
    version?: string
  ): Promise<GeneratedRule> {
    let pattern = '.*'; // Default fallback
    let confidence = 0.5;
    let examples: string[] = [];

    // Falls Beispiel-Daten vorhanden: Extrahiere und inferriere Pattern
    if (exampleData) {
      examples = this.exampleLoader
        .getFieldValues(exampleData, schemaField.fieldName)
        .map(v => String(v))
        .filter(v => v && v !== 'null' && v !== 'undefined');

      if (examples.length > 0) {
        // Nutze PatternInferrer
        const inferenceRequest: InferenceRequest = {
          fieldName: schemaField.fieldName,
          fieldType: schemaField.fieldType as any,
          examples,
          isRequired: schemaField.isRequired,
          constraints: schemaField.constraints
        };

        const inferenceResult = await this.patternInferrer.infer(inferenceRequest);

        if (inferenceResult.success) {
          pattern = inferenceResult.patterns.primary.pattern;
          confidence = inferenceResult.patterns.primary.confidence;
        } else {
          confidence = 0.3; // Sehr niedrig wenn Inferenz fehlgeschlagen
        }
      }
    }

    // Erstelle Rule
    const rule: GeneratedRule = {
      ruleId: `${reportName}-field-${this.generateId()}`,
      fieldName: schemaField.fieldName,
      fieldType: schemaField.fieldType as any,
      pattern,
      confidence,
      isRequired: schemaField.isRequired,
      description: schemaField.description || `Field: ${schemaField.fieldName}`,
      documentTypes: ['pdf', 'html'],
      constraints: schemaField.constraints,
      examplesMatched: examples.length,
      totalExamples: examples.length,
      generatedAt: new Date(),
      regexEngine: 'javascript',
      hasReDoSRisk: false,
      warnings: []
    };

    // Add version if provided
    if (version) {
      (rule as any).version = version;
    }

    return rule;
  }

  /**
   * Validiere Request
   */
  private validateRequest(request: RuleGenerationRequest): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate reportName
    if (!request.reportName || !/^[a-z][a-z0-9_-]*$/.test(request.reportName)) {
      errors.push('Invalid reportName: must be lowercase alphanumeric');
    }

    // Validate schema
    if (!request.schema || !request.schema.fields || request.schema.fields.length === 0) {
      errors.push('Schema must have at least one field');
    }

    // Validate each schema field
    if (request.schema && request.schema.fields) {
      for (const field of request.schema.fields) {
        if (!field.fieldName || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.fieldName)) {
          errors.push(`Invalid field name: ${field.fieldName}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Convert to ExtractionRules (for API compatibility)
   */
  toExtractionRules(generatedRules: GeneratedRule[]): any[] {
    return generatedRules.map(rule => toExtractionRule(rule));
  }
}
