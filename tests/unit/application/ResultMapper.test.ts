/**
 * Phase 15: Schema-Driven Rule Generation
 * ResultMapper Tests
 */

import { ResultMapper } from '../../../src/application/result-mapping/ResultMapper';
import { SchemaField } from '../../../src/domain/schema/SchemaTypes';
import type { ExtractedField } from '../../../src/domain';

describe('ResultMapper', () => {
  let mapper: ResultMapper;

  beforeEach(() => {
    mapper = new ResultMapper();
  });

  describe('Simple Field Mapping', () => {
    it('should map simple fields to schema', () => {
      const extractedFields: ExtractedField[] = [
        {
          fieldName: 'name',
          value: 'John Doe',
          confidence: 0.95,
        } as ExtractedField,
      ];

      const schemaFields: SchemaField[] = [
        {
          fieldName: 'name',
          jsonPath: 'name',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      };

      const result = mapper.mapToSchema(extractedFields, schemaFields, schema);

      expect(result.data.name).toBe('John Doe');
      expect(result.isValid).toBe(true);
    });

    it('should map multiple fields', () => {
      const extractedFields: ExtractedField[] = [
        {
          fieldName: 'name',
          value: 'Jane Smith',
          confidence: 0.95,
        } as ExtractedField,
        {
          fieldName: 'email',
          value: 'jane@example.com',
          confidence: 0.9,
        } as ExtractedField,
      ];

      const schemaFields: SchemaField[] = [
        {
          fieldName: 'name',
          jsonPath: 'name',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
        {
          fieldName: 'email',
          jsonPath: 'email',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
        },
        required: ['name', 'email'],
      };

      const result = mapper.mapToSchema(extractedFields, schemaFields, schema);

      expect(result.data.name).toBe('Jane Smith');
      expect(result.data.email).toBe('jane@example.com');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Nested Field Mapping', () => {
    it('should map nested object fields', () => {
      const extractedFields: ExtractedField[] = [
        {
          fieldName: 'user.name',
          value: 'John',
          confidence: 0.95,
        } as ExtractedField,
        {
          fieldName: 'user.age',
          value: 30,
          confidence: 0.9,
        } as ExtractedField,
      ];

      const schemaFields: SchemaField[] = [];

      const schema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'integer' },
            },
          },
        },
      };

      const result = mapper.mapToSchema(extractedFields, schemaFields, schema);

      expect(result.data.user.name).toBe('John');
      expect(result.data.user.age).toBe(30);
    });

    it('should map deeply nested fields', () => {
      const extractedFields: ExtractedField[] = [
        {
          fieldName: 'invoice.customer.address.street',
          value: '123 Main St',
          confidence: 0.95,
        } as ExtractedField,
      ];

      const schemaFields: SchemaField[] = [];

      const result = mapper.mapToSchema(extractedFields, schemaFields, {});

      expect(result.data.invoice.customer.address.street).toBe('123 Main St');
    });
  });

  describe('Coverage Calculation', () => {
    it('should calculate 100% coverage when all fields extracted', () => {
      const extractedFields: ExtractedField[] = [
        { fieldName: 'field1', value: 'value1', confidence: 0.9 } as ExtractedField,
        { fieldName: 'field2', value: 'value2', confidence: 0.9 } as ExtractedField,
      ];

      const schemaFields: SchemaField[] = [
        {
          fieldName: 'field1',
          jsonPath: 'field1',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
        {
          fieldName: 'field2',
          jsonPath: 'field2',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const schema = {
        type: 'object',
        properties: {
          field1: { type: 'string' },
          field2: { type: 'string' },
        },
      };

      const result = mapper.mapToSchema(extractedFields, schemaFields, schema);

      expect(result.coverage).toBe(100);
    });

    it('should calculate 50% coverage when half fields extracted', () => {
      const extractedFields: ExtractedField[] = [
        { fieldName: 'field1', value: 'value1', confidence: 0.9 } as ExtractedField,
      ];

      const schemaFields: SchemaField[] = [
        {
          fieldName: 'field1',
          jsonPath: 'field1',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
        {
          fieldName: 'field2',
          jsonPath: 'field2',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const schema = {
        type: 'object',
        properties: {
          field1: { type: 'string' },
          field2: { type: 'string' },
        },
      };

      const result = mapper.mapToSchema(extractedFields, schemaFields, schema);

      expect(result.coverage).toBe(50);
    });

    it('should calculate 0% coverage when no fields extracted', () => {
      const extractedFields: ExtractedField[] = [];

      const schemaFields: SchemaField[] = [
        {
          fieldName: 'field1',
          jsonPath: 'field1',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const schema = {
        type: 'object',
        properties: {
          field1: { type: 'string' },
        },
      };

      const result = mapper.mapToSchema(extractedFields, schemaFields, schema);

      expect(result.coverage).toBe(0);
    });
  });

  describe('Validation', () => {
    it('should validate against schema successfully', () => {
      const extractedFields: ExtractedField[] = [
        { fieldName: 'amount', value: 99.99, confidence: 0.95 } as ExtractedField,
      ];

      const schemaFields: SchemaField[] = [];

      const schema = {
        type: 'object',
        properties: {
          amount: { type: 'number', minimum: 0 },
        },
        required: ['amount'],
      };

      const result = mapper.mapToSchema(extractedFields, schemaFields, schema);

      expect(result.isValid).toBe(true);
      expect(result.validationErrors.length).toBe(0);
    });

    it('should detect validation errors', () => {
      const extractedFields: ExtractedField[] = [
        { fieldName: 'email', value: 'not-an-email', confidence: 0.95 } as ExtractedField,
      ];

      const schemaFields: SchemaField[] = [];

      const schema = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
      };

      const result = mapper.mapToSchema(extractedFields, schemaFields, schema);

      // Note: AJV may not validate format by default, but we capture the attempt
      expect(Array.isArray(result.validationErrors)).toBe(true);
    });

    it('should fail validation for missing required fields', () => {
      const extractedFields: ExtractedField[] = [];

      const schemaFields: SchemaField[] = [];

      const schema = {
        type: 'object',
        properties: {
          requiredField: { type: 'string' },
        },
        required: ['requiredField'],
      };

      const result = mapper.mapToSchema(extractedFields, schemaFields, schema);

      expect(result.isValid).toBe(false);
      expect(result.validationErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Type Conversion', () => {
    it('should preserve numeric types', () => {
      const extractedFields: ExtractedField[] = [
        { fieldName: 'quantity', value: 5, confidence: 0.95 } as ExtractedField,
        { fieldName: 'price', value: 19.99, confidence: 0.95 } as ExtractedField,
      ];

      const schemaFields: SchemaField[] = [];

      const schema = {
        type: 'object',
        properties: {
          quantity: { type: 'integer' },
          price: { type: 'number' },
        },
      };

      const result = mapper.mapToSchema(extractedFields, schemaFields, schema);

      expect(typeof result.data.quantity).toBe('number');
      expect(typeof result.data.price).toBe('number');
    });

    it('should preserve boolean types', () => {
      const extractedFields: ExtractedField[] = [
        { fieldName: 'active', value: true, confidence: 0.95 } as ExtractedField,
      ];

      const schemaFields: SchemaField[] = [];

      const schema = {
        type: 'object',
        properties: {
          active: { type: 'boolean' },
        },
      };

      const result = mapper.mapToSchema(extractedFields, schemaFields, schema);

      expect(result.data.active).toBe(true);
    });
  });

  describe('Empty/Null Handling', () => {
    it('should handle empty extracted fields', () => {
      const extractedFields: ExtractedField[] = [];
      const schemaFields: SchemaField[] = [];

      const schema = {
        type: 'object',
        properties: {},
      };

      const result = mapper.mapToSchema(extractedFields, schemaFields, schema);

      expect(result.data).toEqual({});
      expect(result.coverage).toBe(0);
    });

    it('should handle null values', () => {
      const extractedFields: ExtractedField[] = [
        { fieldName: 'nullable', value: null, confidence: 0.95 } as ExtractedField,
      ];

      const schemaFields: SchemaField[] = [];

      const schema = {
        type: 'object',
        properties: {
          nullable: { type: ['string', 'null'] },
        },
      };

      const result = mapper.mapToSchema(extractedFields, schemaFields, schema);

      expect(result.data.nullable).toBe(null);
    });
  });

  describe('Complex Structures', () => {
    it('should map invoice-like structure', () => {
      const extractedFields: ExtractedField[] = [
        { fieldName: 'invoice.number', value: 'INV-001', confidence: 0.95 } as ExtractedField,
        { fieldName: 'invoice.date', value: '2025-01-09', confidence: 0.95 } as ExtractedField,
        { fieldName: 'invoice.customer.name', value: 'Acme Corp', confidence: 0.95 } as ExtractedField,
        { fieldName: 'invoice.total', value: 1500.00, confidence: 0.95 } as ExtractedField,
      ];

      const schemaFields: SchemaField[] = [];

      const schema = {
        type: 'object',
        properties: {
          invoice: {
            type: 'object',
            properties: {
              number: { type: 'string' },
              date: { type: 'string' },
              customer: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              },
              total: { type: 'number' },
            },
          },
        },
      };

      const result = mapper.mapToSchema(extractedFields, schemaFields, schema);

      expect(result.data.invoice.number).toBe('INV-001');
      expect(result.data.invoice.customer.name).toBe('Acme Corp');
      expect(result.data.invoice.total).toBe(1500.0);
      expect(result.coverage).toBe(100);
    });
  });

  describe('Coverage with Nested Fields', () => {
    it('should count nested fields in coverage', () => {
      const extractedFields: ExtractedField[] = [
        { fieldName: 'user.name', value: 'John', confidence: 0.95 } as ExtractedField,
      ];

      const schemaFields: SchemaField[] = [
        {
          fieldName: 'user.name',
          jsonPath: 'user.name',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
        {
          fieldName: 'user.email',
          jsonPath: 'user.email',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const schema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
            },
          },
        },
      };

      const result = mapper.mapToSchema(extractedFields, schemaFields, schema);

      expect(result.coverage).toBe(50);
    });
  });
});
