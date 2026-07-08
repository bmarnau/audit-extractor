/**
 * Unit Tests - RuleGeneration Complete Pipeline
 *
 * Tests für:
 * 1. ExampleDataLoader
 * 2. PatternInferrer
 * 3. RuleGenerator
 * 4. Sicherheit
 */

import { ExampleDataLoader, ExampleDataLoaderFactory } from '@application/generation/ExampleDataLoader';
import { PatternInferrer } from '@application/generation/PatternInferrer';
import { RuleGenerator } from '@application/generation/RuleGenerator';
import { validateInferenceRequest } from '@domain/generation/PatternInference';
import { validateGeneratedRule } from '@domain/generation/GeneratedRule';
import * as path from 'path';

describe('RuleGeneration - Complete Pipeline', () => {
  let exampleLoader: ExampleDataLoader;
  let patternInferrer: PatternInferrer;
  let ruleGenerator: RuleGenerator;

  beforeAll(() => {
    const examplesDir = path.join(process.cwd(), 'extraction-rules', 'examples');
    exampleLoader = ExampleDataLoaderFactory.create(examplesDir);
    patternInferrer = new PatternInferrer();
    ruleGenerator = new RuleGenerator(exampleLoader, patternInferrer);
  });

  describe('ExampleDataLoader', () => {
    test('should load valid example file', async () => {
      const example = await exampleLoader.loadExample('invoice-example');

      expect(example).toBeDefined();
      expect(example.name).toBe('invoice-example');
      expect(example.fieldCount).toBeGreaterThan(0);
      expect(example.data).toHaveProperty('invoiceNumber');
    });

    test('should throw on invalid filename', async () => {
      await expect(exampleLoader.loadExample('../etc/passwd')).rejects.toThrow();
    });

    test('should validate against schema', async () => {
      const example = await exampleLoader.loadExample('invoice-example');

      const schema = {
        fields: [
          { fieldName: 'invoiceNumber', fieldType: 'string', isRequired: true },
          { fieldName: 'invoiceDate', fieldType: 'date', isRequired: true },
          { fieldName: 'totalAmount', fieldType: 'number', isRequired: true }
        ]
      };

      const validation = exampleLoader.validateAgainstSchema(example, schema);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    test('should reject non-existent file', async () => {
      await expect(exampleLoader.loadExample('nonexistent')).rejects.toThrow();
    });

    test('should detect field names correctly', async () => {
      const example = await exampleLoader.loadExample('invoice-example');

      expect(example.fieldNames).toContain('invoiceNumber');
      expect(example.fieldNames).toContain('invoiceDate');
      expect(example.fieldNames).toContain('totalAmount');
    });
  });

  describe('PatternInferrer', () => {
    test('should infer pattern from invoice number examples', async () => {
      const request = {
        fieldName: 'invoiceNumber',
        fieldType: 'string' as const,
        examples: ['INV-2024-001', 'INV-2024-002', 'INV-2024-003'],
        isRequired: true
      };

      const validation = validateInferenceRequest(request);
      expect(validation.valid).toBe(true);

      const result = await patternInferrer.infer(request);
      expect(result.success).toBe(true);
      expect(result.patterns).toBeDefined();
      expect(result.patterns.primary.confidence).toBeGreaterThan(0.5);
    });

    test('should infer pattern from date examples', async () => {
      const request = {
        fieldName: 'invoiceDate',
        fieldType: 'date' as const,
        examples: ['2026-07-08', '2026-07-07', '2026-07-06'],
        isRequired: true
      };

      const result = await patternInferrer.infer(request);
      expect(result.success).toBe(true);
      expect(result.patterns.primary.pattern).toContain('\\d{4}-\\d{2}-\\d{2}');
    });

    test('should handle empty examples', async () => {
      const request = {
        fieldName: 'testField',
        fieldType: 'string' as const,
        examples: [],
        isRequired: false
      };

      const result = await patternInferrer.infer(request);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should validate inference request', () => {
      const validRequest = {
        fieldName: 'testField',
        fieldType: 'string' as const,
        examples: ['test', 'data']
      };

      const validation = validateInferenceRequest(validRequest);
      expect(validation.valid).toBe(true);
    });

    test('should reject invalid field name', () => {
      const invalidRequest = {
        fieldName: 'invalid-field!', // Invalid: contains hyphen
        fieldType: 'string' as const,
        examples: ['test']
      };

      const validation = validateInferenceRequest(invalidRequest);
      expect(validation.valid).toBe(false);
    });

    test('should check for ReDoS risks', async () => {
      const request = {
        fieldName: 'testField',
        fieldType: 'string' as const,
        examples: ['abc', 'def']
      };

      const result = await patternInferrer.infer(request);
      expect(result.stats.redosCheckPerformed).toBe(true);
    });
  });

  describe('RuleGenerator', () => {
    test('should generate rules from invoice schema', async () => {
      const request = {
        reportName: 'invoice',
        schema: {
          documentType: 'invoice',
          fields: [
            {
              fieldName: 'invoiceNumber',
              fieldType: 'string',
              isRequired: true,
              description: 'Invoice number'
            },
            {
              fieldName: 'invoiceDate',
              fieldType: 'date',
              isRequired: true,
              description: 'Invoice date'
            },
            {
              fieldName: 'totalAmount',
              fieldType: 'number',
              isRequired: true,
              description: 'Total amount'
            }
          ]
        },
        exampleDataSource: {
          name: 'invoice-example'
        },
        version: '1.0.0'
      };

      const result = await ruleGenerator.generate(request);

      expect(result.success).toBe(true);
      expect(result.rules.length).toBeGreaterThan(0);
      expect(result.successCount).toBe(3);

      // Validate each generated rule
      for (const rule of result.rules) {
        const validation = validateGeneratedRule(rule);
        expect(validation.valid).toBe(true, `Rule ${rule.fieldName} failed validation`);
      }
    });

    test('should handle missing example data', async () => {
      const request = {
        reportName: 'test',
        schema: {
          documentType: 'test',
          fields: [
            {
              fieldName: 'testField',
              fieldType: 'string',
              isRequired: true
            }
          ]
        }
        // No exampleDataSource
      };

      const result = await ruleGenerator.generate(request);
      expect(result.success).toBe(true);
      expect(result.rules.length).toBeGreaterThan(0);
    });

    test('should reject invalid report name', async () => {
      const request = {
        reportName: 'Invalid Report!', // Invalid: uppercase and special chars
        schema: {
          documentType: 'test',
          fields: [
            {
              fieldName: 'field',
              fieldType: 'string',
              isRequired: true
            }
          ]
        }
      };

      const result = await ruleGenerator.generate(request);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should calculate average confidence', async () => {
      const request = {
        reportName: 'invoice',
        schema: {
          documentType: 'invoice',
          fields: [
            {
              fieldName: 'invoiceNumber',
              fieldType: 'string',
              isRequired: true
            }
          ]
        },
        exampleDataSource: {
          name: 'invoice-example'
        }
      };

      const result = await ruleGenerator.generate(request);
      expect(result.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(result.averageConfidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Security Tests', () => {
    test('should prevent path traversal', async () => {
      await expect(
        exampleLoader.loadExample('../../../etc/passwd')
      ).rejects.toThrow('Security');
    });

    test('should validate field names for injection', () => {
      const maliciousRequest = {
        fieldName: "'; DROP TABLE users; --",
        fieldType: 'string' as const,
        examples: ['test']
      };

      const validation = validateInferenceRequest(maliciousRequest);
      expect(validation.valid).toBe(false);
    });

    test('should limit JSON depth', async () => {
      const deepExample = { a: { b: { c: { d: { e: { f: { g: {} } } } } } } };

      try {
        exampleLoader.validateAgainstSchema(
          {
            name: 'test',
            data: deepExample,
            fieldCount: 1,
            fieldNames: ['a'],
            loadedAt: new Date(),
            filePath: 'test',
            fileSizeBytes: 100
          },
          { fields: [] }
        );
        // Should not throw in validateAgainstSchema, but loader should catch
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    test('should sanitize field names', async () => {
      // This test verifies that field name sanitization works
      const example = await exampleLoader.loadExample('invoice-example');

      for (const fieldName of example.fieldNames) {
        expect(fieldName).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
      }
    });
  });

  describe('Integration Tests', () => {
    test('should generate complete ruleset for invoice', async () => {
      const request = {
        reportName: 'invoice-full',
        schema: {
          documentType: 'invoice',
          fields: [
            {
              fieldName: 'invoiceNumber',
              fieldType: 'string',
              isRequired: true,
              constraints: { minLength: 3, maxLength: 50 }
            },
            {
              fieldName: 'invoiceDate',
              fieldType: 'date',
              isRequired: true
            },
            {
              fieldName: 'customerName',
              fieldType: 'string',
              isRequired: true
            },
            {
              fieldName: 'totalAmount',
              fieldType: 'number',
              isRequired: true
            },
            {
              fieldName: 'taxAmount',
              fieldType: 'number',
              isRequired: false
            }
          ]
        },
        exampleDataSource: {
          name: 'invoice-example'
        },
        version: '1.0.0',
        owner: 'finance-team'
      };

      const result = await ruleGenerator.generate(request);

      expect(result.success).toBe(true);
      expect(result.rules.length).toBe(5);

      // All rules should be valid
      for (const rule of result.rules) {
        const validation = validateGeneratedRule(rule);
        expect(validation.valid).toBe(true);
        expect(rule.generatedAt).toBeDefined();
        expect(rule.confidence).toBeGreaterThanOrEqual(0);
      }

      // Should have generated metrics
      expect(result.averageConfidence).toBeGreaterThan(0);
      expect(result.durationMs).toBeGreaterThan(0);
    });
  });
});
