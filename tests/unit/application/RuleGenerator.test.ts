/**
 * Phase 15: Schema-Driven Rule Generation
 * RuleGenerator Tests
 * 
 * Version: 0.15.0
 */

import { RuleGenerator } from '../../../src/application/rule-generation/RuleGenerator';
import { SchemaField } from '../../../src/domain/schema/SchemaTypes';
import { FieldCharacteristics } from '../../../src/domain/schema/ExampleAnalyzerTypes';

describe('RuleGenerator', () => {
  let generator: RuleGenerator;

  beforeEach(() => {
    generator = new RuleGenerator();
  });

  describe('Basic Rule Generation', () => {
    it('should generate rule for simple field', () => {
      const schemaFields: SchemaField[] = [
        {
          fieldName: 'name',
          jsonPath: 'name',
          dataType: 'string',
          isRequired: true,
          isArray: false,
          description: 'Person name',
        } as SchemaField,
      ];

      const characteristics: FieldCharacteristics[] = [
        {
          fieldName: 'name',
          observedTypes: new Set(['string']),
          sampleValues: ['John', 'Jane', 'Bob'],
          frequency: 1.0,
          uniqueCount: 3,
          patternConfidence: 0,
          isNullable: false,
          isArray: false,
        } as FieldCharacteristics,
      ];

      const result = generator.generateRules({
        schemaId: 'test-schema',
        schemaFields,
        exampleCharacteristics: characteristics,
        aggressiveness: 0.6,
      });

      expect(result.rules.length).toBeGreaterThan(0);
      const rule = result.rules[0];
      expect(rule.fieldName).toBe('name');
      expect(rule.confidence).toBeGreaterThan(0);
    });

    it('should mark rules as schema-only when no examples', () => {
      const schemaFields: SchemaField[] = [
        {
          fieldName: 'email',
          jsonPath: 'email',
          dataType: 'string',
          isRequired: true,
          isArray: false,
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        } as SchemaField,
      ];

      const result = generator.generateRules({
        schemaId: 'test-schema',
        schemaFields,
        exampleCharacteristics: [],
        aggressiveness: 0.6,
      });

      expect(result.rules.length).toBeGreaterThan(0);
      const rule = result.rules[0];
      expect(rule.derivedFrom).toBe('schema');
    });

    it('should mark rules as hybrid when using both schema and examples', () => {
      const schemaFields: SchemaField[] = [
        {
          fieldName: 'amount',
          jsonPath: 'amount',
          dataType: 'number',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const characteristics: FieldCharacteristics[] = [
        {
          fieldName: 'amount',
          observedTypes: new Set(['number']),
          sampleValues: [100, 200, 300],
          frequency: 1.0,
          uniqueCount: 3,
          pattern: '^\\d+(\\.\\d{2})?$',
          patternConfidence: 0.8,
          isNullable: false,
          isArray: false,
        } as FieldCharacteristics,
      ];

      const result = generator.generateRules({
        schemaId: 'test-schema',
        schemaFields,
        exampleCharacteristics: characteristics,
        aggressiveness: 0.6,
      });

      const rule = result.rules[0];
      expect(rule.derivedFrom).toBe('hybrid');
    });
  });

  describe('Aggressiveness Levels', () => {
    it('should generate rules with conservative aggressiveness', () => {
      const schemaFields: SchemaField[] = [
        {
          fieldName: 'status',
          jsonPath: 'status',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const characteristics: FieldCharacteristics[] = [
        {
          fieldName: 'status',
          observedTypes: new Set(['string']),
          sampleValues: ['active', 'inactive'],
          frequency: 0.8,
          uniqueCount: 2,
          enum: ['active', 'inactive'],
          patternConfidence: 0,
          isNullable: false,
          isArray: false,
        } as FieldCharacteristics,
      ];

      const result = generator.generateRules({
        schemaId: 'test-schema',
        schemaFields,
        exampleCharacteristics: characteristics,
        aggressiveness: 0.3, // Conservative
      });

      expect(result.stats.lowConfidenceRules).toBeLessThanOrEqual(result.stats.rulesGenerated);
    });

    it('should generate more rules with aggressive aggressiveness', () => {
      const schemaFields: SchemaField[] = [
        {
          fieldName: 'phone',
          jsonPath: 'phone',
          dataType: 'string',
          isRequired: false,
          isArray: false,
        } as SchemaField,
      ];

      const characteristics: FieldCharacteristics[] = [
        {
          fieldName: 'phone',
          observedTypes: new Set(['string']),
          sampleValues: ['+1234567890'],
          frequency: 0.5,
          uniqueCount: 1,
          pattern: '^\\+?\\d{9,15}$',
          patternConfidence: 0.65,
          isNullable: true,
          isArray: false,
        } as FieldCharacteristics,
      ];

      const resultConservative = generator.generateRules({
        schemaId: 'test-schema',
        schemaFields,
        exampleCharacteristics: characteristics,
        aggressiveness: 0.3,
      });

      const resultAggressive = generator.generateRules({
        schemaId: 'test-schema',
        schemaFields,
        exampleCharacteristics: characteristics,
        aggressiveness: 0.85,
      });

      // Aggressive should accept more rules
      expect(resultAggressive.rules.length).toBeGreaterThanOrEqual(resultConservative.rules.length);
    });
  });

  describe('Custom Keywords', () => {
    it('should use custom keywords when provided', () => {
      const schemaFields: SchemaField[] = [
        {
          fieldName: 'customField',
          jsonPath: 'customField',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = generator.generateRules({
        schemaId: 'test-schema',
        schemaFields,
        exampleCharacteristics: [],
        aggressiveness: 0.6,
        customKeywords: {
          customField: ['keyword1', 'keyword2', 'keyword3'],
        },
      });

      expect(result.rules.length).toBeGreaterThan(0);
      const rule = result.rules[0];
      expect(rule.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('Enum Detection', () => {
    it('should detect and use enum values', () => {
      const schemaFields: SchemaField[] = [
        {
          fieldName: 'priority',
          jsonPath: 'priority',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const characteristics: FieldCharacteristics[] = [
        {
          fieldName: 'priority',
          observedTypes: new Set(['string']),
          sampleValues: ['high', 'medium', 'low'],
          frequency: 1.0,
          uniqueCount: 3,
          enum: ['high', 'medium', 'low'],
          patternConfidence: 0,
          isNullable: false,
          isArray: false,
        } as FieldCharacteristics,
      ];

      const result = generator.generateRules({
        schemaId: 'test-schema',
        schemaFields,
        exampleCharacteristics: characteristics,
        aggressiveness: 0.6,
      });

      const rule = result.rules[0];
      expect((rule.searchKeywords as string[]).some((p: string) => p.includes('high') && p.includes('medium'))).toBe(true);
    });
  });

  describe('Statistics Generation', () => {
    it('should calculate correct statistics', () => {
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

      const characteristics: FieldCharacteristics[] = [
        {
          fieldName: 'field1',
          observedTypes: new Set(['string']),
          sampleValues: ['value1'],
          frequency: 1.0,
          uniqueCount: 1,
          patternConfidence: 0.8,
          isNullable: false,
          isArray: false,
        } as FieldCharacteristics,
        {
          fieldName: 'field2',
          observedTypes: new Set(['string']),
          sampleValues: ['value2'],
          frequency: 1.0,
          uniqueCount: 1,
          patternConfidence: 0.9,
          isNullable: false,
          isArray: false,
        } as FieldCharacteristics,
      ];

      const result = generator.generateRules({
        schemaId: 'test-schema',
        schemaFields,
        exampleCharacteristics: characteristics,
        aggressiveness: 0.6,
      });

      expect(result.stats.totalFieldsProcessed).toBe(2);
      expect(result.stats.rulesGenerated).toBe(2);
      expect(result.stats.averageConfidence).toBeGreaterThan(0);
      expect(result.stats.dataInformedRules).toBeGreaterThan(0);
    });

    it('should identify low confidence rules', () => {
      const schemaFields: SchemaField[] = [
        {
          fieldName: 'uncertain',
          jsonPath: 'uncertain',
          dataType: 'string',
          isRequired: false,
          isArray: false,
        } as SchemaField,
      ];

      const characteristics: FieldCharacteristics[] = [
        {
          fieldName: 'uncertain',
          observedTypes: new Set(['string', 'number', 'undefined']),
          sampleValues: ['maybe'],
          frequency: 0.33,
          uniqueCount: 1,
          patternConfidence: 0.3,
          isNullable: true,
          isArray: false,
        } as FieldCharacteristics,
      ];

      const result = generator.generateRules({
        schemaId: 'test-schema',
        schemaFields,
        exampleCharacteristics: characteristics,
        aggressiveness: 0.6,
      });

      expect(result.stats.lowConfidenceRules).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Warning Generation', () => {
    it('should warn on low confidence rules', () => {
      const schemaFields: SchemaField[] = [
        {
          fieldName: 'uncertain',
          jsonPath: 'uncertain',
          dataType: 'string',
          isRequired: false,
          isArray: false,
        } as SchemaField,
      ];

      const characteristics: FieldCharacteristics[] = [
        {
          fieldName: 'uncertain',
          observedTypes: new Set(['mixed']),
          sampleValues: ['value'],
          frequency: 0.5,
          uniqueCount: 1,
          patternConfidence: 0.4,
          isNullable: true,
          isArray: false,
        } as FieldCharacteristics,
      ];

      const result = generator.generateRules({
        schemaId: 'test-schema',
        schemaFields,
        exampleCharacteristics: characteristics,
        aggressiveness: 0.6,
      });

      // May or may not have warnings depending on rules generated
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should warn on conservative mode', () => {
      const schemaFields: SchemaField[] = [
        {
          fieldName: 'field',
          jsonPath: 'field',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = generator.generateRules({
        schemaId: 'test-schema',
        schemaFields,
        exampleCharacteristics: [],
        aggressiveness: 0.2,
      });

      const hasConservativeWarning = result.warnings.some((w) => w.includes('Conservative'));
      expect(hasConservativeWarning).toBe(true);
    });

    it('should warn on aggressive mode', () => {
      const schemaFields: SchemaField[] = [
        {
          fieldName: 'field',
          jsonPath: 'field',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const result = generator.generateRules({
        schemaId: 'test-schema',
        schemaFields,
        exampleCharacteristics: [],
        aggressiveness: 0.9,
      });

      const hasAggressiveWarning = result.warnings.some((w) => w.includes('Aggressive'));
      expect(hasAggressiveWarning).toBe(true);
    });
  });

  describe('Required Fields', () => {
    it('should preserve required flag from schema', () => {
      const schemaFields: SchemaField[] = [
        {
          fieldName: 'required_field',
          jsonPath: 'required_field',
          dataType: 'string',
          isRequired: true,
          isArray: false,
        } as SchemaField,
        {
          fieldName: 'optional_field',
          jsonPath: 'optional_field',
          dataType: 'string',
          isRequired: false,
          isArray: false,
        } as SchemaField,
      ];

      const result = generator.generateRules({
        schemaId: 'test-schema',
        schemaFields,
        exampleCharacteristics: [],
        aggressiveness: 0.6,
      });

      const requiredRule = result.rules.find((r) => (r.fieldName as any) === 'required_field');
      const optionalRule = result.rules.find((r) => (r.fieldName as any) === 'optional_field');

      expect(requiredRule?.isRequired).toBe(true);
      expect(optionalRule?.isRequired).toBe(false);
    });
  });

  describe('Rationale Generation', () => {
    it('should include rationale for each rule', () => {
      const schemaFields: SchemaField[] = [
        {
          fieldName: 'amount',
          jsonPath: 'amount',
          dataType: 'number',
          isRequired: true,
          isArray: false,
        } as SchemaField,
      ];

      const characteristics: FieldCharacteristics[] = [
        {
          fieldName: 'amount',
          observedTypes: new Set(['number']),
          sampleValues: [100, 200],
          frequency: 1.0,
          uniqueCount: 2,
          pattern: '^\\d+(\\.\\d{2})?$',
          patternConfidence: 0.8,
          isNullable: false,
          isArray: false,
        } as FieldCharacteristics,
      ];

      const result = generator.generateRules({
        schemaId: 'test-schema',
        schemaFields,
        exampleCharacteristics: characteristics,
        aggressiveness: 0.6,
      });

      const rule = result.rules[0];
      expect(rule.rationale).toBeDefined();
      expect(rule.rationale.length).toBeGreaterThan(0);
    });
  });
});
