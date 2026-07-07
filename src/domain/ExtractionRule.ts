import { ExtractionFieldName } from './ExtractionFieldName';
import { ExtractedValue } from './ExtractionModels';

/**
 * ExtractionRule - Definiert WAS extrahiert werden soll
 * Enthält NICHT die Information selbst
 */
export interface ExtractionRule {
  ruleId: string;
  fieldName: ExtractionFieldName;
  description: string;
  fieldType: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  isRequired: boolean;
  constraints?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowedValues?: any[];
  };
  documentTypes: ('pdf' | 'html' | 'image' | 'text')[];
}

/**
 * NoHallucination - Enforcement: Wert muss Quelle haben
 */
export function validateNoHallucination<T>(
  value: ExtractedValue<T>
): boolean {
  // Ein Wert ohne Quelle ist eine Halluzination
  if (value.value !== null && value.sources.length === 0) {
    return false;
  }

  // Low-Confidence-Werte sollten null sein
  if (
    value.value !== null &&
    value.confidence < 0.8 &&
    value.sources.length === 0
  ) {
    return false;
  }

  return true;
}

/**
 * ValidateRule - Prüft Extraktion gegen Rule
 */
export function validateAgainstRule<T>(
  value: ExtractedValue<T>,
  rule: ExtractionRule
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Erforderliche Felder
  if (rule.isRequired && value.value === null) {
    errors.push(`Field '${rule.fieldName.toString()}' is required but missing`);
  }

  // Halluzination-Check
  if (!validateNoHallucination(value)) {
    errors.push(`Field '${rule.fieldName.toString()}' fails no-hallucination check`);
  }

  // Confidence Check für erforderliche Felder
  if (rule.isRequired && value.value !== null && value.confidence < 0.8) {
    errors.push(
      `Field '${rule.fieldName.toString()}' confidence too low (${value.confidence})`
    );
  }

  // Type-Validierung
  if (value.value !== null) {
    const actualType = Array.isArray(value.value)
      ? 'array'
      : typeof value.value;
    if (actualType !== rule.fieldType && rule.fieldType !== 'object') {
      errors.push(
        `Field '${rule.fieldName.toString()}' has wrong type: ${actualType}, expected ${rule.fieldType}`
      );
    }
  }

  // Constraints
  if (value.value !== null && rule.constraints) {
    if (
      rule.constraints.minLength &&
      (value.value as any).length < rule.constraints.minLength
    ) {
      errors.push(
        `Field '${rule.fieldName.toString()}' is too short (min: ${rule.constraints.minLength})`
      );
    }
    if (
      rule.constraints.maxLength &&
      (value.value as any).length > rule.constraints.maxLength
    ) {
      errors.push(
        `Field '${rule.fieldName.toString()}' is too long (max: ${rule.constraints.maxLength})`
      );
    }
    if (
      rule.constraints.pattern &&
      !rule.constraints.pattern.test(String(value.value))
    ) {
      errors.push(
        `Field '${rule.fieldName.toString()}' does not match required pattern`
      );
    }
    if (
      rule.constraints.allowedValues &&
      !rule.constraints.allowedValues.includes(value.value)
    ) {
      errors.push(
        `Field '${rule.fieldName.toString()}' contains invalid value`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
