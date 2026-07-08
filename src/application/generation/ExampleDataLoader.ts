/**
 * ExampleDataLoader - Lädt und validiert Trainings-Beispiel-Daten
 *
 * Sicherheit:
 * - Dateigröße geprüft (max 10MB)
 * - JSON Schema validiert
 * - Keine bösen Einträge
 * - Type-Safe
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Input-Optionen für ExampleDataLoader
 */
export interface ExampleLoaderOptions {
  /** Verzeichnis mit Beispiel-Dateien */
  examplesDir: string;

  /** Max Dateigröße in Bytes (default: 10MB) */
  maxFileSizeBytes?: number;

  /** Strict Mode: Fehler bei unbekannten Feldern? */
  strictMode?: boolean;

  /** Tiefe der JSON Struktur (default: 5) */
  maxDepth?: number;
}

/**
 * Geladenes Beispiel
 */
export interface LoadedExample {
  /** Name des Beispiels (filename without .json) */
  name: string;

  /** Die Beispiel-Daten */
  data: Record<string, unknown>;

  /** Anzahl der Felder */
  fieldCount: number;

  /** Feldnamen */
  fieldNames: string[];

  /** Wann wurde es geladen? */
  loadedAt: Date;

  /** Dateipath */
  filePath: string;

  /** Dateigröße in Bytes */
  fileSizeBytes: number;
}

/**
 * ExampleDataLoader - Lädt Trainings-Daten
 */
export class ExampleDataLoader {
  private readonly examplesDir: string;
  private readonly maxFileSizeBytes: number;
  private readonly strictMode: boolean;
  private readonly maxDepth: number;

  constructor(options: ExampleLoaderOptions) {
    this.examplesDir = options.examplesDir;
    this.maxFileSizeBytes = options.maxFileSizeBytes || 10 * 1024 * 1024; // 10MB default
    this.strictMode = options.strictMode ?? true;
    this.maxDepth = options.maxDepth || 5;
  }

  /**
   * Laden einzelnes Beispiel
   */
  async loadExample(name: string): Promise<LoadedExample> {
    // Sicherheit: Pfad validieren (keine Directory Traversal)
    const safeName = this.sanitizeFileName(name);
    const filePath = path.join(this.examplesDir, `${safeName}.json`);

    // Prüfe ob Pfad wirklich im examplesDir ist
    const resolvedPath = path.resolve(filePath);
    const resolvedExamplesDir = path.resolve(this.examplesDir);

    if (!resolvedPath.startsWith(resolvedExamplesDir)) {
      throw new Error(`Security: Path traversal detected for "${name}"`);
    }

    // Datei existiert?
    try {
      const stats = await fs.stat(resolvedPath);

      // Größe prüfen
      if (stats.size > this.maxFileSizeBytes) {
        throw new Error(
          `File too large: ${stats.size} bytes (max: ${this.maxFileSizeBytes})`
        );
      }

      // Datei lesen
      const fileContent = await fs.readFile(resolvedPath, 'utf-8');

      // JSON parsen
      let data: unknown;
      try {
        data = JSON.parse(fileContent);
      } catch (e) {
        throw new Error(`Invalid JSON in ${name}: ${e instanceof Error ? e.message : String(e)}`);
      }

      // Validierung
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error(`Example data must be an object, not ${typeof data}`);
      }

      // Tiefe prüfen
      this.checkDepth(data, 0);

      // Field-Namen extrahieren
      const fieldNames = Object.keys(data);

      // Sicherheits-Check: Feldnamen validieren
      for (const fieldName of fieldNames) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName)) {
          throw new Error(
            `Invalid field name: "${fieldName}" (must match /^[a-zA-Z_][a-zA-Z0-9_]*$/)`
          );
        }
      }

      return {
        name: safeName,
        data: data as Record<string, unknown>,
        fieldCount: fieldNames.length,
        fieldNames,
        loadedAt: new Date(),
        filePath: resolvedPath,
        fileSizeBytes: stats.size
      };
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(`Failed to load example "${name}": ${e.message}`);
      }
      throw e;
    }
  }

  /**
   * Lade alle Beispiele aus dem Verzeichnis
   */
  async loadAllExamples(): Promise<LoadedExample[]> {
    try {
      const files = await fs.readdir(this.examplesDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      const examples: LoadedExample[] = [];

      for (const file of jsonFiles) {
        const name = file.replace('.json', '');
        try {
          const example = await this.loadExample(name);
          examples.push(example);
        } catch (e) {
          if (this.strictMode) {
            throw e;
          }
          console.warn(`Warning: Skipped ${file}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      return examples;
    } catch (e) {
      throw new Error(
        `Failed to load examples from ${this.examplesDir}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  /**
   * Sichere Feldnamen (gegen Path Traversal)
   */
  private sanitizeFileName(name: string): string {
    // Nur alphanumerisch, Unterstrich, Bindestrich
    return name.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  /**
   * Prüfe Tiefe der JSON-Struktur (DoS-Prävention)
   */
  private checkDepth(obj: unknown, currentDepth: number): void {
    if (currentDepth > this.maxDepth) {
      throw new Error(`JSON nesting too deep (max depth: ${this.maxDepth})`);
    }

    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        for (const item of obj) {
          this.checkDepth(item, currentDepth + 1);
        }
      } else {
        for (const value of Object.values(obj)) {
          this.checkDepth(value, currentDepth + 1);
        }
      }
    }
  }

  /**
   * Validiere dass Beispiel zu Schema passt
   */
  validateAgainstSchema(
    example: LoadedExample,
    schema: {
      fields: { fieldName: string; fieldType: string; isRequired: boolean }[];
    }
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const schemaFieldNames = new Set(schema.fields.map(f => f.fieldName));
    // TODO: Validate example field names match schema

    // Prüfe ob alle erforderlichen Felder vorhanden sind
    for (const field of schema.fields) {
      if (field.isRequired && !example.data[field.fieldName]) {
        errors.push(`Required field missing: ${field.fieldName}`);
      }
    }

    // Prüfe ob unerwartete Felder in Beispiel sind
    for (const exampleField of example.fieldNames) {
      if (!schemaFieldNames.has(exampleField)) {
        warnings.push(`Unexpected field in example: ${exampleField}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get field values (Trainings-Daten für ein Feld)
   */
  getFieldValues(example: LoadedExample, fieldName: string): unknown[] {
    if (fieldName in example.data) {
      const value = example.data[fieldName];
      // Falls Array, alle Werte zurückgeben, sonst einen Eintrag
      if (Array.isArray(value)) {
        return value;
      }
      return [value];
    }
    return [];
  }
}

/**
 * Factory für ExampleDataLoader
 */
export class ExampleDataLoaderFactory {
  static create(examplesDir: string, options?: Partial<ExampleLoaderOptions>): ExampleDataLoader {
    return new ExampleDataLoader({
      examplesDir,
      ...options
    });
  }

  /**
   * Create mit Default-Pfad
   */
  static createDefault(): ExampleDataLoader {
    const examplesDir = path.join(process.cwd(), 'extraction-rules', 'examples');
    return new ExampleDataLoader({
      examplesDir,
      maxFileSizeBytes: 10 * 1024 * 1024,
      strictMode: true
    });
  }
}
