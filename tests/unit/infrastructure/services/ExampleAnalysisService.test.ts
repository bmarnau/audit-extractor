import { describe, it, expect } from '@jest/globals';
import {
  ExtractionHintFactory,
  DataPattern,
} from '@domain/extraction/ExtractionHint';
import { SchemaDefinitionFactory } from '@domain/schema/SchemaDefinition';

/**
 * Unit Tests für ExampleAnalysisService
 *
 * Tests datengetriebene Analyse von Beispieldaten
 * gegen Schemas ohne KI/ML
 */
describe('ExampleAnalysisService', () => {

  // ============================================================================
  // Naming Convention Detection Tests
  // ============================================================================

  describe('Naming Convention Detection', () => {
    it('should detect camelCase', () => {
      const conventions = [
        'invoiceNumber',
        'vendorName',
        'createdAt',
        'isProcessed',
      ];

      // Access private method through type casting for testing
      for (const name of conventions) {
        const hint = ExtractionHintFactory.create(
          name,
          [name],
          'string',
          ['test']
        );
        expect(hint.namingConvention).toBe('camelCase');
      }
    });

    it('should detect PascalCase', () => {
      const conventions = [
        'InvoiceNumber',
        'VendorName',
        'CreatedAt',
        'IsProcessed',
      ];

      for (const name of conventions) {
        const hint = ExtractionHintFactory.create(
          name,
          [name],
          'string',
          ['test']
        );
        expect(hint.namingConvention).toBe('PascalCase');
      }
    });

    it('should detect snake_case', () => {
      const conventions = [
        'invoice_number',
        'vendor_name',
        'created_at',
        'is_processed',
      ];

      for (const name of conventions) {
        const hint = ExtractionHintFactory.create(
          name,
          [name],
          'string',
          ['test']
        );
        expect(hint.namingConvention).toBe('snake_case');
      }
    });

    it('should detect UPPER_SNAKE', () => {
      const conventions = [
        'INVOICE_NUMBER',
        'VENDOR_NAME',
        'CREATED_AT',
        'IS_PROCESSED',
      ];

      for (const name of conventions) {
        const hint = ExtractionHintFactory.create(
          name,
          [name],
          'string',
          ['test']
        );
        expect(hint.namingConvention).toBe('UPPER_SNAKE');
      }
    });

    it('should detect kebab-case', () => {
      const conventions = [
        'invoice-number',
        'vendor-name',
        'created-at',
        'is-processed',
      ];

      for (const name of conventions) {
        const hint = ExtractionHintFactory.create(
          name,
          [name],
          'string',
          ['test']
        );
        expect(hint.namingConvention).toBe('kebab-case');
      }
    });

    it('should detect SCREAMING-KEBAB', () => {
      const conventions = [
        'INVOICE-NUMBER',
        'VENDOR-NAME',
        'CREATED-AT',
        'IS-PROCESSED',
      ];

      for (const name of conventions) {
        const hint = ExtractionHintFactory.create(
          name,
          [name],
          'string',
          ['test']
        );
        expect(hint.namingConvention).toBe('SCREAMING_KEBAB');
      }
    });

    it('should detect mixed naming', () => {
      const mixed = ['invoiceNumber_123', 'vendor-name_old', 'MIXED_CaseName'];

      for (const name of mixed) {
        const hint = ExtractionHintFactory.create(
          name,
          [name],
          'string',
          ['test']
        );
        expect(
          hint.namingConvention === 'mixed' || hint.namingConvention === 'unknown'
        ).toBe(true);
      }
    });
  });

  // ============================================================================
  // Pattern Detection Tests
  // ============================================================================

  describe('Pattern Detection', () => {
    it('should detect date patterns (ISO format)', () => {
      const examples = [
        '2024-07-10',
        '2024-06-15',
        '2024-05-20',
        '2024-04-01',
      ];

      const hint = ExtractionHintFactory.create(
        'invoiceDate',
        ['invoiceDate'],
        'string',
        examples
      );

      expect(hint.patterns.length).toBeGreaterThan(0);
      const datePattern = hint.patterns.find((p) => p.pattern === 'date');
      expect(datePattern).toBeDefined();
      expect(datePattern?.confidence).toBeGreaterThan(0.7);
    });

    it('should detect date patterns (DD.MM.YYYY format)', () => {
      const examples = ['10.07.2024', '15.06.2024', '20.05.2024', '01.04.2024'];

      const hint = ExtractionHintFactory.create(
        'deliveryDate',
        ['deliveryDate'],
        'string',
        examples
      );

      expect(hint.patterns.length).toBeGreaterThan(0);
      const datePattern = hint.patterns.find((p) => p.pattern === 'date');
      expect(datePattern).toBeDefined();
      expect(datePattern?.confidence).toBeGreaterThan(0.7);
    });

    it('should detect alphanumeric-dash patterns', () => {
      const examples = [
        'INV-2024-001234',
        'INV-2024-001235',
        'INV-2024-001236',
      ];

      const hint = ExtractionHintFactory.create(
        'invoiceNumber',
        ['invoiceNumber'],
        'string',
        examples
      );

      expect(hint.patterns.length).toBeGreaterThan(0);
      const pattern = hint.patterns.find(
        (p) => p.pattern === 'alphanumeric-dash'
      );
      expect(pattern).toBeDefined();
      expect(pattern?.confidence).toBeGreaterThan(0.7);
    });

    it('should detect UUID patterns', () => {
      const examples = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
      ];

      const hint = ExtractionHintFactory.create(
        'jobId',
        ['jobId'],
        'string',
        examples
      );

      expect(hint.patterns.length).toBeGreaterThan(0);
      const uuidPattern = hint.patterns.find((p) => p.pattern === 'uuid');
      expect(uuidPattern).toBeDefined();
      expect(uuidPattern?.confidence).toBeGreaterThan(0.7);
    });

    it('should detect email patterns', () => {
      const examples = [
        'vendor@acme.com',
        'contact@acme.com',
        'sales@acme.de',
      ];

      const hint = ExtractionHintFactory.create(
        'vendorEmail',
        ['vendor', 'email'],
        'string',
        examples
      );

      expect(hint.patterns.length).toBeGreaterThan(0);
      const emailPattern = hint.patterns.find((p) => p.pattern === 'email');
      expect(emailPattern).toBeDefined();
      expect(emailPattern?.confidence).toBeGreaterThan(0.7);
    });

    it('should detect URL patterns', () => {
      const examples = [
        'https://vendor.example.com',
        'https://api.acme.de/path',
        'http://localhost:3000',
      ];

      const hint = ExtractionHintFactory.create(
        'vendorUrl',
        ['vendor', 'url'],
        'string',
        examples
      );

      expect(hint.patterns.length).toBeGreaterThan(0);
      const urlPattern = hint.patterns.find((p) => p.pattern === 'url');
      expect(urlPattern).toBeDefined();
      expect(urlPattern?.confidence).toBeGreaterThan(0.7);
    });
  });

  // ============================================================================
  // Prefix/Suffix Detection Tests
  // ============================================================================

  describe('Prefix and Suffix Detection', () => {
    it('should detect common prefix', () => {
      const examples = [
        'SRV-APP01',
        'SRV-DB01',
        'SRV-WEB02',
        'SRV-CACHE03',
      ];

      const hint = ExtractionHintFactory.create(
        'serverName',
        ['serverName'],
        'string',
        examples
      );

      expect(hint.hasPrefix).toBe(true);
    });

    it('should detect common suffix', () => {
      const examples = [
        'invoice.pdf',
        'delivery.pdf',
        'contract.pdf',
        'agreement.pdf',
      ];

      const hint = ExtractionHintFactory.create(
        'documentFile',
        ['documentFile'],
        'string',
        examples
      );

      expect(hint.hasSuffix).toBe(true);
    });

    it('should detect common separators', () => {
      const examples = [
        'INV-2024-001234',
        'PO-2024-005678',
        'DN-2024-009012',
      ];

      const hint = ExtractionHintFactory.create(
        'documentNumber',
        ['documentNumber'],
        'string',
        examples
      );

      expect(hint.commonSeparators).toContain('-');
    });
  });

  // ============================================================================
  // Data Type Inference Tests
  // ============================================================================

  describe('Data Type Inference', () => {
    it('should identify string data type', () => {
      const hint = ExtractionHintFactory.create(
        'name',
        ['name'],
        'string',
        ['John', 'Jane', 'Bob']
      );

      expect(hint.dataType).toBe('string');
    });

    it('should identify number data type', () => {
      const hint = ExtractionHintFactory.create(
        'quantity',
        ['quantity'],
        'number',
        [10, 20, 30]
      );

      expect(hint.dataType).toBe('number');
    });

    it('should identify object data type', () => {
      const hint = ExtractionHintFactory.create(
        'vendor',
        ['vendor'],
        'object',
        ['ACME Corp', 'Tech Solutions']
      );

      expect(hint.dataType).toBe('object');
    });
  });

  // ============================================================================
  // Field Statistics Tests
  // ============================================================================

  describe('Field Statistics', () => {
    it('should count unique values', () => {
      const examples = [
        'ACME',
        'ACME',
        'Corp',
        'Corp',
        'Corp',
        'Another',
      ];

      const hint = ExtractionHintFactory.create(
        'vendorName',
        ['vendorName'],
        'string',
        examples
      );

      expect(hint.uniqueValueCount).toBe(3);
    });

    it('should calculate min and max length for strings', () => {
      const examples = ['a', 'abcde', 'abc', 'ab', 'abcdef'];

      const hint = ExtractionHintFactory.create(
        'code',
        ['code'],
        'string',
        examples
      );

      expect(hint.minLength).toBe(1);
      expect(hint.maxLength).toBe(6);
    });

    it('should track occurrence count', () => {
      const examples = ['value1', 'value2', 'value3'];

      const hint = ExtractionHintFactory.create(
        'field',
        ['field'],
        'string',
        examples,
        [],
        'unknown',
        5 // occurrenceCount
      );

      expect(hint.occurrenceCount).toBe(5);
    });

    it('should track null values', () => {
      const hint = ExtractionHintFactory.create(
        'field',
        ['field'],
        'string',
        ['value1', 'value2'],
        [],
        'unknown',
        5,
        2 // nullValueCount
      );

      expect(hint.nullValueCount).toBe(2);
    });
  });

  // ============================================================================
  // Confidence Calculation Tests
  // ============================================================================

  describe('Confidence Calculation', () => {
    it('should have high confidence with many examples and patterns', () => {
      const examples = [
        '2024-07-10',
        '2024-06-15',
        '2024-05-20',
        '2024-04-01',
        '2024-03-15',
      ];
      const patterns: DataPattern[] = [
        {
          type: 'format',
          pattern: 'date',
          confidence: 0.95,
          examples: [],
        },
      ];

      const hint = ExtractionHintFactory.create(
        'invoiceDate',
        ['invoiceDate'],
        'string',
        examples,
        patterns,
        'PascalCase'
      );

      expect(hint.confidence).toBeGreaterThan(0.7);
    });

    it('should have lower confidence with few examples', () => {
      const examples = ['value1'];

      const hint = ExtractionHintFactory.create(
        'rareName',
        ['rareName'],
        'string',
        examples,
        []
      );

      expect(hint.confidence).toBeLessThan(0.5);
    });

    it('should have lower confidence with unknown naming convention', () => {
      const examples = ['example-1', 'example_2', 'exampleThree'];

      const hint = ExtractionHintFactory.create(
        'mixedName',
        ['mixedName'],
        'string',
        examples,
        [],
        'unknown'
      );

      expect(hint.confidence).toBeLessThan(0.6);
    });

    it('should have high confidence with consistent values', () => {
      const examples = [
        'SRV-APP01',
        'SRV-APP02',
        'SRV-APP03',
        'SRV-APP04',
      ];

      const hint = ExtractionHintFactory.create(
        'serverName',
        ['serverName'],
        'string',
        examples
      );

      // High consistency should boost confidence
      expect(hint.confidence).toBeGreaterThan(0.5);
    });
  });

  // ============================================================================
  // Nested Field Path Tests
  // ============================================================================

  describe('Nested Field Paths', () => {
    it('should correctly identify field depth', () => {
      const hint1 = ExtractionHintFactory.create(
        'name',
        ['name'],
        'string',
        ['Test']
      );
      expect(hint1.depth).toBe(0);

      const hint2 = ExtractionHintFactory.create(
        'vendor.name',
        ['vendor', 'name'],
        'string',
        ['ACME']
      );
      expect(hint2.depth).toBe(1);

      const hint3 = ExtractionHintFactory.create(
        'vendor.address.city',
        ['vendor', 'address', 'city'],
        'string',
        ['Berlin']
      );
      expect(hint3.depth).toBe(2);
    });

    it('should correctly parse nested field paths', () => {
      const hint = ExtractionHintFactory.create(
        'invoice.vendor.address.city',
        ['invoice', 'vendor', 'address', 'city'],
        'string',
        ['Berlin', 'Munich']
      );

      expect(hint.fieldPath).toEqual([
        'invoice',
        'vendor',
        'address',
        'city',
      ]);
      expect(hint.field).toBe('invoice.vendor.address.city');
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration with SchemaDefinition', () => {
    it('should work with real invoice schema', () => {
      const schemaName = 'invoice-v2.0.0';
      const version = '2.0.0';
      const fields = [
        {
          name: 'invoiceNumber',
          type: 'string',
          required: true,
        },
        {
          name: 'invoiceDate',
          type: 'string',
          format: 'date',
          required: true,
        },
        {
          name: 'vendor',
          type: 'object',
          required: true,
        },
      ];

      const schema = SchemaDefinitionFactory.create(
        schemaName,
        version,
        fields as any,
        ['invoiceNumber', 'invoiceDate', 'vendor'],
        { properties: {} }
      );

      expect(schema.schemaName).toBe(schemaName);
      expect(schema.schemaVersion).toBe(version);
      expect(schema.requiredFieldCount).toBe(3);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty example array', () => {
      const hint = ExtractionHintFactory.create(
        'field',
        ['field'],
        'string',
        []
      );

      expect(hint.uniqueValueCount).toBe(0);
      expect(hint.exampleValues.length).toBe(0);
    });

    it('should handle single example', () => {
      const hint = ExtractionHintFactory.create(
        'field',
        ['field'],
        'string',
        ['single']
      );

      expect(hint.uniqueValueCount).toBe(1);
      expect(hint.exampleValues).toEqual(['single']);
    });

    it('should handle special characters in field names', () => {
      const examples = ['value1', 'value2'];

      const hint = ExtractionHintFactory.create(
        'field_with_special-chars',
        ['field_with_special-chars'],
        'string',
        examples
      );

      expect(hint.field).toBe('field_with_special-chars');
    });
  });
});
