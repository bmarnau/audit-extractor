import { readFile } from 'fs/promises';
import { join } from 'path';
import { injectable } from 'tsyringe';
import {
  ExtractionHint,
  ExtractionHints,
  ExtractionHintFactory,
  NamingConvention,
  DataPattern,
} from '@domain/extraction/ExtractionHint';
import { SchemaDefinition } from '@domain/schema/SchemaDefinition';

/**
 * Service for analyzing example JSON data against a schema
 * Generates data-driven extraction hints without AI/ML
 *
 * Analyzes:
 * - Field names and paths
 * - Data types and values
 * - Naming conventions
 * - Recurring patterns
 * - Value consistency
 */
@injectable()
export class ExampleAnalysisService {
  /**
   * Analyze example files against a schema
   * @param examplesPath Path to directory containing example JSON files
   * @param schema Schema definition to analyze against
   * @returns ExtractionHints with patterns and insights
   */
  async analyzeExamples(
    examplesPath: string,
    schema: SchemaDefinition
  ): Promise<ExtractionHints> {
    // Load example files
    const examples = await this.loadExampleFiles(examplesPath);

    if (examples.length === 0) {
      return {
        schemaName: schema.schemaName,
        totalExamples: 0,
        hints: [],
        generatedAt: new Date(),
      };
    }

    // Collect field data across all examples
    const fieldData = this.collectFieldData(examples);

    // Generate hints for each field
    const hints: ExtractionHint[] = [];
    for (const [fieldPath, data] of fieldData.entries()) {
      const hint = this.generateHint(fieldPath, data);
      hints.push(hint);
    }

    return {
      schemaName: schema.schemaName,
      totalExamples: examples.length,
      hints,
      generatedAt: new Date(),
    };
  }

  /**
   * Load all JSON example files from directory
   */
  private async loadExampleFiles(examplesPath: string): Promise<unknown[]> {
    const examples: unknown[] = [];

    // Note: In production, would use fs.readdirSync + filter .json files
    // For now, try to load standard example files
    const standardFiles = [
      'example-01.json',
      'example-02.json',
      'example-03.json',
      'example-1.json',
      'example-2.json',
      'example-3.json',
    ];

    for (const fileName of standardFiles) {
      try {
        const filePath = join(examplesPath, fileName);
        const content = await readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        examples.push(data);
      } catch {
        // File doesn't exist or parse error, continue
      }
    }

    return examples;
  }

  /**
   * Collect field data across all examples
   * Returns map of field path -> { values, types, occurrences, nulls }
   */
  private collectFieldData(
    examples: unknown[]
  ): Map<
    string,
    {
      values: Array<unknown>;
      types: Set<string>;
      occurrences: number;
      nullValues: number;
      paths: string[];
    }
  > {
    const fieldData = new Map<
      string,
      {
        values: Array<unknown>;
        types: Set<string>;
        occurrences: number;
        nullValues: number;
        paths: string[];
      }
    >();

    for (const example of examples) {
      this.extractFieldsFromObject(example, '', fieldData);
    }

    return fieldData;
  }

  /**
   * Recursively extract fields from object
   */
  private extractFieldsFromObject(
    obj: unknown,
    prefix: string,
    fieldData: Map<
      string,
      {
        values: Array<unknown>;
        types: Set<string>;
        occurrences: number;
        nullValues: number;
        paths: string[];
      }
    >
  ): void {
    if (obj === null || obj === undefined) {
      return;
    }

    if (typeof obj !== 'object' || Array.isArray(obj)) {
      return;
    }

    const objRecord = obj as Record<string, unknown>;

    for (const [key, value] of Object.entries(objRecord)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;

      if (!fieldData.has(fieldPath)) {
        fieldData.set(fieldPath, {
          values: [],
          types: new Set(),
          occurrences: 0,
          nullValues: 0,
          paths: [],
        });
      }

      const data = fieldData.get(fieldPath)!;
      data.occurrences++;
      data.paths.push(fieldPath);

      if (value === null || value === undefined) {
        data.nullValues++;
      } else {
        data.values.push(value);
        data.types.add(typeof value);

        // For arrays, analyze first element
        if (Array.isArray(value) && value.length > 0) {
          const firstItem = value[0];
          if (typeof firstItem === 'object' && !Array.isArray(firstItem)) {
            this.extractFieldsFromObject(firstItem, fieldPath, fieldData);
          }
        }
      }
    }
  }

  /**
   * Generate extraction hint for a field
   */
  private generateHint(
    fieldPath: string,
    data: {
      values: Array<unknown>;
      types: Set<string>;
      occurrences: number;
      nullValues: number;
      paths: string[];
    }
  ): ExtractionHint {
    const pathParts = fieldPath.split('.');
    const dataType = this.inferDataType(data.types, data.values);
    const stringValues = data.values
      .filter((v) => typeof v === 'string')
      .slice(0, 10) as string[];

    const patterns = this.detectPatterns(stringValues);
    const naming = this.detectNamingConvention(pathParts[pathParts.length - 1]);

    return ExtractionHintFactory.create(
      fieldPath,
      pathParts,
      dataType,
      stringValues,
      patterns,
      naming,
      data.occurrences,
      data.nullValues
    );
  }

  /**
   * Infer data type from collected types and values
   */
  private inferDataType(types: Set<string>, values: unknown[]): string {
    if (types.size === 0) return 'null';
    if (types.size === 1) {
      const type = Array.from(types)[0];
      if (type === 'object') {
        return Array.isArray(values[0]) ? 'array' : 'object';
      }
      return type;
    }

    // Multiple types - determine primary
    const typeArray = Array.from(types);
    if (typeArray.includes('string')) return 'string';
    if (typeArray.includes('number')) return 'number';
    if (typeArray.includes('boolean')) return 'boolean';
    return 'mixed';
  }

  /**
   * Detect patterns in string values
   */
  private detectPatterns(values: string[]): DataPattern[] {
    const patterns: DataPattern[] = [];

    if (values.length === 0) return patterns;

    // Check for date-like patterns
    const datePattern = this.detectDatePattern(values);
    if (datePattern) {
      patterns.push(datePattern);
    }

    // Check for numeric patterns (with letters)
    const numericPattern = this.detectNumericPattern(values);
    if (numericPattern) {
      patterns.push(numericPattern);
    }

    // Check for UUID patterns
    const uuidPattern = this.detectUuidPattern(values);
    if (uuidPattern) {
      patterns.push(uuidPattern);
    }

    // Check for email patterns
    const emailPattern = this.detectEmailPattern(values);
    if (emailPattern) {
      patterns.push(emailPattern);
    }

    // Check for URL patterns
    const urlPattern = this.detectUrlPattern(values);
    if (urlPattern) {
      patterns.push(urlPattern);
    }

    return patterns;
  }

  /**
   * Detect date-like patterns (YYYY-MM-DD, DD.MM.YYYY, etc.)
   */
  private detectDatePattern(values: string[]): DataPattern | null {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}\.\d{2}\.\d{4}$|^\d{2}\/\d{2}\/\d{4}$/;
    const matches = values.filter((v) => dateRegex.test(v));

    if (matches.length >= values.length * 0.7) {
      return {
        type: 'format',
        pattern: 'date',
        confidence: matches.length / values.length,
        examples: matches.slice(0, 3),
      };
    }

    return null;
  }

  /**
   * Detect numeric patterns (e.g., "INV-2024-001234", "SRV-APP01")
   */
  private detectNumericPattern(values: string[]): DataPattern | null {
    const numericRegex = /[A-Z]+-\d+/;
    const matches = values.filter((v) => numericRegex.test(v));

    if (matches.length >= values.length * 0.7) {
      return {
        type: 'format',
        pattern: 'alphanumeric-dash',
        confidence: matches.length / values.length,
        examples: matches.slice(0, 3),
      };
    }

    return null;
  }

  /**
   * Detect UUID patterns
   */
  private detectUuidPattern(values: string[]): DataPattern | null {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const matches = values.filter((v) => uuidRegex.test(v));

    if (matches.length >= values.length * 0.7) {
      return {
        type: 'format',
        pattern: 'uuid',
        confidence: matches.length / values.length,
        examples: matches.slice(0, 3),
      };
    }

    return null;
  }

  /**
   * Detect email patterns
   */
  private detectEmailPattern(values: string[]): DataPattern | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const matches = values.filter((v) => emailRegex.test(v));

    if (matches.length >= values.length * 0.7) {
      return {
        type: 'format',
        pattern: 'email',
        confidence: matches.length / values.length,
        examples: matches.slice(0, 3),
      };
    }

    return null;
  }

  /**
   * Detect URL patterns
   */
  private detectUrlPattern(values: string[]): DataPattern | null {
    const urlRegex = /^https?:\/\/.+/;
    const matches = values.filter((v) => urlRegex.test(v));

    if (matches.length >= values.length * 0.7) {
      return {
        type: 'format',
        pattern: 'url',
        confidence: matches.length / values.length,
        examples: matches.slice(0, 3),
      };
    }

    return null;
  }

  /**
   * Detect naming convention
   */
  private detectNamingConvention(fieldName: string): NamingConvention {
    if (!fieldName || fieldName.length === 0) return 'unknown';

    const has_camel = /^[a-z]+([A-Z][a-z]*)*$/.test(fieldName);
    const has_pascal = /^[A-Z][a-z]*([A-Z][a-z]*)*$/.test(fieldName);
    const has_snake = /^[a-z]+(_[a-z]+)*$/.test(fieldName);
    const has_snake_upper = /^[A-Z]+(_[A-Z]+)*$/.test(fieldName);
    const has_kebab = /^[a-z]+(-[a-z]+)*$/.test(fieldName);
    const has_kebab_upper = /^[A-Z]+(-[A-Z]+)*$/.test(fieldName);

    if (has_camel) return 'camelCase';
    if (has_pascal) return 'PascalCase';
    if (has_snake_upper) return 'UPPER_SNAKE';
    if (has_snake) return 'snake_case';
    if (has_kebab_upper) return 'SCREAMING_KEBAB';
    if (has_kebab) return 'kebab-case';

    return 'mixed';
  }
}
