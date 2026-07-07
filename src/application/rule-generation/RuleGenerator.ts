/**
 * Phase 15: Schema-Driven Rule Generation
 * RuleGenerator Implementation
 * 
 * Combines SchemaAnalyzer + ExampleAnalyzer outputs to generate ExtractionRules
 */

import { SchemaField } from '../../domain/schema';
import { FieldCharacteristics } from '../../domain/schema/ExampleAnalyzerTypes';
import {
  RuleGenerationInput,
  GeneratedRule,
  RuleGenerationResult,
  GenerationStats,
  // AggressivenessLevel - removed unused import
} from './RuleGeneratorTypes';
import { v4 as uuidv4 } from 'uuid';

export class RuleGenerator {
  /**
   * Generate extraction rules from schema + examples
   */
  public generateRules(input: RuleGenerationInput): RuleGenerationResult {
    const rules: GeneratedRule[] = [];
    const schemaFields = input.schemaFields as SchemaField[];
    const characteristics = input.exampleCharacteristics as FieldCharacteristics[];

    // Match schema fields with characteristics
    const charMap = new Map(characteristics.map((c) => [c.fieldName, c]));

    for (const field of schemaFields) {
      const char = charMap.get(field.fieldName);
      const rule = this.generateRuleForField(field, char, input.aggressiveness, input.customKeywords);

      if (rule) {
        rules.push(rule);
      }
    }

    // Calculate statistics
    const stats = this.calculateStats(rules);

    return {
      rules,
      ruleSetId: uuidv4(),
      generatedAt: new Date(),
      stats,
      warnings: this.generateWarnings(rules, input.aggressiveness),
    };
  }

  /**
   * Generate rule for a single field
   */
  private generateRuleForField(
    field: SchemaField,
    characteristics: FieldCharacteristics | undefined,
    aggressiveness: number,
    customKeywords?: Record<string, string[]>
  ): GeneratedRule | null {
    let confidence = 0;
    const searchPatterns: string[] = [];
    let derivedFrom: 'schema' | 'examples' | 'hybrid' = 'schema';

    // Strategy 1: Custom keywords
    if (customKeywords && customKeywords[field.fieldName]) {
      searchPatterns.push(...customKeywords[field.fieldName]);
      confidence = Math.max(confidence, 0.9);
    }

    // Strategy 2: Data-driven patterns from examples
    if (characteristics) {
      if (characteristics.pattern && characteristics.patternConfidence > aggressiveness - 0.2) {
        searchPatterns.push(characteristics.pattern);
        confidence = Math.max(confidence, characteristics.patternConfidence);
        derivedFrom = 'hybrid';
      }

      if (characteristics.enum && characteristics.enum.length > 0) {
        searchPatterns.push(`(${characteristics.enum.join('|')})`);
        confidence = Math.max(confidence, 0.85);
      }

      if (characteristics.sampleValues.length > 0) {
        const values = characteristics.sampleValues
          .filter((v) => typeof v === 'string' || typeof v === 'number')
          .slice(0, 3);
        searchPatterns.push(`\\b(${values.join('|')})\\b`);
        confidence = Math.max(confidence, 0.65);
      }
    }

    // Strategy 3: Schema hints
    if (field.description) {
      searchPatterns.push(`(?i)${field.fieldName}`); // Field name as fallback
      if (confidence === 0) confidence = 0.5;
    }

    // Strategy 4: Use schema pattern if available
    if (field.pattern) {
      searchPatterns.push(field.pattern);
      confidence = Math.max(confidence, 0.7);
    }

    if (searchPatterns.length === 0) {
      return null;
    }

    // Apply aggressiveness threshold
    if (confidence < aggressiveness * 0.7) {
      return null; // Too low confidence for this aggressiveness level
    }

    const rule: GeneratedRule = {
      id: uuidv4(),
      fieldName: field.fieldName as any,
      searchKeywords: searchPatterns,
      confidence,
      isRequired: field.isRequired,
      dataType: field.dataType as any,
      derivedFrom,
      rationale: this.generateRationale(field, characteristics, derivedFrom),
      description: field.description,
    } as unknown as GeneratedRule;

    return rule;
  }

  /**
   * Generate explanation for why this rule was created
   */
  private generateRationale(
    field: SchemaField,
    characteristics: FieldCharacteristics | undefined,
    derivedFrom: string
  ): string {
    if (derivedFrom === 'hybrid') {
      return `Generated from schema + ${characteristics?.sampleValues.length || 0} data samples`;
    } else if (derivedFrom === 'examples') {
      return `Generated from ${characteristics?.sampleValues.length || 0} example values`;
    } else {
      return `Generated from schema definition (${field.dataType})`;
    }
  }

  /**
   * Calculate generation statistics
   */
  private calculateStats(rules: GeneratedRule[]): GenerationStats {
    const schemaOnlyRules = rules.filter((r) => r.derivedFrom === 'schema').length;
    const dataInformedRules = rules.filter((r) => r.derivedFrom === 'examples' || r.derivedFrom === 'hybrid').length;
    const lowConfidenceRules = rules.filter((r) => r.confidence < 0.6).length;

    return {
      totalFieldsProcessed: rules.length,
      rulesGenerated: rules.length,
      averageConfidence: rules.length > 0 ? rules.reduce((sum, r) => sum + r.confidence, 0) / rules.length : 0,
      schemaOnlyRules,
      dataInformedRules,
      lowConfidenceRules,
    };
  }

  /**
   * Generate warnings about rule quality
   */
  private generateWarnings(rules: GeneratedRule[], aggressiveness: number): string[] {
    const warnings: string[] = [];

    const lowConfidence = rules.filter((r) => r.confidence < 0.6);
    if (lowConfidence.length > 0) {
      warnings.push(
        `${lowConfidence.length} rules have low confidence (< 0.6). Consider increasing examples or aggressiveness.`
      );
    }

    if (aggressiveness < 0.4) {
      warnings.push('Conservative mode: May miss valid extractions. Increase aggressiveness if needed.');
    }

    if (aggressiveness > 0.8) {
      warnings.push('Aggressive mode: May have false positives. Review rules manually.');
    }

    return warnings;
  }
}
