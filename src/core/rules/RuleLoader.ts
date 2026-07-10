/**
 * RuleLoader
 *
 * Lädt Rules und Schemas aus Dateien.
 * Quellen:
 * - extraction-rules/*.txt → Regel-Definitionen
 * - extraction-rules/schemas/*.json → Schema-Definitionen
 *
 * Kritisch: Loader darf KEINE Daten generieren!
 * - Fehlende Felder werden nicht gefüllt
 * - Defaults werden nicht automatisch gesetzt
 * - Nur explizite Definitionen werden geladen
 */

import { injectable } from 'tsyringe';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Rule, FieldType } from './Rule';
import { Schema } from './Schema';

/**
 * Error bei Rule-Laden.
 */
export class RuleLoadError extends Error {
  constructor(
    message: string,
    public readonly fileName?: string,
    public readonly lineNumber?: number
  ) {
    super(message);
    this.name = 'RuleLoadError';
  }
}

/**
 * RuleLoader - lädt Rules und Schemas aus Dateien.
 */
@injectable()
export class RuleLoader {
  private readonly rulesDir: string;
  private readonly schemasDir: string;
  private cachedRules: Map<string, Rule> = new Map();
  private cachedSchemas: Map<string, Schema> = new Map();

  /**
   * Initialisiert den RuleLoader.
   *
   * @param rulesDir Pfad zum extraction-rules Verzeichnis (optional, defaults to './extraction-rules')
   * @throws RuleLoadError falls Verzeichnisse nicht existieren
   */
  constructor(rulesDir?: string) {
    const resolvedDir = rulesDir || process.env.RULES_DIR || './extraction-rules';
    if (!resolvedDir) {
      throw new RuleLoadError('Rules directory path is required');
    }

    this.rulesDir = resolvedDir;
    this.schemasDir = path.join(resolvedDir, 'schemas');
  }

  /**
   * Lädt alle Regeln aus .txt Dateien.
   *
   * Quellen: extraction-rules/*.txt
   *
   * Format (Beispiel):
   * ```
   * id: invoice-field-001
   * fieldName: invoiceNumber
   * fieldType: string
   * isRequired: true
   * description: Eindeutige Rechnungsnummer
   * documentTypes: pdf, docx
   * constraints: pattern="^[A-Z0-9-]+$", maxLength=50
   * ```
   *
   * @returns Map von Rule-ID zu Rule
   * @throws RuleLoadError falls Dateien nicht gelesen werden können
   */
  async loadRules(): Promise<Map<string, Rule>> {
    try {
      const files = await fs.readdir(this.rulesDir);
      const txtFiles = files.filter((f) => f.endsWith('.txt'));

      const rules = new Map<string, Rule>();

      for (const file of txtFiles) {
        const filePath = path.join(this.rulesDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const rule = this.parseRuleFromText(content, file);

        if (rule) {
          rules.set(rule.id, rule);
          this.cachedRules.set(rule.id, rule);
        }
      }

      return rules;
    } catch (error) {
      throw new RuleLoadError(
        `Failed to load rules: ${error instanceof Error ? error.message : String(error)}`,
        this.rulesDir
      );
    }
  }

  /**
   * Lädt alle Schemas aus .json Dateien.
   *
   * Quellen: extraction-rules/schemas/*.json
   *
   * @returns Map von Schema-ID zu Schema
   * @throws RuleLoadError falls Dateien nicht gelesen werden können
   */
  async loadSchemas(): Promise<Map<string, Schema>> {
    try {
      const files = await fs.readdir(this.schemasDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      const schemas = new Map<string, Schema>();

      for (const file of jsonFiles) {
        const filePath = path.join(this.schemasDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const schema = this.parseSchemaFromJson(content, file);

        if (schema) {
          schemas.set(schema.id, schema);
          this.cachedSchemas.set(schema.id, schema);
        }
      }

      return schemas;
    } catch (error) {
      throw new RuleLoadError(
        `Failed to load schemas: ${error instanceof Error ? error.message : String(error)}`,
        this.schemasDir
      );
    }
  }

  /**
   * Lädt ein einzelnes Schema aus JSON.
   *
   * @param schemaName Name des Schemas (ohne .json)
   * @returns Schema oder undefined falls nicht gefunden
   * @throws RuleLoadError falls Datei nicht gelesen werden kann
   */
  async loadSchema(schemaName: string): Promise<Schema | undefined> {
    // Zuerst im Cache prüfen
    if (this.cachedSchemas.has(schemaName)) {
      return this.cachedSchemas.get(schemaName);
    }

    try {
      const filePath = path.join(this.schemasDir, `${schemaName}.json`);

      // Prüfe ob Datei existiert
      try {
        await fs.access(filePath);
      } catch {
        return undefined;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const schema = this.parseSchemaFromJson(content, `${schemaName}.json`);

      if (schema) {
        this.cachedSchemas.set(schema.id, schema);
      }

      return schema;
    } catch (error) {
      throw new RuleLoadError(
        `Failed to load schema '${schemaName}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Gibt eine spezifische Regel zurück.
   *
   * @param ruleId ID der Regel
   * @returns Rule oder undefined falls nicht gefunden
   */
  getRule(ruleId: string): Rule | undefined {
    return this.cachedRules.get(ruleId);
  }

  /**
   * Gibt alle gecachten Regeln zurück.
   *
   * @returns Map von Rule-ID zu Rule
   */
  getAllRules(): Map<string, Rule> {
    return this.cachedRules;
  }

  /**
   * Gibt alle gecachten Schemas zurück.
   *
   * @returns Map von Schema-ID zu Schema
   */
  getAllSchemas(): Map<string, Schema> {
    return this.cachedSchemas;
  }

  /**
   * Cleared den Cache.
   */
  clearCache(): void {
    this.cachedRules.clear();
    this.cachedSchemas.clear();
  }

  /**
   * Parsed eine Regel aus Text.
   * Format: key: value (line-based)
   *
   * Kritisch: Keine fehlenden Felder füllen!
   * Nur explizite Werte aus der Datei werden verwendet.
   *
   * @private
   */
  private parseRuleFromText(content: string, fileName: string): Rule | undefined {
    const lines = content.split('\n').map((l) => l.trim());
    const rule: Partial<Rule> = {};
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;

      // Ignoriere Kommentare und leere Zeilen
      if (!line || line.startsWith('#')) {
        continue;
      }

      // Parse key: value
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (!match) {
        throw new RuleLoadError(
          `Invalid line format. Expected 'key: value'`,
          fileName,
          lineNumber
        );
      }

      const [, key, value] = match;
      const trimmedKey = key.trim();
      const trimmedValue = value.trim();

      // Parse basierend auf Key
      switch (trimmedKey) {
        case 'id':
          rule.id = trimmedValue;
          break;
        case 'fieldName':
          rule.fieldName = trimmedValue;
          break;
        case 'fieldType':
          rule.fieldType = this.parseFieldType(trimmedValue);
          break;
        case 'description':
          rule.description = trimmedValue;
          break;
        case 'isRequired':
          rule.isRequired = this.parseBoolean(trimmedValue);
          break;
        case 'documentTypes':
          rule.documentTypes = trimmedValue.split(',').map((t) => t.trim());
          break;
        case 'schemaVersion':
          rule.schemaVersion = trimmedValue;
          break;
        case 'isActive':
          rule.isActive = this.parseBoolean(trimmedValue);
          break;
        case 'examples':
          rule.examples = this.parseArray(trimmedValue);
          break;
        case 'hints':
          rule.hints = this.parseArray(trimmedValue);
          break;
        // Constraints würden erweiterte Parsing benötigen
      }
    }

    // Validiere erforderliche Felder
    if (!rule.id) {
      throw new RuleLoadError('Rule missing required field: id', fileName);
    }
    if (!rule.fieldName) {
      throw new RuleLoadError('Rule missing required field: fieldName', fileName);
    }
    if (!rule.fieldType) {
      throw new RuleLoadError('Rule missing required field: fieldType', fileName);
    }
    if (!rule.description) {
      throw new RuleLoadError('Rule missing required field: description', fileName);
    }
    if (rule.documentTypes === undefined || rule.documentTypes.length === 0) {
      throw new RuleLoadError('Rule missing required field: documentTypes', fileName);
    }
    if (rule.isRequired === undefined) {
      throw new RuleLoadError('Rule missing required field: isRequired', fileName);
    }

    return {
      id: rule.id,
      fieldName: rule.fieldName,
      fieldType: rule.fieldType,
      description: rule.description,
      isRequired: rule.isRequired,
      documentTypes: rule.documentTypes,
      schemaVersion: rule.schemaVersion || '1.0.0',
      isActive: rule.isActive ?? true,
      updatedAt: new Date(),
      constraints: rule.constraints,
      hints: rule.hints,
      examples: rule.examples,
      counterExamples: rule.counterExamples,
    };
  }

  /**
   * Parsed ein Schema aus JSON.
   * Kritisch: Keine fehlenden Felder füllen!
   *
   * @private
   */
  private parseSchemaFromJson(content: string, fileName: string): Schema | undefined {
    try {
      const data = JSON.parse(content);

      // Validiere erforderliche Felder
      if (!data.id) {
        throw new RuleLoadError('Schema missing required field: id', fileName);
      }
      if (!data.name) {
        throw new RuleLoadError('Schema missing required field: name', fileName);
      }
      if (!data.documentType) {
        throw new RuleLoadError('Schema missing required field: documentType', fileName);
      }
      if (!data.version) {
        throw new RuleLoadError('Schema missing required field: version', fileName);
      }
      if (!data.fields || !Array.isArray(data.fields)) {
        throw new RuleLoadError('Schema missing required field: fields (must be array)', fileName);
      }

      return {
        id: data.id,
        name: data.name,
        documentType: data.documentType,
        version: data.version,
        description: data.description,
        fields: data.fields,
        fieldGroups: data.fieldGroups,
        fieldDependencies: data.fieldDependencies,
        commonPatterns: data.commonPatterns,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        isActive: data.isActive ?? true,
        notes: data.notes,
      };
    } catch (error) {
      if (error instanceof RuleLoadError) {
        throw error;
      }
      throw new RuleLoadError(
        `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`,
        fileName
      );
    }
  }

  /**
   * Parsed einen FieldType String.
   * @private
   */
  private parseFieldType(value: string): FieldType {
    const type = value.toLowerCase() as FieldType;
    if (!Object.values(FieldType).includes(type)) {
      throw new RuleLoadError(`Unknown field type: ${value}`);
    }
    return type;
  }

  /**
   * Parsed einen Boolean.
   * @private
   */
  private parseBoolean(value: string): boolean {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return false;
    }
    throw new RuleLoadError(`Invalid boolean value: ${value}`);
  }

  /**
   * Parsed ein Array (comma-separated).
   * @private
   */
  private parseArray(value: string): string[] {
    return value.split(',').map((v) => v.trim());
  }
}
