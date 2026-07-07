/**
 * Phase 15: Schema-Driven Rule Generation
 * SchemaAnalyzer Tests
 * 
 * Version: 0.15.0
 * Phase: 15a (Backend Components)
 * 
 * Test Coverage:
 * - Simple field parsing
 * - Nested objects
 * - Arrays with items
 * - Required vs optional fields
 * - Data type detection
 * - Schema validation
 * - Edge cases
 */

import { SchemaAnalyzer } from '../../../src/domain/schema/SchemaAnalyzer';
import { JSONSchemaDefinition, SchemaField } from '../../../src/domain/schema/SchemaTypes';

describe('SchemaAnalyzer', () => {
  let analyzer: SchemaAnalyzer;

  beforeEach(() => {
    analyzer = new SchemaAnalyzer();
  });

  describe('Simple Field Parsing', () => {
    it('should parse a simple string field', () => {
      const schema: JSONSchemaDefinition = {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Person name' },
        },
        required: ['name'],
      };

      const result = analyzer.analyzeSchema(schema, 'test-1');

      expect(result.fields).toHaveLength(1);
      expect(result.fields[0].fieldName).toBe('name');
      expect(result.fields[0].dataType).toBe('string');
      expect(result.fields[0].isRequired).toBe(true);
      expect(result.fields[0].description).toBe('Person name');
    });

    it('should parse number and integer fields', () => {
      const schema: JSONSchemaDefinition = {
        type: 'object',
        properties: {
          age: { type: 'integer' },
          price: { type: 'number' },
        },
      };

      const result = analyzer.analyzeSchema(schema);

      const ageField = result.fields.find((f: SchemaField) => f.fieldName === 'age');
      const priceField = result.fields.find((f: SchemaField) => f.fieldName === 'price');

      expect(ageField?.dataType).toBe('integer');
      expect(priceField?.dataType).toBe('number');
    });

    it('should parse boolean and date fields', () => {
      const schema: JSONSchemaDefinition = {
        type: 'object',
        properties: {
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      };

      const result = analyzer.analyzeSchema(schema);

      const boolField = result.fields.find((f: SchemaField) => f.fieldName === 'isActive');
      const dateField = result.fields.find((f: SchemaField) => f.fieldName === 'createdAt');

      expect(boolField?.dataType).toBe('boolean');
      expect(dateField?.dataType).toBe('date');
    });

    it('should extract pattern constraints', () => {
      const schema: JSONSchemaDefinition = {
        type: 'object',
        properties: {
          invoiceNumber: {
            type: 'string',
            pattern: '^INV-\\d{4}$',
          },
        },
      };

      const result = analyzer.analyzeSchema(schema);
      const field = result.fields[0];

      expect(field.pattern).toBe('^INV-\\d{4}$');
    });

    it('should extract enum values', () => {
      const schema: JSONSchemaDefinition = {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'failed'],
          },
        },
      };

      const result = analyzer.analyzeSchema(schema);
      const field = result.fields[0];

      expect(field.enum).toEqual(['pending', 'completed', 'failed']);
    });

    it('should extract min/max constraints', () => {
      const schema: JSONSchemaDefinition = {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            minimum: 0,
            maximum: 10000,
          },
          description: {
            type: 'string',
            minLength: 5,
            maxLength: 500,
          },
        },
      };

      const result = analyzer.analyzeSchema(schema);

      const amountField = result.fields.find((f: SchemaField) => f.fieldName === 'amount');
      const descField = result.fields.find((f: SchemaField) => f.fieldName === 'description');

      expect(amountField?.minimum).toBe(0);
      expect(amountField?.maximum).toBe(10000);
      expect(descField?.minLength).toBe(5);
      expect(descField?.maxLength).toBe(500);
    });
  });

  describe('Nested Objects', () => {
    it('should parse nested object properties', () => {
      const schema: JSONSchemaDefinition = {
        type: 'object',
        properties: {
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              zipCode: { type: 'string' },
            },
            required: ['street', 'city'],
          },
        },
      };

      const result = analyzer.analyzeSchema(schema);

      expect(result.fieldCount).toBe(1); // Top-level: address
      expect(result.totalFieldCount).toBe(4); // address + 3 nested
      expect(result.objectFieldCount).toBe(1);

      const addressField = result.fields[0];
      expect(addressField.dataType).toBe('object');
      expect(addressField.nestedSchema).toHaveLength(3);
      expect(addressField.nestedSchema?.[0].fieldName).toBe('street');
      expect(addressField.nestedSchema?.[0].isRequired).toBe(true);
      expect(addressField.nestedSchema?.[2].isRequired).toBe(false);
    });

    it('should generate correct jsonPath for nested fields', () => {
      const schema: JSONSchemaDefinition = {
        type: 'object',
        properties: {
          invoice: {
            type: 'object',
            properties: {
              number: { type: 'string' },
              total: { type: 'number' },
            },
          },
        },
      };

      const result = analyzer.analyzeSchema(schema);
      const nested = result.fields[0].nestedSchema;

      expect(nested?.[0].jsonPath).toBe('invoice.number');
      expect(nested?.[1].jsonPath).toBe('invoice.total');
    });

    it('should handle deeply nested objects', () => {
      const schema: JSONSchemaDefinition = {
        type: 'object',
        properties: {
          company: {
            type: 'object',
            properties: {
              address: {
                type: 'object',
                properties: {
                  country: { type: 'string' },
                },
              },
            },
          },
        },
      };

      const result = analyzer.analyzeSchema(schema);
      expect(result.totalFieldCount).toBe(3); // company, address, country
    });
  });

  describe('Array Fields', () => {
    it('should parse array of strings', () => {
      const schema: JSONSchemaDefinition = {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      };

      const result = analyzer.analyzeSchema(schema);
      const field = result.fields[0];

      expect(field.isArray).toBe(true);
      expect(field.dataType).toBe('array');
      expect(field.itemSchema?.dataType).toBe('string');
    });

    it('should parse array of objects', () => {
      const schema: JSONSchemaDefinition = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                price: { type: 'number' },
              },
              required: ['name', 'price'],
            },
          },
        },
      };

      const result = analyzer.analyzeSchema(schema);
      const itemsField = result.fields[0];

      expect(itemsField.isArray).toBe(true);
      expect(itemsField.itemSchema?.dataType).toBe('object');
      expect(itemsField.itemSchema?.nestedSchema).toHaveLength(2);
      expect(result.arrayFieldCount).toBe(1);
    });

    it('should generate correct jsonPath for array items', () => {
      const schema: JSONSchemaDefinition = {
        type: 'object',
        properties: {
          invoiceItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
              },
            },
          },
        },
      };

      const result = analyzer.analyzeSchema(schema);
      const itemSchema = result.fields[0].itemSchema;

      expect(itemSchema?.jsonPath).toBe('invoiceItems[]');
      expect(itemSchema?.nestedSchema?.[0].jsonPath).toBe('invoiceItems[].description');
    });
  });

  describe('Schema Validation', () => {
    it('should reject non-object schema', () => {
      expect(() => {
        analyzer.analyzeSchema('not an object' as any);
      }).toThrow();
    });

    it('should reject invalid type', () => {
      const schema: JSONSchemaDefinition = {
        type: 'invalid-type' as any,
      };

      const validation = analyzer.validateSchema(schema);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid type: invalid-type');
    });

    it('should warn on invalid regex pattern', () => {
      const schema: JSONSchemaDefinition = {
        type: 'object',
        pattern: '(unclosed group',  // Unclosed parenthesis at top level
        properties: {},
      };

      const validation = analyzer.validateSchema(schema);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should warn on unsupported schema version', () => {
      const schema: JSONSchemaDefinition = {
        $schema: 'http://json-schema.org/draft-03/schema#',
        type: 'object',
      };

      const validation = analyzer.validateSchema(schema);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Real-world Invoice Example', () => {
    it('should parse complete invoice schema', () => {
      const invoiceSchema: JSONSchemaDefinition = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'Invoice',
        type: 'object',
        properties: {
          invoiceNumber: {
            type: 'string',
            pattern: '^INV-\\d{4}$',
            description: 'Unique invoice identifier',
          },
          invoiceDate: {
            type: 'string',
            format: 'date',
          },
          vendor: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
          },
          amount: {
            type: 'number',
            minimum: 0,
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                price: { type: 'number', minimum: 0 },
                quantity: { type: 'integer', minimum: 1 },
              },
              required: ['name', 'price', 'quantity'],
            },
          },
        },
        required: ['invoiceNumber', 'invoiceDate', 'vendor', 'amount'],
      };

      const result = analyzer.analyzeSchema(invoiceSchema, 'invoice-v1');

      expect(result.schemaId).toBe('invoice-v1');
      expect(result.schemaTitle).toBe('Invoice');
      expect(result.fieldCount).toBe(5); // invoiceNumber, date, vendor, amount, items
      expect(result.requiredFieldCount).toBe(4);
      expect(result.arrayFieldCount).toBe(1);
      expect(result.totalFieldCount).toBeGreaterThan(5);

      const itemsField = result.fields.find((f: SchemaField) => f.fieldName === 'items');
      expect(itemsField?.itemSchema?.nestedSchema).toHaveLength(3); // name, price, qty
    });
  });

  describe('Utility Methods', () => {
    it('should flatten nested fields', () => {
      const schema: JSONSchemaDefinition = {
        type: 'object',
        properties: {
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
            },
          },
          name: { type: 'string' },
        },
      };

      const result = analyzer.analyzeSchema(schema);
      const flattened = analyzer.flattenFields(result.fields);

      expect(flattened.length).toBeGreaterThan(result.fieldCount);
      expect(flattened.some((f: SchemaField) => f.jsonPath === 'address.street')).toBe(true);
    });

    it('should generate documentation from schema', () => {
      const schema: JSONSchemaDefinition = {
        title: 'Customer',
        description: 'Customer information',
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Customer name' },
          email: { type: 'string' },
        },
        required: ['name'],
      };

      const docs = analyzer.generateDocumentation(schema);

      expect(docs).toContain('# Customer');
      expect(docs).toContain('Customer information');
      expect(docs).toContain('name');
      expect(docs).toContain('[Required]');
    });
  });
});
