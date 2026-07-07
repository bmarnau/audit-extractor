/**
 * Phase 15: Schema-Driven Rule Generation
 * ResultMapper Implementation
 * 
 * Maps extracted fields to schema-compliant JSON output
 */

import Ajv from 'ajv';
import { ExtractedField } from '../../domain';

export interface MappedResult {
  data: Record<string, any>;
  coverage: number;                     // 0-100: % of schema fields extracted
  validationErrors: string[];
  isValid: boolean;
}

export class ResultMapper {
  private ajv = new Ajv();

  /**
   * Map extracted fields to JSON structure following schema
   */
  public mapToSchema(
    extractedFields: ExtractedField[],
    schemaFields: any[],
    schema: any
  ): MappedResult {
    const data: Record<string, any> = {};
    const validationErrors: string[] = [];

    // Build nested structure
    for (const field of extractedFields) {
      this.setNestedValue(data, field.fieldName, field.value);
    }

    // Validate against schema
    const isValid = this.validateAgainstSchema(data, schema, validationErrors);

    // Calculate coverage
    const coverage = this.calculateCoverage(schemaFields, data);

    return {
      data,
      coverage,
      validationErrors,
      isValid,
    };
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Validate result against JSON Schema
   */
  private validateAgainstSchema(
    data: Record<string, any>,
    schema: any,
    validationErrors: string[]
  ): boolean {
    try {
      const validate = this.ajv.compile(schema);
      const valid = validate(data);

      if (!valid && validate.errors) {
        validationErrors.push(
          ...validate.errors.map((err) => `${err.instancePath || 'root'} ${err.message}`)
        );
      }

      return valid || false;
    } catch (error) {
      validationErrors.push(`Schema validation error: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Calculate what % of schema fields were extracted
   */
  private calculateCoverage(schemaFields: any[], data: Record<string, any>): number {
    if (schemaFields.length === 0) return 0;

    let extractedCount = 0;

    for (const field of schemaFields) {
      if (this.hasValue(data, field.fieldName)) {
        extractedCount++;
      }
    }

    return Math.round((extractedCount / schemaFields.length) * 100);
  }

  /**
   * Check if nested path has a value
   */
  private hasValue(obj: Record<string, any>, path: string): boolean {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (!current || !current[part]) return false;
      current = current[part];
    }

    return current !== null && current !== undefined;
  }
}
