/**
 * Phase 15: Schema-Driven Rule Generation
 * ExampleAnalyzer Tests
 * 
 * Version: 0.15.0
 * Phase: 15a (Backend Components)
 */

import { ExampleAnalyzer } from '../../../src/domain/schema/ExampleAnalyzer';
import { SchemaField } from '../../../src/domain/schema/SchemaTypes';

describe('ExampleAnalyzer', () => {
  let analyzer: ExampleAnalyzer;

  beforeEach(() => {
    analyzer = new ExampleAnalyzer();
  });

  describe('Field Characteristics Analysis', () => {
    it('should analyze string field from examples', () => {
      const examples = [
        { name: 'John' },
        { name: 'Jane' },
        { name: 'Bob' },
      ];

      const fields: SchemaField[] = [
        {
          fieldName: 'name',
          jsonPath: 'name',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);

      expect(result.exampleCount).toBe(3);
      expect(result.fieldCharacteristics).toHaveLength(1);

      const nameChar = result.fieldCharacteristics[0];
      expect(nameChar.fieldName).toBe('name');
      expect(nameChar.frequency).toBe(1.0);
      expect(nameChar.sampleValues).toContain('John');
      expect(nameChar.uniqueCount).toBe(3);
    });

    it('should analyze numeric field with min/max', () => {
      const examples = [
        { price: 10.5 },
        { price: 25.0 },
        { price: 99.99 },
      ];

      const fields: SchemaField[] = [
        {
          fieldName: 'price',
          jsonPath: 'price',
          dataType: 'number',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);
      const priceChar = result.fieldCharacteristics[0];

      expect(priceChar.minValue).toBe(10.5);
      expect(priceChar.maxValue).toBe(99.99);
    });

    it('should detect nullable fields', () => {
      const examples = [
        { optional: 'value' },
        { optional: null },
        { optional: undefined },
        {},
      ];

      const fields: SchemaField[] = [
        {
          fieldName: 'optional',
          jsonPath: 'optional',
          dataType: 'string',
          isRequired: false,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);
      const optionalChar = result.fieldCharacteristics[0];

      expect(optionalChar.isNullable).toBe(true);
      expect(optionalChar.frequency).toBeLessThan(1.0);
    });

    it('should detect array fields', () => {
      const examples = [
        { tags: ['a', 'b'] },
        { tags: ['x', 'y', 'z'] },
        { tags: [] },
      ];

      const fields: SchemaField[] = [
        {
          fieldName: 'tags',
          jsonPath: 'tags',
          dataType: 'array',
          isRequired: true,
          isArray: true,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);
      const tagsChar = result.fieldCharacteristics[0];

      expect(tagsChar.isArray).toBe(true);
    });

    it('should detect enum values', () => {
      const examples = [
        { status: 'active' },
        { status: 'inactive' },
        { status: 'pending' },
      ];

      const fields: SchemaField[] = [
        {
          fieldName: 'status',
          jsonPath: 'status',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);
      const statusChar = result.fieldCharacteristics[0];

      expect(statusChar.enum).toEqual(['active', 'inactive', 'pending']);
    });
  });

  describe('Pattern Generation', () => {
    it('should recognize email patterns', () => {
      const examples = [
        { email: 'john@example.com' },
        { email: 'jane@test.org' },
        { email: 'bob@domain.net' },
      ];

      const fields: SchemaField[] = [
        {
          fieldName: 'email',
          jsonPath: 'email',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);
      const emailChar = result.fieldCharacteristics[0];

      expect(emailChar.pattern).toBeDefined();
      expect(emailChar.patternConfidence).toBeGreaterThan(0.8);
    });

    it('should recognize date patterns', () => {
      const examples = [
        { date: '2025-01-01' },
        { date: '2025-01-15' },
        { date: '2025-12-31' },
      ];

      const fields: SchemaField[] = [
        {
          fieldName: 'date',
          jsonPath: 'date',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);
      const dateChar = result.fieldCharacteristics[0];

      expect(dateChar.pattern).toBeDefined();
      expect(dateChar.patternConfidence).toBeGreaterThan(0.8);
    });

    it('should recognize phone patterns', () => {
      const examples = [
        { phone: '+1234567890' },
        { phone: '+9876543210' },
        { phone: '+1111111111' },
      ];

      const fields: SchemaField[] = [
        {
          fieldName: 'phone',
          jsonPath: 'phone',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);
      const phoneChar = result.fieldCharacteristics[0];

      expect(phoneChar.pattern).toBeDefined();
      expect(phoneChar.patternConfidence).toBeGreaterThan(0.7);
    });

    it('should recognize currency patterns', () => {
      const examples = [
        { amount: '$99.99' },
        { amount: '$123.45' },
        { amount: '$1.00' },
      ];

      const fields: SchemaField[] = [
        {
          fieldName: 'amount',
          jsonPath: 'amount',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);
      const amountChar = result.fieldCharacteristics[0];

      expect(amountChar.pattern).toBeDefined();
      expect(amountChar.patternConfidence).toBeGreaterThan(0.7);
    });
  });

  describe('Data Quality Assessment', () => {
    it('should mark data as reliable with sufficient examples', () => {
      const examples = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
        { name: 'Bob', age: 35 },
      ];

      const fields: SchemaField[] = [
        {
          fieldName: 'name',
          jsonPath: 'name',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
        {
          fieldName: 'age',
          jsonPath: 'age',
          dataType: 'integer',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);

      expect(result.dataQuality.isReliable).toBe(true);
      expect(result.dataQuality.completenessPercentage).toBeGreaterThanOrEqual(60);
    });

    it('should warn on insufficient examples', () => {
      const examples = [{ name: 'John' }];

      const fields: SchemaField[] = [
        {
          fieldName: 'name',
          jsonPath: 'name',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.dataQuality.isReliable).toBe(false);
    });

    it('should warn on low completeness', () => {
      const examples = [
        { name: 'John', age: 30 },
        {},
        {},
      ];

      const fields: SchemaField[] = [
        {
          fieldName: 'name',
          jsonPath: 'name',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
        {
          fieldName: 'age',
          jsonPath: 'age',
          dataType: 'integer',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);

      expect(result.dataQuality.completenessPercentage).toBeLessThan(100);
    });
  });

  describe('Search Strategy Generation', () => {
    it('should generate strategies for field characteristics', () => {
      const examples = [
        { status: 'active' },
        { status: 'inactive' },
        { status: 'pending' },
      ];

      const fields: SchemaField[] = [
        {
          fieldName: 'status',
          jsonPath: 'status',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);
      const strategies = analyzer.generateSearchStrategies(result.fieldCharacteristics);

      expect(strategies).toHaveLength(1);
      expect(strategies[0].fieldName).toBe('status');
      expect(strategies[0].strategies.length).toBeGreaterThan(0);
    });

    it('should order strategies by confidence', () => {
      const examples = [
        { email: 'john@example.com' },
        { email: 'jane@test.org' },
        { email: 'bob@domain.net' },
      ];

      const fields: SchemaField[] = [
        {
          fieldName: 'email',
          jsonPath: 'email',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);
      const strategies = analyzer.generateSearchStrategies(result.fieldCharacteristics);
      const emailStrategies = strategies[0].strategies;

      // Should be ordered by confidence (descending)
      for (let i = 1; i < emailStrategies.length; i++) {
        expect(emailStrategies[i - 1].confidence).toBeGreaterThanOrEqual(emailStrategies[i].confidence);
      }
    });
  });

  describe('Nested Field Analysis', () => {
    it('should analyze nested object fields', () => {
      const examples = [
        { user: { name: 'John', age: 30 } },
        { user: { name: 'Jane', age: 25 } },
      ];

      const fields: SchemaField[] = [
        {
          fieldName: 'user',
          jsonPath: 'user',
          dataType: 'object',
          isRequired: true,
          isArray: false,
          nestedSchema: [
            {
              fieldName: 'name',
              jsonPath: 'user.name',
              dataType: 'string',
              isRequired: true,
              isArray: false,
            } as SchemaField,
          ],
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);

      expect(result.fieldCharacteristics).toHaveLength(1);
    });
  });

  describe('Empty/Missing Examples', () => {
    it('should handle empty examples array', () => {
      const examples: any[] = [];
      const fields: SchemaField[] = [
        {
          fieldName: 'name',
          jsonPath: 'name',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);

      expect(result.exampleCount).toBe(0);
      expect(result.dataQuality.isReliable).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle missing examples', () => {
      const fields: SchemaField[] = [
        {
          fieldName: 'name',
          jsonPath: 'name',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(null as any, fields);

      expect(result.dataQuality.isReliable).toBe(false);
    });
  });

  describe('Mixed Type Detection', () => {
    it('should detect when field has mixed types', () => {
      const examples = [
        { value: 'string' },
        { value: 123 },
        { value: true },
      ];

      const fields: SchemaField[] = [
        {
          fieldName: 'value',
          jsonPath: 'value',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);
      const valueChar = result.fieldCharacteristics[0];

      expect(valueChar.observedTypes.size).toBeGreaterThan(1);
    });
  });

  describe('String Length Analysis', () => {
    it('should track min/max string lengths', () => {
      const examples = [
        { text: 'a' },
        { text: 'hello world' },
        { text: 'x' },
      ];

      const fields: SchemaField[] = [
        {
          fieldName: 'text',
          jsonPath: 'text',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = analyzer.analyzeExamples(examples, fields);
      const textChar = result.fieldCharacteristics[0];

      expect(textChar.minLength).toBe(1);
      expect(textChar.maxLength).toBe(11);
    });
  });
});
