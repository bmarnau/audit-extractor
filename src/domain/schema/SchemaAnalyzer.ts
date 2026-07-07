/**
 * Phase 15: Schema-Driven Rule Generation
 * SchemaAnalyzer - Parse and analyze JSON Schemas
 * 
 * Responsibility:
 * - Parse JSON Schema (draft-07)
 * - Extract field definitions with metadata
 * - Handle nested objects and arrays
 * - Validate schema integrity
 * 
 * Version: 0.15.0
 * Phase: 15a (Backend Components)
 */

import {
  SchemaField,
  SchemaAnalysisResult,
  ValidationResult,
  JSONSchemaDefinition,
} from './SchemaTypes';

export class SchemaAnalyzer {
  /**
   * Analyze a JSON Schema and extract field definitions
   * 
   * @param schema - The JSON Schema to analyze
   * @param schemaId - Optional ID for this schema (generates UUID if not provided)
   * @returns Complete analysis result with all fields
   * @throws Error if schema is invalid
   */
  public analyzeSchema(
    schema: JSONSchemaDefinition,
    schemaId?: string
  ): SchemaAnalysisResult {
    // Validate the schema first
    const validation = this.validateSchema(schema);
    if (!validation.isValid) {
      throw new Error(`Invalid schema: ${validation.errors.join(', ')}`);
    }

    // Extract fields from properties
    const fields: SchemaField[] = [];
    const requiredFields = schema.required || [];

    if (schema.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
        const field = this.parseField(
          fieldName,
          fieldSchema,
          fieldName, // jsonPath starts with field name
          requiredFields.includes(fieldName)
        );
        fields.push(field);
      }
    }

    // Calculate statistics
    const result: SchemaAnalysisResult = {
      schemaId: schemaId || this.generateSchemaId(),
      fields,
      fieldCount: fields.length,
      totalFieldCount: this.countTotalFields(fields),
      requiredFieldCount: fields.filter(f => f.isRequired).length,
      arrayFieldCount: fields.filter(f => f.isArray).length,
      objectFieldCount: fields.filter(f => f.dataType === 'object').length,
      warnings: validation.warnings,
      schemaVersion: schema.$schema,
      schemaTitle: schema.title,
      analyzedAt: new Date(),
    };

    return result;
  }

  /**
   * Parse a single field from schema definition
   * Handles nested objects and arrays recursively
   */
  private parseField(
    fieldName: string,
    fieldSchema: JSONSchemaDefinition,
    jsonPath: string,
    isRequired: boolean
  ): SchemaField {
    const isArray = fieldSchema.type === 'array' || Array.isArray(fieldSchema.type);
    let dataType: SchemaField['dataType'] = 'string'; // default

    // Determine data type
    if (isArray) {
      dataType = 'array';
    } else if (fieldSchema.type === 'object') {
      dataType = 'object';
    } else if (fieldSchema.type === 'number') {
      dataType = 'number';
    } else if (fieldSchema.type === 'integer') {
      dataType = 'integer';
    } else if (fieldSchema.type === 'boolean') {
      dataType = 'boolean';
    } else if (fieldSchema.format === 'date' || fieldSchema.format === 'date-time') {
      dataType = 'date';
    } else if (fieldSchema.type === 'string') {
      dataType = 'string';
    } else if (fieldSchema.type === 'null') {
      dataType = 'null';
    }

    const field: SchemaField = {
      fieldName,
      jsonPath,
      dataType,
      isRequired,
      isArray,
      description: fieldSchema.description || fieldSchema.$comment,
      pattern: fieldSchema.pattern,
      enum: fieldSchema.enum,
      minimum: fieldSchema.minimum,
      maximum: fieldSchema.maximum,
      minLength: fieldSchema.minLength,
      maxLength: fieldSchema.maxLength,
      format: fieldSchema.format,
      examples: fieldSchema.examples,
      default: fieldSchema.default,
    };

    // Handle array items
    if (isArray && fieldSchema.items) {
      const itemSchema = fieldSchema.items as JSONSchemaDefinition;
      field.itemSchema = this.parseField(
        'item',
        itemSchema,
        `${jsonPath}[]`,
        true // array items are "required" in the sense they must exist if array is present
      );
    }

    // Handle nested objects
    if (fieldSchema.type === 'object' && fieldSchema.properties) {
      const nestedFields: SchemaField[] = [];
      const nestedRequired = fieldSchema.required || [];

      for (const [nestedName, nestedSchema] of Object.entries(fieldSchema.properties)) {
        const nestedField = this.parseField(
          nestedName,
          nestedSchema as JSONSchemaDefinition,
          `${jsonPath}.${nestedName}`,
          nestedRequired.includes(nestedName)
        );
        nestedFields.push(nestedField);
      }

      field.nestedSchema = nestedFields;
    }

    return field;
  }

  /**
   * Count total fields including nested ones
   */
  private countTotalFields(fields: SchemaField[]): number {
    let count = fields.length;

    for (const field of fields) {
      if (field.nestedSchema) {
        count += this.countTotalFields(field.nestedSchema);
      }
      if (field.itemSchema) {
        count += 1; // Count the item schema itself
        if (field.itemSchema.nestedSchema) {
          count += this.countTotalFields(field.itemSchema.nestedSchema);
        }
      }
    }

    return count;
  }

  /**
   * Validate that a schema is well-formed
   */
  public validateSchema(schema: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if it's an object
    if (typeof schema !== 'object' || schema === null) {
      errors.push('Schema must be an object');
      return { isValid: false, errors, warnings };
    }

    const schemaObj = schema as JSONSchemaDefinition;

    // Check $schema version
    if (schemaObj.$schema && !schemaObj.$schema.includes('draft-07') && !schemaObj.$schema.includes('draft-06')) {
      warnings.push(`Schema version ${schemaObj.$schema} may not be fully supported (draft-07 recommended)`);
    }

    // Check type validity
    if (schemaObj.type && typeof schemaObj.type === 'string') {
      const validTypes = ['string', 'number', 'integer', 'boolean', 'array', 'object', 'null'];
      if (!validTypes.includes(schemaObj.type)) {
        errors.push(`Invalid type: ${schemaObj.type}`);
      }
    }

    // If type is object, properties should exist or additionalProperties be defined
    if (schemaObj.type === 'object') {
      if (!schemaObj.properties && schemaObj.additionalProperties === false) {
        warnings.push('Object schema has no properties and additionalProperties is false');
      }
    }

    // If type is array, items should be defined
    if (schemaObj.type === 'array' && !schemaObj.items) {
      warnings.push('Array schema does not define items');
    }

    // Check pattern is valid regex
    if (schemaObj.pattern) {
      try {
        new RegExp(schemaObj.pattern);
      } catch (e) {
        errors.push(`Invalid regex pattern: ${schemaObj.pattern}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate documentation from schema
   */
  public generateDocumentation(schema: JSONSchemaDefinition): string {
    const lines: string[] = [];

    lines.push(`# ${schema.title || 'Schema'}`);
    lines.push('');

    if (schema.description) {
      lines.push(schema.description);
      lines.push('');
    }

    if (schema.properties) {
      lines.push('## Fields');
      lines.push('');

      const required = schema.required || [];
      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
        const isRequired = required.includes(fieldName);
        const schemaObj = fieldSchema as JSONSchemaDefinition;
        const type = schemaObj.type || 'unknown';
        const requiredMarker = isRequired ? '**[Required]**' : '';

        lines.push(`### ${fieldName} ${requiredMarker}`);
        lines.push(`- **Type**: ${type}`);

        if (schemaObj.description) {
          lines.push(`- **Description**: ${schemaObj.description}`);
        }

        if (schemaObj.pattern) {
          lines.push(`- **Pattern**: \`${schemaObj.pattern}\``);
        }

        if (schemaObj.enum) {
          lines.push(`- **Allowed values**: ${schemaObj.enum.join(', ')}`);
        }

        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Get fields flattened (all nested fields at one level)
   */
  public flattenFields(fields: SchemaField[]): SchemaField[] {
    const flattened: SchemaField[] = [];

    for (const field of fields) {
      flattened.push(field);

      if (field.nestedSchema) {
        flattened.push(...this.flattenFields(field.nestedSchema));
      }

      if (field.itemSchema) {
        flattened.push(field.itemSchema);
        if (field.itemSchema.nestedSchema) {
          flattened.push(...this.flattenFields(field.itemSchema.nestedSchema));
        }
      }
    }

    return flattened;
  }

  /**
   * Generate a unique schema ID
   */
  private generateSchemaId(): string {
    return `sch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
