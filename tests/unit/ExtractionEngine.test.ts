import { ExtractionEngine, ProvenanceAuditor } from '@application/ExtractionEngine';
import { ExtractionFieldName } from '@domain/ExtractionFieldName';
import { ConfidenceScore } from '@domain/ConfidenceScore';
import { ExtractionRule } from '@domain/ExtractionRule';

describe('ExtractionEngine', () => {
  let engine: ExtractionEngine;
  let rules: ExtractionRule[];

  beforeEach(() => {
    rules = [
      {
        ruleId: 'rule-1',
        fieldName: new ExtractionFieldName('customerName'),
        description: 'Customer name',
        fieldType: 'string',
        isRequired: true,
        documentTypes: ['pdf', 'html']
      },
      {
        ruleId: 'rule-2',
        fieldName: new ExtractionFieldName('invoiceAmount'),
        description: 'Invoice amount',
        fieldType: 'number',
        isRequired: true,
        documentTypes: ['pdf']
      }
    ];

    engine = new ExtractionEngine(rules);
  });

  describe('extract', () => {
    it('should successfully extract a value with sources', () => {
      const result = engine.extract(
        'customerName',
        'Acme Corp',
        [
          {
            documentReference: {
              documentId: 'doc-1',
              fileName: 'invoice.pdf',
              documentType: 'pdf',
              hash: 'abc123',
              uploadedAt: new Date()
            },
            pageNumber: 1,
            textSnippet: 'Customer: Acme Corp'
          }
        ],
        0.95
      );

      expect(result.value).toBe('Acme Corp');
      expect(result.confidence).toBe(0.95);
      expect(result.sources.length).toBe(1);
    });

    it('should track extraction in audit trail', () => {
      engine.extract(
        'customerName',
        'Test',
        [
          {
            documentReference: {
              documentId: 'doc-1',
              fileName: 'test.pdf',
              documentType: 'pdf',
              hash: 'hash',
              uploadedAt: new Date()
            }
          }
        ],
        0.9
      );

      const trail = engine.getAuditTrail();
      expect(trail.length).toBeGreaterThan(0);
      expect(trail.some((e) => e.field === 'customerName')).toBe(true);
    });
  });

  describe('applyConfidenceFilter', () => {
    it('should null out low-confidence values', () => {
      const extracted = {
        value: 'Some Value',
        confidence: 0.5,
        sources: [],
        extractedAt: new Date()
      };

      const filtered = engine.applyConfidenceFilter(extracted, 0.8);

      expect(filtered.value).toBeNull();
      expect(filtered.uncertainty).toContain('0.8');
    });

    it('should keep high-confidence values', () => {
      const extracted = {
        value: 'Some Value',
        confidence: 0.95,
        sources: [],
        extractedAt: new Date()
      };

      const filtered = engine.applyConfidenceFilter(extracted, 0.8);

      expect(filtered.value).toBe('Some Value');
    });
  });

  describe('generateWarnings', () => {
    it('should warn about missing required fields', () => {
      const extracted = new Map();
      const warnings = engine.generateWarnings(extracted, rules);

      expect(warnings.some((w) => w.field === 'customerName')).toBe(true);
      expect(warnings.some((w) => w.level === 'error')).toBe(true);
    });

    it('should warn about low-confidence fields', () => {
      const extracted = new Map();
      extracted.set('customerName', {
        value: 'Test',
        confidence: 0.6,
        sources: [],
        extractedAt: new Date()
      });

      const warnings = engine.generateWarnings(extracted, rules);

      expect(warnings.some((w) => w.field === 'customerName')).toBe(true);
      expect(warnings.some((w) => w.level === 'warning')).toBe(true);
    });
  });
});

describe('ProvenanceAuditor', () => {
  it('should record audit entries with timestamps', () => {
    const auditor = new ProvenanceAuditor();

    auditor.record({
      action: 'extract',
      field: 'test',
      result: 'success',
      details: {}
    });

    const trail = auditor.getAuditTrail();
    expect(trail.length).toBe(1);
    expect(trail[0].timestamp).toBeInstanceOf(Date);
    expect(trail[0].field).toBe('test');
  });
});
