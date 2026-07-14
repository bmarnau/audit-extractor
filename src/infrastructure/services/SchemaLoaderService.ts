import { readFile } from 'fs/promises';
import { join } from 'path';
import { injectable } from 'tsyringe';
import Ajv, { JSONSchemaType } from 'ajv';
import {
  SchemaDefinition,
  SchemaDefinitionFactory,
  SchemaField,
} from '@domain/schema/SchemaDefinition';
import {
  JobValidationError,
  JobNotFoundError,
  JobPersistenceError,
} from '@domain/job/JobErrors';

/**
 * Service to load, validate, and analyze JSON Schemas (Draft-07)
 * Extracts metadata and field information from schema definitions
 */
@injectable()
export class SchemaLoaderService {
  private ajv: Ajv;

  constructor() {
    // Initialize AJV for Draft-07 validation
    this.ajv = new Ajv({
      strict: true,
      validateSchema: true,
    });
  }

  /**
   * Load and validate a JSON schema file
   * @param schemasBasePath Base path to schemas directory
   * @param schemaName Schema name (e.g., "invoice-v2.0.0")
   * @returns SchemaDefinition with extracted metadata and fields
   * @throws JobNotFoundError if file doesn't exist
   * @throws JobValidationError if schema validation fails
   * @throws JobPersistenceError if file read fails
   */
  async loadSchema(
    schemasBasePath: string,
    schemaName: string
  ): Promise<SchemaDefinition> {
    const schemaFilePath = join(schemasBasePath, `${schemaName}.json`);
    let fileContent: string;

    // Load file
    try {
      fileContent = await readFile(schemaFilePath, 'utf-8');
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new JobNotFoundError(schemaName);
        }
      }
      const err = error instanceof Error ? error : new Error(String(error));
      throw new JobPersistenceError('load schema file', schemaName, err);
    }

    // Parse JSON
    let rawSchema: unknown;
    try {
      rawSchema = JSON.parse(fileContent);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new JobPersistenceError('parse schema JSON', schemaName, err);
    }

    // Validate and extract schema metadata
    const schemaDefinition = await this.validateAndExtractSchema(
      rawSchema,
      schemaName
    );

    return schemaDefinition;
  }

  /**
   * Load multiple schemas
   * @param schemasBasePath Base path to schemas directory
   * @param schemaNames Array of schema names
   * @returns Array of SchemaDefinitions
   */
  async loadSchemas(
    schemasBasePath: string,
    schemaNames: string[]
  ): Promise<SchemaDefinition[]> {
    const loadedSchemas: SchemaDefinition[] = [];
    const failedLoads: Array<{ name: string; error: Error }> = [];

    for (const schemaName of schemaNames) {
      try {
        const schema = await this.loadSchema(schemasBasePath, schemaName);
        loadedSchemas.push(schema);
      } catch (error) {
        failedLoads.push({
          name: schemaName,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }

    // If all loads failed, throw error
    if (loadedSchemas.length === 0 && failedLoads.length > 0) {
      const firstError = failedLoads[0].error;
      throw new JobPersistenceError(
        'load multiple schemas',
        failedLoads[0].name,
        firstError
      );
    }

    return loadedSchemas;
  }

  /**
   * Validate schema against JSON Schema Draft-07 and extract metadata
   * @param rawSchema Parsed schema object
   * @param schemaName Name for error reporting
   * @returns Validated SchemaDefinition
   * @throws JobValidationError if schema is invalid
   */
  private async validateAndExtractSchema(
    rawSchema: unknown,
    schemaName: string
  ): Promise<SchemaDefinition> {
    // Type check
    if (!rawSchema || typeof rawSchema !== 'object' || Array.isArray(rawSchema)) {
      throw new JobValidationError(
        `Schema must be a valid JSON object, received ${typeof rawSchema}`,
        { schema: ['Invalid schema type'] }
      );
    }

    const schema = rawSchema as Record<string, unknown>;
    const errors: Record<string, string[]> = {};

    // Check for $schema field (recommended for Draft-07)
    if (schema.$schema && typeof schema.$schema === 'string') {
      if (!schema.$schema.includes('draft-07') && !schema.$schema.includes('draft/7')) {
        errors.$schema = ['Must be JSON Schema Draft-07 compatible'];
      }
    }

    // Extract and validate core fields
    const title = (schema.title as string) ?? schemaName;
    const description = (schema.description as string) ?? '';
    const version = this.extractVersion(schemaName);

    // Validate properties exist
    if (!schema.properties || typeof schema.properties !== 'object') {
      errors.properties = ['Schema must define properties object'];
    }

    if (errors.properties) {
      throw new JobValidationError('Schema validation failed', errors);
    }

    // Validate required fields (if present)
    let requiredFields: string[] = [];
    if (schema.required) {
      if (!Array.isArray(schema.required)) {
        errors.required = ['Required must be an array'];
      } else {
        requiredFields = schema.required as string[];
      }
    }

    if (errors.required) {
      throw new JobValidationError('Schema validation failed', errors);
    }

    // Try to compile schema with AJV
    try {
      this.ajv.compile(schema as unknown as JSONSchemaType<unknown>);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new JobValidationError('Schema compilation failed', {
        schema: [err.message],
      });
    }

    // Extract fields
    const fields = this.extractFields(schema);

    // Create SchemaDefinition
    const schemaDefinition = SchemaDefinitionFactory.create(
      schemaName,
      version,
      fields,
      requiredFields,
      schema as Record<string, unknown>,
      title,
      description
    );

    return schemaDefinition;
  }

  /**
   * Extract fields from schema properties
   * @param schema Schema object with properties
   * @returns Array of SchemaField definitions
   */
  private extractFields(schema: Record<string, unknown>): SchemaField[] {
    const fields: SchemaField[] = [];
    const properties = (schema.properties ??
      {}) as Record<string, unknown>;
    const required = (schema.required ?? []) as string[];

    for (const [name, prop] of Object.entries(properties)) {
      const propObj = prop as Record<string, unknown>;
      const field: SchemaField = {
        name,
        type: this.extractType(propObj),
        description: (propObj.description as string) ?? undefined,
        enum: this.extractEnum(propObj),
        pattern: (propObj.pattern as string) ?? undefined,
        minLength: (propObj.minLength as number) ?? undefined,
        maxLength: (propObj.maxLength as number) ?? undefined,
        minimum: (propObj.minimum as number) ?? undefined,
        maximum: (propObj.maximum as number) ?? undefined,
        format: (propObj.format as string) ?? undefined,
        required: required.includes(name),
        items: this.extractItems(propObj),
        properties: this.extractNestedProperties(propObj),
      };
      fields.push(field);
    }

    return fields;
  }

  /**
   * Extract type from property definition
   * Handles both string type and array of types
   */
  private extractType(prop: Record<string, unknown>): string {
    const type = prop.type;

    if (typeof type === 'string') {
      return type;
    }

    if (Array.isArray(type) && type.length > 0) {
      // Filter out 'null' if present
      const nonNull = type.filter((t) => t !== 'null');
      return nonNull.length > 0 ? (nonNull[0] as string) : 'unknown';
    }

    return 'unknown';
  }

  /**
   * Extract enum values from property
   */
  private extractEnum(prop: Record<string, unknown>): Array<
    string | number | boolean
  > | undefined {
    const enumValues = prop.enum;
    if (Array.isArray(enumValues)) {
      return enumValues as Array<string | number | boolean>;
    }
    return undefined;
  }

  /**
   * Extract items definition for array types
   */
  private extractItems(prop: Record<string, unknown>): SchemaField | undefined {
    const items = prop.items;
    if (!items || typeof items !== 'object' || Array.isArray(items)) {
      return undefined;
    }

    const itemsObj = items as Record<string, unknown>;
    return {
      name: 'item',
      type: this.extractType(itemsObj),
      description: (itemsObj.description as string) ?? undefined,
    };
  }

  /**
   * Extract nested properties for object types
   */
  private extractNestedProperties(
    prop: Record<string, unknown>
  ): Record<string, SchemaField> | undefined {
    const properties = prop.properties;
    if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
      return undefined;
    }

    const result: Record<string, SchemaField> = {};
    const propsObj = properties as Record<string, unknown>;

    for (const [key, nested] of Object.entries(propsObj)) {
      const nestedObj = nested as Record<string, unknown>;
      result[key] = {
        name: key,
        type: this.extractType(nestedObj),
        description: (nestedObj.description as string) ?? undefined,
      };
    }

    return result;
  }

  /**
   * Extract version from schema name
   * Handles formats like "invoice-v2.0.0", "delivery-note-v1.5.0"
   */
  private extractVersion(schemaName: string): string {
    const versionMatch = schemaName.match(/v(\d+\.\d+\.\d+)/);
    if (versionMatch && versionMatch[1]) {
      return versionMatch[1];
    }

    // Fallback: try alternative format (e.g., "-2.0.0" or just before .json)
    const altMatch = schemaName.match(/(\d+\.\d+\.\d+)/);
    if (altMatch && altMatch[1]) {
      return altMatch[1];
    }

    return '1.0.0';
  }
}
