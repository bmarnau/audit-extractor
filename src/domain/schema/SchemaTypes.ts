/**
 * Phase 15: Schema-Driven Rule Generation
 * Domain Models for Schema Analysis
 * 
 * Version: 0.15.0
 * Phase: 15a (Backend Components)
 */

/**
 * Represents a single field extracted from a JSON Schema
 */
export interface SchemaField {
  /** Field name as it appears in the schema */
  fieldName: string;

  /** JSON path to the field (e.g., "invoice.amount", "items[0].name") */
  jsonPath: string;

  /** Data type of the field */
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'integer' | 'null';

  /** Whether this field is required */
  isRequired: boolean;

  /** Whether this is an array type */
  isArray: boolean;

  /** For array types: the schema of individual items */
  itemSchema?: SchemaField;

  /** For object types: the schema of nested properties */
  nestedSchema?: SchemaField[];

  /** Description from schema $comment or description property */
  description?: string;

  /** Regex pattern constraint from schema */
  pattern?: string;

  /** Allowed enum values */
  enum?: unknown[];

  /** Minimum length (for strings) or value (for numbers) */
  minimum?: number;

  /** Maximum length (for strings) or value (for numbers) */
  maximum?: number;

  /** Minimum length for strings */
  minLength?: number;

  /** Maximum length for strings */
  maxLength?: number;

  /** For dates: the format (e.g., "date", "date-time", "time") */
  format?: string;

  /** Example values from schema */
  examples?: unknown[];

  /** Default value if provided in schema */
  default?: unknown;
}

/**
 * Result of schema analysis
 */
export interface SchemaAnalysisResult {
  /** Unique ID for this schema */
  schemaId: string;

  /** All extracted fields */
  fields: SchemaField[];

  /** Top-level field count */
  fieldCount: number;

  /** Total fields including nested */
  totalFieldCount: number;

  /** Required fields count */
  requiredFieldCount: number;

  /** Array fields count */
  arrayFieldCount: number;

  /** Object/nested fields count */
  objectFieldCount: number;

  /** Any analysis warnings or notes */
  warnings: string[];

  /** Schema version from $schema property */
  schemaVersion?: string;

  /** Schema title if available */
  schemaTitle?: string;

  /** When this analysis was performed */
  analyzedAt: Date;
}

/**
 * Validation result for schema integrity checks
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * JSON Schema as we understand it (simplified subset)
 * Supports draft-07 features
 */
export interface JSONSchemaDefinition {
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  $comment?: string;
  type?: string | string[];
  properties?: Record<string, JSONSchemaDefinition>;
  items?: JSONSchemaDefinition;
  required?: string[];
  enum?: unknown[];
  const?: unknown;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  format?: string;
  examples?: unknown[];
  default?: unknown;
  $ref?: string;
  allOf?: JSONSchemaDefinition[];
  anyOf?: JSONSchemaDefinition[];
  oneOf?: JSONSchemaDefinition[];
  not?: JSONSchemaDefinition;
  additionalProperties?: boolean | JSONSchemaDefinition;
  [key: string]: unknown;
}
