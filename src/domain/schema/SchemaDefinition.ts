/**
 * SchemaDefinition - Domain Value Object für Schema-Metadaten
 *
 * Repräsentiert die extrahierten Metadaten eines JSON Schemas
 * mit Feld-Informationen und Validierungsregeln
 *
 * @version 0.22.0
 * @phase 22 - Job-Based Architecture
 */

/**
 * Beschreibung eines Schemafelds
 */
export interface SchemaField {
  name: string;
  type: string;
  description?: string;
  enum?: Array<string | number | boolean>;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  format?: string; // e.g., "date", "email", "uri"
  items?: SchemaField; // For arrays
  properties?: Record<string, SchemaField>; // For objects
  required?: boolean; // derived from parent's required array
}

/**
 * Vollständige Schema-Definition mit Metadaten
 */
export interface SchemaDefinition {
  // Metadata
  schemaName: string;
  schemaVersion: string;
  title?: string;
  description?: string;

  // Fields
  fields: SchemaField[];
  requiredFields: string[];

  // Statistics
  totalFields: number;
  requiredFieldCount: number;
  dataTypes: Set<string>;

  // Raw Schema Reference
  rawSchema: Record<string, unknown>;
}

/**
 * Factory für SchemaDefinition
 */
export class SchemaDefinitionFactory {
  static create(
    schemaName: string,
    schemaVersion: string,
    fields: SchemaField[],
    requiredFields: string[],
    rawSchema: Record<string, unknown>,
    title?: string,
    description?: string
  ): SchemaDefinition {
    const dataTypes = new Set(fields.map((f) => f.type).filter(Boolean));

    return {
      schemaName,
      schemaVersion,
      title,
      description,
      fields,
      requiredFields,
      totalFields: fields.length,
      requiredFieldCount: requiredFields.length,
      dataTypes,
      rawSchema,
    };
  }

  /**
   * Erstelle SchemaDefinition aus typischem JSON Schema
   */
  static fromJsonSchema(
    schemaName: string,
    schemaVersion: string,
    jsonSchema: Record<string, unknown>
  ): SchemaDefinition {
    const properties = (jsonSchema.properties ??
      {}) as Record<string, unknown>;
    const required = (jsonSchema.required ?? []) as string[];
    const title = (jsonSchema.title as string) ?? schemaName;
    const description = (jsonSchema.description as string) ?? undefined;

    const fields: SchemaField[] = [];

    for (const [name, prop] of Object.entries(properties)) {
      const propObj = prop as Record<string, unknown>;
      const field: SchemaField = {
        name,
        type: (propObj.type as string) ?? 'unknown',
        description: (propObj.description as string) ?? undefined,
        enum: (propObj.enum as Array<string | number | boolean>) ?? undefined,
        pattern: (propObj.pattern as string) ?? undefined,
        minLength: (propObj.minLength as number) ?? undefined,
        maxLength: (propObj.maxLength as number) ?? undefined,
        minimum: (propObj.minimum as number) ?? undefined,
        maximum: (propObj.maximum as number) ?? undefined,
        format: (propObj.format as string) ?? undefined,
        required: required.includes(name),
      };
      fields.push(field);
    }

    return SchemaDefinitionFactory.create(
      schemaName,
      schemaVersion,
      fields,
      required,
      jsonSchema,
      title,
      description
    );
  }
}
