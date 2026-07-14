/**
 * ExtractionHint - Domain Value Object für Extraktions-Hinweise
 *
 * Enthält gelernte Muster und Metadaten für die Feldextraktion
 * basierend auf Schema und Beispieldaten-Analyse
 *
 * @version 0.22.0
 * @phase 22 - Job-Based Architecture
 */

/**
 * Erkannte Namenskonvention
 */
export type NamingConvention =
  | 'camelCase'
  | 'PascalCase'
  | 'snake_case'
  | 'kebab-case'
  | 'UPPER_SNAKE'
  | 'SCREAMING_KEBAB'
  | 'mixed'
  | 'unknown';

/**
 * Erkanntes Datenmuster
 */
export interface DataPattern {
  type: 'prefix' | 'suffix' | 'separator' | 'format' | 'regex';
  pattern: string;
  confidence: number; // 0-1
  examples: string[];
}

/**
 * Extraction Hint für ein Feld
 */
export interface ExtractionHint {
  // Field Location
  field: string; // e.g., "servers.name" or "invoiceNumber"
  fieldPath: string[]; // e.g., ["servers", "name"]
  depth: number; // Nested level

  // Data Characteristics
  dataType: string; // "string", "number", "date", "object", "array", etc.
  exampleValues: Array<string | number | boolean>;
  uniqueValueCount: number;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;

  // Pattern Recognition
  patterns: DataPattern[];
  namingConvention: NamingConvention;
  hasPrefix: boolean;
  hasSuffix: boolean;
  commonSeparators: string[];

  // Statistics
  occurrenceCount: number;
  nullValueCount: number;
  emptyStringCount: number;

  // Confidence
  confidence: number; // 0-1, overall hint confidence
}

/**
 * Collection von ExtractionHints
 */
export interface ExtractionHints {
  schemaName: string;
  totalExamples: number;
  hints: ExtractionHint[];
  generatedAt: Date;
}

/**
 * Factory für ExtractionHint
 */
export class ExtractionHintFactory {
  static create(
    field: string,
    fieldPath: string[],
    dataType: string,
    exampleValues: Array<string | number | boolean> = [],
    patterns: DataPattern[] = [],
    namingConvention: NamingConvention = 'unknown',
    occurrenceCount: number = 0,
    nullValueCount: number = 0
  ): ExtractionHint {
    // Auto-detect naming convention if not provided or 'unknown'
    const detectedConvention = namingConvention === 'unknown' || !namingConvention
      ? this.detectNamingConvention(field)
      : namingConvention;

    const depth = fieldPath.length - 1;
    const uniqueValues = new Set(exampleValues);
    const stringExamples = exampleValues.filter((v) => typeof v === 'string');

    return {
      field,
      fieldPath,
      depth,
      dataType,
      exampleValues: Array.from(exampleValues),
      uniqueValueCount: uniqueValues.size,
      patterns,
      namingConvention: detectedConvention,
      hasPrefix: this.detectPrefix(stringExamples),
      hasSuffix: this.detectSuffix(stringExamples),
      commonSeparators: this.detectSeparators(stringExamples),
      occurrenceCount,
      nullValueCount,
      emptyStringCount: stringExamples.filter((v) => v === '').length,
      confidence: this.calculateConfidence(
        exampleValues.length,
        uniqueValues.size,
        patterns.length,
        detectedConvention
      ),
    };
  }

  /**
   * Detect naming convention from field name
   */
  private static detectNamingConvention(field: string): NamingConvention {
    if (!field) return 'unknown';

    // Check for SCREAMING_KEBAB
    if (/^[A-Z]+(_[A-Z]+)+$/.test(field)) return 'SCREAMING_KEBAB';
    
    // Check for kebab-case
    if (/^[a-z]+(-[a-z]+)+$/.test(field)) return 'kebab-case';
    
    // Check for UPPER_SNAKE
    if (/^[A-Z]+(_[A-Z]+)+$/.test(field)) return 'UPPER_SNAKE';
    
    // Check for snake_case
    if (/^[a-z]+(_[a-z]+)+$/.test(field)) return 'snake_case';
    
    // Check for PascalCase
    if (/^[A-Z][a-zA-Z0-9]*([A-Z][a-z0-9]*)*$/.test(field) && field !== field.toLowerCase() && field !== field.toUpperCase()) {
      return 'PascalCase';
    }
    
    // Check for camelCase
    if (/^[a-z]+([A-Z][a-z0-9]*)*$/.test(field)) return 'camelCase';
    
    // Default
    return 'unknown';
  }

  private static detectPrefix(examples: string[]): boolean {
    if (examples.length < 2) return false;
    const prefixes = examples.map((e) => e.substring(0, 3));
    const uniquePrefixes = new Set(prefixes);
    return uniquePrefixes.size < examples.length * 0.7; // 70% prefix similarity
  }

  private static detectSuffix(examples: string[]): boolean {
    if (examples.length < 2) return false;
    const suffixes = examples.map((e) => e.substring(Math.max(0, e.length - 3)));
    const uniqueSuffixes = new Set(suffixes);
    return uniqueSuffixes.size < examples.length * 0.7;
  }

  private static detectSeparators(examples: string[]): string[] {
    const separators: Record<string, number> = {};
    const commonSeps = ['-', '_', '.', '/', ':', ' ', '|'];

    for (const example of examples) {
      for (const sep of commonSeps) {
        if (example.includes(sep)) {
          separators[sep] = (separators[sep] ?? 0) + 1;
        }
      }
    }

    return Object.entries(separators)
      .filter(([, count]) => count >= examples.length * 0.5)
      .map(([sep]) => sep);
  }

  private static calculateConfidence(
    exampleCount: number,
    uniqueCount: number,
    patternCount: number,
    naming: NamingConvention
  ): number {
    let confidence = 0;

    // More examples = higher confidence
    confidence += Math.min(exampleCount / 10, 0.3);

    // Patterns = higher confidence
    confidence += Math.min(patternCount / 3, 0.3);

    // Known naming convention = higher confidence
    if (naming !== 'unknown' && naming !== 'mixed') {
      confidence += 0.2;
    } else {
      confidence += 0.05;
    }

    // Consistency = higher confidence
    if (uniqueCount <= exampleCount * 0.2) {
      confidence += 0.2; // High consistency
    } else if (uniqueCount <= exampleCount * 0.5) {
      confidence += 0.1; // Medium consistency
    }

    return Math.min(confidence, 1);
  }
}
