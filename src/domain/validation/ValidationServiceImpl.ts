/**
 * ValidationService Implementation
 *
 * AJV-basierte Validierung mit Custom-Schema-Support.
 * - Lädt Custom Schemas aus extraction-rules/schemas/
 * - Konvertiert zu JSON Schema für AJV
 * - Keine Datengenerierung - nur Validierung!
 */

import Ajv, { ValidateFunction } from 'ajv';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ExtractionResult } from '@core/models';
import {
  IValidationService,
  ValidationResult,
  ValidationError,
  SchemaInfo,
  ValidationServiceError,
} from './ValidationService';

/**
 * Custom Schema Field Definition.
 */
interface CustomSchemaField {
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  description?: string;
}

/**
 * Custom Schema Format (aus extraction-rules/schemas/).
 */
interface CustomSchema {
  documentType: string;
  version?: string;
  description?: string;
  fields: CustomSchemaField[];
}

/**
 * AJV-basierte Implementation des ValidationService.
 */
export class AjvValidationService implements IValidationService {
  private ajv: Ajv;
  private schemasDir: string;
  private schemaCache: Map<string, SchemaInfo> = new Map();
  private validatorCache: Map<string, ValidateFunction> = new Map();

  constructor(schemasDir: string = 'extraction-rules/schemas') {
    this.schemasDir = schemasDir;
    this.ajv = new Ajv({
      strict: true,
      verbose: true,
      useDefaults: false, // WICHTIG: Keine Default-Werte!
    });
  }

  /**
   * Lädt Schema für Dokumenttyp.
   * Unterstützt Custom-Schema-Format.
   */
  async loadSchema(documentType: string): Promise<SchemaInfo | null> {
    try {
      // Prüfe Cache
      if (this.schemaCache.has(documentType)) {
        return this.schemaCache.get(documentType)!;
      }

      // Suche Schema-Datei (mit Wildcard für Versionen)
      const schemaPath = await this.findSchemaFile(documentType);

      if (!schemaPath) {
        return null;
      }

      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      const customSchema = JSON.parse(schemaContent) as CustomSchema;

      // Validiere dass es ein echtes Custom Schema ist
      if (!this.isValidCustomSchema(customSchema)) {
        throw new ValidationServiceError(
          `Invalid Custom Schema in ${schemaPath}`,
          documentType
        );
      }

      // Konvertiere zu JSON Schema
      const jsonSchema = this.convertCustomSchemaToJsonSchema(customSchema);

      // Extrahiere Required + Optional Fields
      const requiredFields = this.extractRequiredFields(jsonSchema);
      const optionalFields = this.extractOptionalFields(jsonSchema);

      const schemaInfo: SchemaInfo = {
        documentType,
        schemaPath,
        schema: jsonSchema,
        requiredFields,
        optionalFields,
      };

      // Cache
      this.schemaCache.set(documentType, schemaInfo);

      return schemaInfo;
    } catch (error) {
      if (error instanceof ValidationServiceError) {
        throw error;
      }
      throw new ValidationServiceError(
        `Failed to load schema: ${error instanceof Error ? error.message : String(error)}`,
        documentType
      );
    }
  }

  /**
   * Validiert ExtractionResult.
   */
  async validate(result: ExtractionResult, documentType: string): Promise<ValidationResult> {
    try {
      // Lade Schema
      const schemaInfo = await this.loadSchema(documentType);

      if (!schemaInfo) {
        throw new ValidationServiceError(`Schema not found for type: ${documentType}`, documentType);
      }

      // Hole oder erstelle Validator
      let validator = this.validatorCache.get(documentType);

      if (!validator) {
        validator = this.ajv.compile(schemaInfo.schema);
        this.validatorCache.set(documentType, validator);
      }

      // Konvertiere ExtractionResult zu validierungsfähigem Objekt
      const dataToValidate = this.convertExtractionResultToValidationData(result);

      // Validiere
      const isValid = validator(dataToValidate);

      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];

      if (!isValid && validator.errors) {
        for (const error of validator.errors) {
          const validationError: ValidationError = {
            field: error.instancePath || 'root',
            message: error.message || 'Validation failed',
            value: this.getValueAt(dataToValidate, error.instancePath),
            schema: error.schema as Record<string, unknown>,
          };

          if (error.keyword === 'required') {
            warnings.push(validationError);
          } else {
            errors.push(validationError);
          }
        }
      }

      // Finde fehlende Felder
      const missingFields = this.findMissingFields(result, schemaInfo);

      return {
        documentId: result.extractedFields.size > 0 ? 'unknown' : 'unknown', // TODO: Aus Document
        documentType,
        isValid: errors.length === 0,
        errors,
        warnings,
        missingFields,
        validatedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof ValidationServiceError) {
        throw error;
      }
      throw new ValidationServiceError(
        `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
        documentType
      );
    }
  }

  /**
   * Lädt alle Schemas.
   */
  async loadAllSchemas(): Promise<SchemaInfo[]> {
    try {
      // Lese Verzeichnis
      const files = await fs.readdir(this.schemasDir);
      const schemaFiles = files.filter((f) => f.endsWith('.json'));

      const schemas: SchemaInfo[] = [];

      for (const file of schemaFiles) {
        // Extrahiere documentType aus Dateiname
        const documentType = file.split('-v')[0]; // z.B. "invoice-v1.0.0.json" → "invoice"
        const schema = await this.loadSchema(documentType);

        if (schema) {
          schemas.push(schema);
        }
      }

      return schemas;
    } catch (error) {
      console.warn('Failed to load all schemas:', error);
      return [];
    }
  }

  /**
   * Gibt unterstützte Dokumenttypen zurück.
   */
  async getSupportedDocumentTypes(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.schemasDir);
      const schemaFiles = files.filter((f) => f.endsWith('.json'));
      const types = schemaFiles.map((f) => f.split('-v')[0]);
      return Array.from(new Set(types)); // Deduplizieren
    } catch {
      return [];
    }
  }

  /**
   * Findet Schema-Datei für dokumentType (mit Wildcard-Support).
   * @private
   */
  private async findSchemaFile(documentType: string): Promise<string | null> {
    try {
      const files = await fs.readdir(this.schemasDir);
      // Suche Datei die mit documentType startet (z.B. "invoice-v1.0.0.json")
      const found = files.find(
        (f) => f.startsWith(documentType) && f.endsWith('.json')
      );
      return found
        ? path.join(this.schemasDir, found)
        : null;
    } catch {
      return null;
    }
  }

  /**
   * Konvertiert ExtractionResult zu Validierungs-Daten.
   * @private
   */
  private convertExtractionResultToValidationData(result: ExtractionResult): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    // Extrahiere Felder
    for (const [fieldName, field] of result.extractedFields.entries()) {
      data[fieldName] = field.value;
    }

    return data;
  }

  /**
   * Findet fehlende Felder.
   * @private
   */
  private findMissingFields(result: ExtractionResult, schemaInfo: SchemaInfo): string[] {
    const missing: string[] = [];
    const extractedFieldNames = Array.from(result.extractedFields.keys());

    // Prüfe Required Fields
    for (const requiredField of schemaInfo.requiredFields) {
      if (!extractedFieldNames.includes(requiredField)) {
        missing.push(requiredField);
      }
    }

    return missing;
  }

  /**
   * Extrahiert Required Fields aus Schema.
   * @private
   */
  private extractRequiredFields(schema: Record<string, unknown>): string[] {
    if (schema.required && Array.isArray(schema.required)) {
      return schema.required as string[];
    }
    return [];
  }

  /**
   * Extrahiert Optional Fields aus Schema.
   * @private
   */
  private extractOptionalFields(schema: Record<string, unknown>): string[] {
    const optional: string[] = [];

    if (schema.properties && typeof schema.properties === 'object') {
      const props = schema.properties as Record<string, unknown>;
      const required = this.extractRequiredFields(schema);

      for (const fieldName of Object.keys(props)) {
        if (!required.includes(fieldName)) {
          optional.push(fieldName);
        }
      }
    }

    return optional;
  }

  /**
   * Validiert dass es ein echtes Custom Schema ist.
   * @private
   */
  private isValidCustomSchema(schema: unknown): boolean {
    if (typeof schema !== 'object' || schema === null) {
      return false;
    }

    const s = schema as Record<string, unknown>;

    // Muss documentType und fields haben
    return (
      typeof s.documentType === 'string' &&
      Array.isArray(s.fields) &&
      s.fields.length > 0
    );
  }

  /**
   * Konvertiert Custom Schema zu JSON Schema (für AJV).
   * @private
   */
  private convertCustomSchemaToJsonSchema(
    customSchema: CustomSchema
  ): Record<string, unknown> {
    const properties: Record<string, Record<string, unknown>> = {};
    const required: string[] = [];

    for (const field of customSchema.fields) {
      // Konvertiere fieldType zu JSON Schema type
      const jsonType = this.mapFieldTypeToJsonType(field.fieldType);

      properties[field.fieldName] = {
        type: jsonType,
        description: field.description,
      };

      if (field.isRequired) {
        required.push(field.fieldName);
      }
    }

    return {
      type: 'object',
      properties,
      required,
      additionalProperties: false, // Nur in Schema definierte Felder erlaubt
    };
  }

  /**
   * Mappt Custom fieldType zu JSON Schema type.
   * @private
   */
  private mapFieldTypeToJsonType(fieldType: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      number: 'number',
      integer: 'integer',
      boolean: 'boolean',
      date: 'string', // Date als String
      datetime: 'string', // DateTime als String
      amount: 'number',
      percentage: 'number',
      array: 'array',
      object: 'object',
    };

    return typeMap[fieldType.toLowerCase()] || 'string';
  }

  /**
   * Holt Wert an Pfad.
   * @private
   */
  private getValueAt(obj: Record<string, unknown>, path: string): unknown {
    if (!path || path === '') {
      return obj;
    }

    const parts = path.split('/').filter((p) => p !== '');
    let current: unknown = obj;

    for (const part of parts) {
      if (typeof current === 'object' && current !== null) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }
}
