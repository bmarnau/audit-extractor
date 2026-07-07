/**
 * Phase 15: Schema-Driven Rule Generation
 * ExampleAnalyzer Implementation
 * 
 * Analyzes JSON examples to extract field characteristics, patterns, and search strategies.
 * Works with SchemaAnalyzer to complement schema-driven approach with data-driven insights.
 */

import { SchemaField } from './SchemaTypes';
import {
  FieldCharacteristics,
  ExampleAnalysisResult,
  DataQuality,
  SearchStrategy,
  StrategyOption,
} from './ExampleAnalyzerTypes';

export class ExampleAnalyzer {
  private MIN_EXAMPLES_FOR_RELIABILITY = 3;

  /**
   * Analyze examples for a given set of schema fields
   */
  public analyzeExamples(
    examples: any[],
    schemaFields: SchemaField[]
  ): ExampleAnalysisResult {
    if (!Array.isArray(examples) || examples.length === 0) {
      return this.createEmptyResult(schemaFields);
    }

    const characteristics: FieldCharacteristics[] = [];
    const warnings: string[] = [];

    // Analyze each schema field
    for (const field of schemaFields) {
      const fieldCharacteristics = this.analyzeField(field, examples);
      characteristics.push(fieldCharacteristics);
    }

    // Generate data quality assessment
    const dataQuality = this.assessDataQuality(characteristics, examples.length);

    if (examples.length < this.MIN_EXAMPLES_FOR_RELIABILITY) {
      warnings.push(
        `Only ${examples.length} examples provided. Recommend at least ${this.MIN_EXAMPLES_FOR_RELIABILITY} for reliable patterns.`
      );
    }

    return {
      exampleCount: examples.length,
      fieldCharacteristics: characteristics,
      dataQuality,
      warnings,
      analyzedAt: new Date(),
    };
  }

  /**
   * Analyze a single field across all examples
   */
  private analyzeField(field: SchemaField, examples: any[]): FieldCharacteristics {
    const values = this.extractFieldValues(field.jsonPath, examples);
    const observedTypes = this.getObservedTypes(values);
    const frequency = values.length / examples.length;

    // Generate patterns from non-null values
    const nonNullValues = values.filter((v) => v !== null && v !== undefined);
    const { pattern, patternConfidence } = this.generatePattern(nonNullValues, field.dataType);

    // Extract numeric bounds if applicable
    const numericValues = nonNullValues.filter((v) => typeof v === 'number');
    const minValue = numericValues.length > 0 ? Math.min(...numericValues) : undefined;
    const maxValue = numericValues.length > 0 ? Math.max(...numericValues) : undefined;

    // Extract string bounds
    const stringValues = nonNullValues.filter((v) => typeof v === 'string');
    const minLength = stringValues.length > 0 ? Math.min(...stringValues.map((s) => s.length)) : undefined;
    const maxLength = stringValues.length > 0 ? Math.max(...stringValues.map((s) => s.length)) : undefined;

    // Find common enum values
    const enumCandidates = this.findEnumValues(nonNullValues);

    // Check if typically an array
    const arrayValues = values.filter((v) => Array.isArray(v));
    const isArray = arrayValues.length / values.length > 0.5;

    return {
      fieldName: field.fieldName,
      observedTypes,
      sampleValues: nonNullValues.slice(0, 5),
      frequency: Math.round(frequency * 100) / 100,
      uniqueCount: new Set(nonNullValues).size,
      pattern,
      patternConfidence,
      minLength,
      maxLength,
      minValue,
      maxValue,
      enum: enumCandidates.length > 0 ? enumCandidates : undefined,
      isNullable: values.some((v) => v === null || v === undefined),
      isArray,
    };
  }

  /**
   * Extract values for a field across all examples using jsonPath
   */
  private extractFieldValues(jsonPath: string, examples: any[]): any[] {
    const values: any[] = [];

    for (const example of examples) {
      const value = this.getNestedValue(example, jsonPath);
      values.push(value);
    }

    return values;
  }

  /**
   * Get value from nested object using jsonPath notation (e.g., "invoice.amount")
   */
  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Determine what types were observed for values
   */
  private getObservedTypes(values: any[]): Set<string> {
    const types = new Set<string>();

    for (const value of values) {
      if (value === null) {
        types.add('null');
      } else if (value === undefined) {
        types.add('undefined');
      } else if (Array.isArray(value)) {
        types.add('array');
      } else {
        types.add(typeof value);
      }
    }

    return types;
  }

  /**
   * Generate regex pattern from sample values
   */
  private generatePattern(values: any[], expectedType: string): { pattern?: string; patternConfidence: number } {
    if (values.length === 0) {
      return { patternConfidence: 0 };
    }

    // For strings, try to find common pattern
    if (expectedType === 'string' || typeof values[0] === 'string') {
      const stringValues = values.filter((v) => typeof v === 'string');
      if (stringValues.length < 2) {
        return { patternConfidence: 0 };
      }

      // Try simple patterns
      if (this.isAllEmail(stringValues)) {
        return {
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          patternConfidence: 0.9,
        };
      }

      if (this.isAllPhoneNumber(stringValues)) {
        return {
          pattern: '^\\+?1?\\d{9,15}$',
          patternConfidence: 0.8,
        };
      }

      if (this.isAllDateFormat(stringValues)) {
        return {
          pattern: '^\\d{4}-\\d{2}-\\d{2}',
          patternConfidence: 0.85,
        };
      }

      if (this.isAllCurrency(stringValues)) {
        return {
          pattern: '^\\$?\\d+(\\.\\d{2})?$',
          patternConfidence: 0.8,
        };
      }
    }

    return { patternConfidence: 0 };
  }

  /**
   * Find common enum values if the field has limited distinct values
   */
  private findEnumValues(values: any[]): any[] {
    if (values.length === 0) {
      return [];
    }

    const uniqueCount = new Set(values).size;

    // If <= 5 unique values, consider as enum
    if (uniqueCount <= 5) {
      return Array.from(new Set(values)).sort();
    }

    return [];
  }

  /**
   * Simple heuristic: is this all email addresses?
   */
  private isAllEmail(values: string[]): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return values.length >= 2 && values.every((v) => emailRegex.test(v));
  }

  /**
   * Simple heuristic: is this all phone numbers?
   */
  private isAllPhoneNumber(values: string[]): boolean {
    const phoneRegex = /^\+?1?\d{9,15}$/;
    return values.length >= 2 && values.every((v) => phoneRegex.test(v));
  }

  /**
   * Simple heuristic: is this all dates?
   */
  private isAllDateFormat(values: string[]): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{4}/;
    return values.length >= 2 && values.every((v) => dateRegex.test(v));
  }

  /**
   * Simple heuristic: is this all currency amounts?
   */
  private isAllCurrency(values: string[]): boolean {
    const currencyRegex = /^\$?\d+(\.\d{2})?$|^[A-Z]{3}\s*\d+(\.\d{2})?$/;
    return values.length >= 2 && values.every((v) => currencyRegex.test(v));
  }

  /**
   * Generate search strategies for finding a field in extracted text
   */
  public generateSearchStrategies(
    characteristics: FieldCharacteristics[]
  ): SearchStrategy[] {
    const strategies: SearchStrategy[] = [];

    for (const char of characteristics) {
      const strategyOptions: StrategyOption[] = [];

      // Strategy 1: Regex pattern if we found one
      if (char.pattern && char.patternConfidence > 0.6) {
        strategyOptions.push({
          type: 'regex',
          pattern: char.pattern,
          confidence: char.patternConfidence,
          explanation: `Regex pattern extracted from ${char.sampleValues.length} sample values`,
        });
      }

      // Strategy 2: Keyword matching on sample values
      if (char.sampleValues.length > 0) {
        const keywords = char.sampleValues
          .filter((v) => typeof v === 'string' || typeof v === 'number')
          .slice(0, 3)
          .join('|');

        strategyOptions.push({
          type: 'keyword',
          pattern: keywords,
          confidence: 0.6,
          explanation: `Common values: ${keywords}`,
        });
      }

      // Strategy 3: Enum matching if applicable
      if (char.enum && char.enum.length > 0) {
        strategyOptions.push({
          type: 'keyword',
          pattern: char.enum.join('|'),
          confidence: 0.85,
          explanation: `Discrete values: ${char.enum.join(', ')}`,
        });
      }

      // Strategy 4: Format-based matching (for phone, email, etc)
      if (char.pattern && char.pattern.includes('@')) {
        strategyOptions.push({
          type: 'format',
          pattern: 'email',
          confidence: 0.9,
          explanation: 'All samples are email addresses',
        });
      }

      if (strategyOptions.length > 0) {
        const estimatedReliability = Math.max(...strategyOptions.map((s) => s.confidence));

        strategies.push({
          fieldName: char.fieldName,
          strategies: strategyOptions.sort((a, b) => b.confidence - a.confidence),
          estimatedReliability,
        });
      }
    }

    return strategies;
  }

  /**
   * Assess overall data quality
   */
  private assessDataQuality(
    characteristics: FieldCharacteristics[],
    exampleCount: number
  ): DataQuality {
    // Completeness: % of fields with values across all examples
    const completenessPercentage =
      characteristics.reduce((sum, char) => sum + char.frequency * 100, 0) / characteristics.length;

    // Consistency: Are field types stable?
    const consistencyScore = characteristics.reduce((sum, char) => {
      // If field only has 1 observed type, it's consistent
      return sum + (char.observedTypes.size === 1 ? 1 : 0.5);
    }, 0) / characteristics.length;

    // Pattern reliability: Do extracted patterns have high confidence?
    const patternsCount = characteristics.filter((c) => c.pattern).length;
    const patternReliability =
      patternsCount > 0
        ? characteristics
            .filter((c) => c.pattern)
            .reduce((sum, c) => sum + c.patternConfidence, 0) / patternsCount
        : 0;

    // Is this reliable enough?
    const isReliable =
      exampleCount >= this.MIN_EXAMPLES_FOR_RELIABILITY &&
      completenessPercentage >= 60 &&
      consistencyScore >= 0.7;

    return {
      completenessPercentage: Math.round(completenessPercentage),
      consistencyScore: Math.round(consistencyScore * 100) / 100,
      patternReliability: Math.round(patternReliability * 100) / 100,
      minExamplesForReliability: this.MIN_EXAMPLES_FOR_RELIABILITY,
      isReliable,
    };
  }

  /**
   * Create empty result when no examples provided
   */
  private createEmptyResult(schemaFields: SchemaField[]): ExampleAnalysisResult {
    const characteristics = schemaFields.map((field) => ({
      fieldName: field.fieldName,
      observedTypes: new Set<string>(),
      sampleValues: [],
      frequency: 0,
      uniqueCount: 0,
      patternConfidence: 0,
      isNullable: true,
      isArray: false,
    } as FieldCharacteristics));

    return {
      exampleCount: 0,
      fieldCharacteristics: characteristics,
      dataQuality: {
        completenessPercentage: 0,
        consistencyScore: 0,
        patternReliability: 0,
        minExamplesForReliability: this.MIN_EXAMPLES_FOR_RELIABILITY,
        isReliable: false,
      },
      warnings: ['No examples provided. Cannot extract patterns or assess data quality.'],
      analyzedAt: new Date(),
    };
  }
}
