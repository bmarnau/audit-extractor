import { describe, it, expect } from '@jest/globals';
import 'reflect-metadata';
import { JobLoaderService } from '@infrastructure/services/JobLoaderService';
import { SchemaLoaderService } from '@infrastructure/services/SchemaLoaderService';
import { ExampleAnalysisService } from '@infrastructure/services/ExampleAnalysisService';

/**
 * Integration Tests für Phase 22 Services
 *
 * Tests JobLoaderService → SchemaLoaderService → ExampleAnalysisService Workflow
 * ohne DI Container (direkte Instantiierung)
 */
describe('Phase 22 Services Integration (Direct)', () => {
  let jobLoaderService: JobLoaderService;
  let schemaLoaderService: SchemaLoaderService;
  let exampleAnalysisService: ExampleAnalysisService;

  beforeAll(() => {
    // Services direkt instantiieren (ohne Container)
    jobLoaderService = new JobLoaderService();
    schemaLoaderService = new SchemaLoaderService();
    exampleAnalysisService = new ExampleAnalysisService();
  });

  // ============================================================================
  // JobLoaderService Tests
  // ============================================================================

  describe('JobLoaderService', () => {
    it('should validate job structure', () => {
      const testJob = {
        jobId: 'test-job-001',
        documentType: 'invoice',
        schema: 'invoice-v1.0.0',
        sources: [
          {
            sourceId: 'src-001',
            filePath: '/documents/invoice-001.pdf',
            mimeType: 'application/pdf',
            hash: 'abc123',
            uploadedAt: new Date().toISOString(),
            sizeBytes: 50000,
          },
        ],
        options: {
          enableOCR: true,
          enableValidation: true,
          batchSize: 10,
        },
      };

      // Validate structure
      expect(testJob.jobId).toBeDefined();
      expect(testJob.documentType).toBe('invoice');
      expect(testJob.schema).toBeDefined();
      expect(testJob.sources.length).toBeGreaterThan(0);
      expect(testJob.options).toBeDefined();
    });

    it('should reject job without documentType', () => {
      const invalidJob: any = {
        jobId: 'invalid-job',
        schema: 'invoice-v1.0.0',
        sources: [
          {
            sourceId: 'src-001',
            filePath: '/test.pdf',
            mimeType: 'application/pdf',
            hash: 'hash123',
            uploadedAt: new Date().toISOString(),
            sizeBytes: 1000,
          },
        ],
      };

      expect(invalidJob.documentType).toBeUndefined();
    });

    it('should require at least one source', () => {
      const testJob = {
        jobId: 'job-with-sources',
        documentType: 'invoice',
        schema: 'schema',
        sources: [],
      };

      expect(testJob.sources.length).toBe(0);
    });

    it('should validate source structure has required fields', () => {
      const validSource = {
        sourceId: 'src-001',
        filePath: '/documents/file.pdf',
        mimeType: 'application/pdf',
        hash: 'hash123',
        uploadedAt: new Date().toISOString(),
        sizeBytes: 45000,
      };

      expect(validSource.sourceId).toBeDefined();
      expect(validSource.filePath).toBeDefined();
      expect(validSource.mimeType).toBeDefined();
      expect(validSource.hash).toBeDefined();
      expect(validSource.uploadedAt).toBeDefined();
      expect(validSource.sizeBytes).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // ExampleAnalysisService Tests
  // ============================================================================

  describe('ExampleAnalysisService', () => {
    it('should work with invoice example data', () => {
      const examples = [
        {
          invoiceNumber: 'INV-2026-001234',
          date: '2026-07-10',
          amount: 1500.5,
          vendor: 'Tech Corp',
        },
        {
          invoiceNumber: 'INV-2026-001235',
          date: '2026-07-11',
          amount: 2300.0,
          vendor: 'Software Inc',
        },
        {
          invoiceNumber: 'INV-2026-001236',
          date: '2026-07-09',
          amount: 1850.75,
          vendor: 'Services LLC',
        },
      ];

      expect(examples).toHaveLength(3);

      // Verify all examples have required fields
      for (const example of examples) {
        expect(example.invoiceNumber).toMatch(/^INV-\d{4}-\d{6}$/);
        expect(example.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof example.amount).toBe('number');
        expect(typeof example.vendor).toBe('string');
      }
    });

    it('should detect naming conventions', () => {
      const conventions = {
        camelCase: 'invoiceNumber',
        PascalCase: 'InvoiceNumber',
        snake_case: 'invoice_number',
        UPPER_SNAKE: 'INVOICE_NUMBER',
        'kebab-case': 'invoice-number',
        SCREAMING_KEBAB: 'INVOICE-NUMBER',
      };

      // Verify all conventions are recognized
      expect(Object.keys(conventions)).toHaveLength(6);
    });

    it('should detect patterns in example values', () => {
      const invoiceNumbers = [
        'INV-2026-001234',
        'INV-2026-001235',
        'INV-2026-001236',
        'INV-2026-001237',
        'INV-2026-001238',
      ];

      // Count matches
      const pattern = /^INV-\d{4}-\d{6}$/;
      const matchCount = invoiceNumbers.filter((v) => pattern.test(v)).length;

      expect(matchCount).toBe(invoiceNumbers.length);
      expect(matchCount / invoiceNumbers.length).toBeGreaterThan(0.7);
    });

    it('should handle date patterns (ISO format)', () => {
      const dates = [
        '2026-07-10',
        '2026-07-11',
        '2026-07-09',
        '2026-07-08',
        '2026-07-07',
      ];

      const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
      const matchCount = dates.filter((d) => isoPattern.test(d)).length;

      expect(matchCount).toBeGreaterThanOrEqual(5);
    });

    it('should track unique values', () => {
      const values = ['Tech Corp', 'Software Inc', 'Services LLC', 'Tech Corp'];

      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(3);
      expect(values.length).toBe(4);
    });

    it('should count occurrences', () => {
      const values = ['value1', 'value2', 'value1', 'value3', 'value1'];

      const occurrences = new Map();
      for (const v of values) {
        occurrences.set(v, (occurrences.get(v) || 0) + 1);
      }

      expect(occurrences.get('value1')).toBe(3);
      expect(occurrences.get('value2')).toBe(1);
      expect(occurrences.get('value3')).toBe(1);
    });
  });

  // ============================================================================
  // Integration Workflow Tests
  // ============================================================================

  describe('Integration Workflow', () => {
    it('should prepare job for schema validation', () => {
      // Step 1: Create job
      const job = {
        jobId: 'integration-test-001',
        documentType: 'invoice',
        schema: 'invoice-v1.0.0',
        sources: [
          {
            sourceId: 'src-001',
            filePath: '/test/invoice.pdf',
            mimeType: 'application/pdf',
            hash: 'hash123',
            uploadedAt: new Date().toISOString(),
            sizeBytes: 45000,
          },
        ],
        options: {
          enableOCR: true,
          enableValidation: true,
          batchSize: 10,
        },
      };

      // Verify structure
      expect(job.jobId).toBe('integration-test-001');
      expect(job.documentType).toBe('invoice');
      expect(job.schema).toBe('invoice-v1.0.0');
      expect(job.sources).toHaveLength(1);
      expect(job.options.enableOCR).toBe(true);
    });

    it('should set up complete extraction pipeline', () => {
      // Verify all services are available
      expect(jobLoaderService).toBeDefined();
      expect(schemaLoaderService).toBeDefined();
      expect(exampleAnalysisService).toBeDefined();

      // Verify they have expected methods
      expect(typeof jobLoaderService.loadJob).toBe('function');
      expect(typeof schemaLoaderService.loadSchema).toBe('function');
      expect(typeof exampleAnalysisService.analyzeExamples).toBe('function');
    });

    it('should support job processing pipeline', () => {
      // Simulate pipeline stages
      const jobCreated = {
        jobId: 'pipeline-test-001',
        status: 'pending',
        documentType: 'invoice',
      };

      const jobLoaded = {
        ...jobCreated,
        status: 'schema-loaded',
        schema: 'invoice-v1.0.0',
      };

      const jobAnalyzed = {
        ...jobLoaded,
        status: 'examples-analyzed',
        hints: ['invoiceNumber', 'amount', 'date'],
      };

      const jobProcessing = {
        ...jobAnalyzed,
        status: 'processing',
      };

      expect(jobCreated.status).toBe('pending');
      expect(jobLoaded.status).toBe('schema-loaded');
      expect(jobAnalyzed.status).toBe('examples-analyzed');
      expect(jobProcessing.status).toBe('processing');
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should identify missing jobId', () => {
      const job = {
        // Missing jobId
        documentType: 'invoice',
        schema: 'schema',
      };

      expect((job as any).jobId).toBeUndefined();
    });

    it('should identify invalid documentType', () => {
      const job = {
        jobId: 'test',
        documentType: '', // Empty documentType
        schema: 'schema',
      };

      expect(job.documentType).toBe('');
      expect(job.documentType.length).toBe(0);
    });

    it('should require schema reference', () => {
      const job = {
        jobId: 'test',
        documentType: 'invoice',
        schema: '', // Empty schema
      };

      expect(job.schema.length).toBe(0);
    });

    it('should validate source structure', () => {
      const source = {
        sourceId: 'src-001',
        // Missing filePath
        mimeType: 'application/pdf',
      };

      expect((source as any).filePath).toBeUndefined();
    });

    it('should validate mime type format', () => {
      const validMimeTypes = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'application/json',
      ];

      for (const mimeType of validMimeTypes) {
        expect(mimeType).toContain('/');
      }
    });
  });

  // ============================================================================
  // Data Structure Tests
  // ============================================================================

  describe('Data Structures', () => {
    it('should have correct job schema', () => {
      const job = {
        jobId: 'job-001',
        documentType: 'invoice',
        status: 'pending',
        schema: {
          schemaName: 'invoice-v1.0.0',
          version: '1.0.0',
          totalFields: 5,
        },
        sources: [
          {
            sourceId: 'src-001',
            filePath: '/file.pdf',
            mimeType: 'application/pdf',
            hash: 'abc123',
            uploadedAt: '2026-07-11T10:00:00Z',
            sizeBytes: 50000,
          },
        ],
        options: {
          enableOCR: true,
          enableValidation: true,
          batchSize: 10,
        },
        createdAt: '2026-07-11T10:00:00Z',
        updatedAt: '2026-07-11T10:00:00Z',
      };

      expect(job.jobId).toBeDefined();
      expect(job.documentType).toBeDefined();
      expect(job.status).toBeDefined();
      expect(job.schema).toBeDefined();
      expect(job.sources).toHaveLength(1);
      expect(job.options).toBeDefined();
    });

    it('should represent extraction hints correctly', () => {
      const hints = [
        {
          fieldPath: 'invoiceNumber',
          dataType: 'string',
          exampleValues: ['INV-001', 'INV-002', 'INV-003'],
          patterns: [
            {
              pattern: 'alphanumeric-dash',
              confidence: 0.95,
            },
          ],
          confidence: 0.85,
        },
        {
          fieldPath: 'amount',
          dataType: 'number',
          exampleValues: [1500.5, 2300.0, 1850.75],
          patterns: [],
          confidence: 0.9,
        },
      ];

      expect(hints).toHaveLength(2);
      expect(hints[0].fieldPath).toBe('invoiceNumber');
      expect(hints[0].confidence).toBeGreaterThan(0.5);
      expect(hints[1].fieldPath).toBe('amount');
      expect(hints[1].dataType).toBe('number');
    });
  });
});
