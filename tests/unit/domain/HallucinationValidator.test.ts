/**
 * HallucinationValidator Unit Tests
 */

import {
  HallucinationValidator,
  PolicyViolationError,
} from '@domain/HallucinationValidator';
import { ExtractionResult, ExtractedField } from '@core/models';

describe('HallucinationValidator', () => {
  let validator: HallucinationValidator;

  beforeEach(() => {
    validator = new HallucinationValidator();
  });

  describe('validateExtractedField', () => {
    it('should pass valid field with sources and high confidence', () => {
      const field: ExtractedField = {
        value: 'Invoice-2024-001',
        confidence: 0.95,
        sources: [
          {
            chunkId: 'chunk-1',
            textSnippet: 'Invoice Number: Invoice-2024-001',
            offsetStart: 0,
            offsetEnd: 30,
            pageNumber: 1,
          },
        ],
        extractedAt: new Date(),
      };

      const violations = validator.validateExtractedField(field, 'invoiceNumber');

      expect(violations).toHaveLength(0);
    });

    it('should reject field with low confidence and no sources', () => {
      const field: ExtractedField = {
        value: 'Unknown',
        confidence: 0.3,
        sources: [],
        extractedAt: new Date(),
      };

      const violations = validator.validateExtractedField(field, 'customerName');

      expect(violations).toHaveLength(1);
      expect(violations[0].rule).toBe(1); // Hallucination rule
      expect(violations[0].message).toContain('low confidence');
    });

    it('should reject field with no sources', () => {
      const field: ExtractedField = {
        value: 'Some Value',
        confidence: 0.8,
        sources: [],
        extractedAt: new Date(),
      };

      const violations = validator.validateExtractedField(field, 'testField');

      expect(violations).toHaveLength(1);
      expect(violations[0].rule).toBe(2); // Traceability rule
    });

    it('should reject source with missing chunkId', () => {
      const field: ExtractedField = {
        value: 'Test',
        confidence: 0.9,
        sources: [
          {
            chunkId: '', // Missing!
            textSnippet: 'Test snippet',
          },
        ],
        extractedAt: new Date(),
      };

      const violations = validator.validateExtractedField(field, 'testField');

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.rule === 2)).toBe(true);
    });

    it('should reject source with missing textSnippet', () => {
      const field: ExtractedField = {
        value: 'Test',
        confidence: 0.9,
        sources: [
          {
            chunkId: 'chunk-1',
            textSnippet: '', // Missing!
          },
        ],
        extractedAt: new Date(),
      };

      const violations = validator.validateExtractedField(field, 'testField');

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.rule === 2)).toBe(true);
    });

    it('should reject invalid confidence values', () => {
      const field1: ExtractedField = {
        value: 'Test',
        confidence: 1.5, // > 1
        sources: [{ chunkId: 'c1', textSnippet: 'text' }],
        extractedAt: new Date(),
      };

      const field2: ExtractedField = {
        value: 'Test',
        confidence: -0.1, // < 0
        sources: [{ chunkId: 'c1', textSnippet: 'text' }],
        extractedAt: new Date(),
      };

      expect(validator.validateExtractedField(field1, 'test')).toHaveLength(1);
      expect(validator.validateExtractedField(field2, 'test')).toHaveLength(1);
    });
  });

  describe('validateExtractionResult', () => {
    it('should pass valid extraction result', () => {
      const result: ExtractionResult = {
        id: 'result-1',
        documentId: 'doc-1',
        ruleSetId: 'invoice-v1.0.0',
        extractedFields: new Map([
          [
            'invoiceNumber',
            {
              value: 'INV-2024-001',
              confidence: 0.98,
              sources: [
                {
                  chunkId: 'chunk-1',
                  textSnippet: 'Invoice Number: INV-2024-001',
                },
              ],
              extractedAt: new Date(),
            },
          ],
        ]),
        missingFields: [],
        warnings: [],
        extractedAt: new Date(),
        version: '1.0.0',
      };

      const report = validator.validateExtractionResult(result);

      expect(report.passed).toBe(true);
      expect(report.violations).toHaveLength(0);
    });

    it('should reject result with low-confidence fields without sources', () => {
      const result: ExtractionResult = {
        id: 'result-1',
        documentId: 'doc-1',
        ruleSetId: 'invoice-v1.0.0',
        extractedFields: new Map([
          [
            'customerName',
            {
              value: 'Unknown Customer',
              confidence: 0.3,
              sources: [],
              extractedAt: new Date(),
            },
          ],
        ]),
        missingFields: [],
        warnings: [],
        extractedAt: new Date(),
        version: '1.0.0',
      };

      const report = validator.validateExtractionResult(result);

      expect(report.passed).toBe(false);
      expect(report.violations.length).toBeGreaterThan(0);
      expect(report.violations.some((v) => v.rule === 1)).toBe(true);
    });

    it('should report missing fields', () => {
      const result: ExtractionResult = {
        id: 'result-1',
        documentId: 'doc-1',
        ruleSetId: 'invoice-v1.0.0',
        extractedFields: new Map([
          [
            'invoiceNumber',
            {
              value: 'INV-2024-001',
              confidence: 0.98,
              sources: [
                {
                  chunkId: 'chunk-1',
                  textSnippet: 'Invoice Number: INV-2024-001',
                },
              ],
              extractedAt: new Date(),
            },
          ],
        ]),
        missingFields: ['customerName', 'dueDate'],
        warnings: [],
        extractedAt: new Date(),
        version: '1.0.0',
      };

      const report = validator.validateExtractionResult(result);

      // Result may have warnings, but should pass if fields are properly sourced
      expect(report.passed).toBe(true);
    });

    it('should warn when no missing fields reported', () => {
      const result: ExtractionResult = {
        id: 'result-1',
        documentId: 'doc-1',
        ruleSetId: 'invoice-v1.0.0',
        extractedFields: new Map([
          [
            'invoiceNumber',
            {
              value: 'INV-2024-001',
              confidence: 0.98,
              sources: [
                {
                  chunkId: 'chunk-1',
                  textSnippet: 'Invoice Number: INV-2024-001',
                },
              ],
              extractedAt: new Date(),
            },
          ],
        ]),
        missingFields: [], // Empty!
        warnings: [],
        extractedAt: new Date(),
        version: '1.0.0',
      };

      const report = validator.validateExtractionResult(result);

      expect(report.warnings.length).toBeGreaterThan(0);
      expect(report.warnings.some((w) => w.includes('NO MISSING FIELDS'))).toBe(true);
    });

    it('should reject result with missing confidence', () => {
      const result: ExtractionResult = {
        id: 'result-1',
        documentId: 'doc-1',
        ruleSetId: 'invoice-v1.0.0',
        extractedFields: new Map([
          [
            'invoiceNumber',
            {
              value: 'INV-2024-001',
              confidence: undefined as any, // Missing!
              sources: [
                {
                  chunkId: 'chunk-1',
                  textSnippet: 'Invoice Number: INV-2024-001',
                },
              ],
              extractedAt: new Date(),
            },
          ],
        ]),
        missingFields: [],
        warnings: [],
        extractedAt: new Date(),
        version: '1.0.0',
      };

      const report = validator.validateExtractionResult(result);

      expect(report.passed).toBe(false);
      expect(report.violations.some((v) => v.rule === 8)).toBe(true);
    });

    it('should reject result with missing version', () => {
      const result: ExtractionResult = {
        id: 'result-1',
        documentId: 'doc-1',
        ruleSetId: 'invoice-v1.0.0',
        extractedFields: new Map([
          [
            'invoiceNumber',
            {
              value: 'INV-2024-001',
              confidence: 0.98,
              sources: [
                {
                  chunkId: 'chunk-1',
                  textSnippet: 'Invoice Number: INV-2024-001',
                },
              ],
              extractedAt: new Date(),
            },
          ],
        ]),
        missingFields: [],
        warnings: [],
        extractedAt: new Date(),
        version: '', // Missing!
      };

      const report = validator.validateExtractionResult(result);

      expect(report.passed).toBe(false);
      expect(report.violations.some((v) => v.rule === 8)).toBe(true);
    });
  });

  describe('formatReport', () => {
    it('should format passing report', () => {
      const report = {
        passed: true,
        violations: [],
        warnings: [],
        validatedAt: new Date(),
        processingTimeMs: 125,
      };

      const formatted = validator.formatReport(report);

      expect(formatted).toContain('✅ ALL CHECKS PASSED');
      expect(formatted).toContain('125ms');
    });

    it('should format failing report with violations', () => {
      const violations = [
        new PolicyViolationError(
          'Test violation',
          1,
          'Test details'
        ),
      ];

      const report = {
        passed: false,
        violations,
        warnings: ['Test warning'],
        validatedAt: new Date(),
        processingTimeMs: 50,
      };

      const formatted = validator.formatReport(report);

      expect(formatted).toContain('❌');
      expect(formatted).toContain('Rule #1');
      expect(formatted).toContain('Test violation');
      expect(formatted).toContain('⚠️');
      expect(formatted).toContain('Test warning');
    });
  });

  describe('No Data Generation Tests', () => {
    it('should NOT allow empty value with low confidence', () => {
      const field: ExtractedField = {
        value: '', // Empty!
        confidence: 0.2,
        sources: [],
        extractedAt: new Date(),
      };

      const violations = validator.validateExtractedField(field, 'testField');

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.rule === 1 || v.rule === 2)).toBe(true);
    });

    it('should NOT auto-fill missing sources', () => {
      const field: ExtractedField = {
        value: 'Some Value',
        confidence: 0.7,
        sources: undefined as any,
        extractedAt: new Date(),
      };

      const violations = validator.validateExtractedField(field, 'testField');

      // Should report missing sources, not auto-fill
      expect(violations.length).toBeGreaterThan(0);
    });
  });
});
