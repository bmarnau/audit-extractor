/**
 * DocumentClassifier Tests
 */

import { Document, DocumentFormat } from '@core/models';
import { FeatureBasedClassifier, DocumentTypeEnum } from '@application/classification/DocumentClassifierImpl';

describe('FeatureBasedClassifier', () => {
  let classifier: FeatureBasedClassifier;

  beforeEach(() => {
    classifier = new FeatureBasedClassifier();
  });

  describe('getSupportedTypes', () => {
    it('should return all supported types', () => {
      const types = classifier.getSupportedTypes();

      expect(types).toContain(DocumentTypeEnum.INVOICE);
      expect(types).toContain(DocumentTypeEnum.CONTRACT);
      expect(types).toContain(DocumentTypeEnum.RESUME);
      expect(types).toContain(DocumentTypeEnum.EMAIL);
      expect(types).toContain(DocumentTypeEnum.REPORT);
      expect(types).toContain(DocumentTypeEnum.UNKNOWN);
    });
  });

  describe('classify', () => {
    it('should classify invoice document', async () => {
      const invoiceDoc: Document = {
        id: 'invoice-1',
        fileName: 'invoice.pdf',
        type: 'invoice',
        metadata: {
          hash: 'abc',
          size: 1000,
          uploadedAt: new Date(),
          format: DocumentFormat.PDF,
          ocrApplied: false,
        },
        chunks: [
          {
            id: 'chunk-0',
            text: 'Invoice Number: INV-2024-001',
            pageNumber: 1,
            sectionId: 'section-0',
            offsetStart: 0,
            offsetEnd: 28,
            confidence: 1.0,
            isOcrExtracted: false,
            type: 'text',
            tags: [],
          },
          {
            id: 'chunk-1',
            text: 'Total Amount: $1,000.00',
            pageNumber: 1,
            sectionId: 'section-0',
            offsetStart: 29,
            offsetEnd: 52,
            confidence: 1.0,
            isOcrExtracted: false,
            type: 'text',
            tags: [],
          },
        ],
        images: [],
        loadedAt: new Date(),
        tags: [],
      };

      const result = await classifier.classify(invoiceDoc);

      expect(result.documentType).toBe(DocumentTypeEnum.INVOICE);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(1.0); // Never 100%
      expect(result.reasoning).toBeDefined();
      expect(result.classifiedAt).toBeInstanceOf(Date);
    });

    it('should classify contract document', async () => {
      const contractDoc: Document = {
        id: 'contract-1',
        fileName: 'contract.pdf',
        type: 'contract',
        metadata: {
          hash: 'abc',
          size: 2000,
          uploadedAt: new Date(),
          format: DocumentFormat.PDF,
          ocrApplied: false,
        },
        chunks: [
          {
            id: 'chunk-0',
            text: 'SERVICE AGREEMENT This Agreement is between Party A and Party B',
            pageNumber: 1,
            sectionId: 'section-0',
            offsetStart: 0,
            offsetEnd: 63,
            confidence: 1.0,
            isOcrExtracted: false,
            type: 'text',
            tags: [],
          },
          {
            id: 'chunk-1',
            text: 'Term: 12 months. Liability limitations apply.',
            pageNumber: 2,
            sectionId: 'section-1',
            offsetStart: 64,
            offsetEnd: 107,
            confidence: 1.0,
            isOcrExtracted: false,
            type: 'text',
            tags: [],
          },
        ],
        images: [],
        loadedAt: new Date(),
        tags: [],
      };

      const result = await classifier.classify(contractDoc);

      expect(result.documentType).toBe(DocumentTypeEnum.CONTRACT);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should classify resume document', async () => {
      const resumeDoc: Document = {
        id: 'resume-1',
        fileName: 'resume.pdf',
        type: 'resume',
        metadata: {
          hash: 'abc',
          size: 1500,
          uploadedAt: new Date(),
          format: DocumentFormat.PDF,
          ocrApplied: false,
        },
        chunks: [
          {
            id: 'chunk-0',
            text: 'RESUME OF JOHN DOE',
            pageNumber: 1,
            sectionId: 'section-0',
            offsetStart: 0,
            offsetEnd: 18,
            confidence: 1.0,
            isOcrExtracted: false,
            type: 'text',
            tags: [],
          },
          {
            id: 'chunk-1',
            text: 'EXPERIENCE: Senior Developer at TechCorp (2020-2023)',
            pageNumber: 1,
            sectionId: 'section-0',
            offsetStart: 19,
            offsetEnd: 70,
            confidence: 1.0,
            isOcrExtracted: false,
            type: 'text',
            tags: [],
          },
          {
            id: 'chunk-2',
            text: 'EDUCATION: BS Computer Science, University of Tech',
            pageNumber: 1,
            sectionId: 'section-1',
            offsetStart: 71,
            offsetEnd: 121,
            confidence: 1.0,
            isOcrExtracted: false,
            type: 'text',
            tags: [],
          },
        ],
        images: [],
        loadedAt: new Date(),
        tags: [],
      };

      const result = await classifier.classify(resumeDoc);

      expect(result.documentType).toBe(DocumentTypeEnum.RESUME);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should classify email document', async () => {
      const emailDoc: Document = {
        id: 'email-1',
        fileName: 'email.txt',
        type: 'email',
        metadata: {
          hash: 'abc',
          size: 500,
          uploadedAt: new Date(),
          format: DocumentFormat.UNKNOWN,
          ocrApplied: false,
        },
        chunks: [
          {
            id: 'chunk-0',
            text: 'From: sender@example.com To: recipient@example.com Subject: Meeting Request',
            pageNumber: 1,
            sectionId: 'section-0',
            offsetStart: 0,
            offsetEnd: 76,
            confidence: 1.0,
            isOcrExtracted: false,
            type: 'text',
            tags: [],
          },
          {
            id: 'chunk-1',
            text: 'Dear John, I would like to schedule a meeting...',
            pageNumber: 1,
            sectionId: 'section-0',
            offsetStart: 77,
            offsetEnd: 125,
            confidence: 1.0,
            isOcrExtracted: false,
            type: 'text',
            tags: [],
          },
        ],
        images: [],
        loadedAt: new Date(),
        tags: [],
      };

      const result = await classifier.classify(emailDoc);

      expect(result.documentType).toBe(DocumentTypeEnum.EMAIL);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should classify report document', async () => {
      const reportDoc: Document = {
        id: 'report-1',
        fileName: 'report.pdf',
        type: 'report',
        metadata: {
          hash: 'abc',
          size: 3000,
          uploadedAt: new Date(),
          format: DocumentFormat.PDF,
          ocrApplied: false,
        },
        chunks: [
          {
            id: 'chunk-0',
            text: 'ANNUAL REPORT 2024',
            pageNumber: 1,
            sectionId: 'section-0',
            offsetStart: 0,
            offsetEnd: 18,
            confidence: 1.0,
            isOcrExtracted: false,
            type: 'text',
            tags: [],
          },
          {
            id: 'chunk-1',
            text: 'EXECUTIVE SUMMARY: Strong growth in Q4',
            pageNumber: 2,
            sectionId: 'section-1',
            offsetStart: 19,
            offsetEnd: 57,
            confidence: 1.0,
            isOcrExtracted: false,
            type: 'text',
            tags: [],
          },
          {
            id: 'chunk-2',
            text: 'CONCLUSION: Overall performance exceeded targets',
            pageNumber: 5,
            sectionId: 'section-5',
            offsetStart: 58,
            offsetEnd: 106,
            confidence: 1.0,
            isOcrExtracted: false,
            type: 'text',
            tags: [],
          },
        ],
        images: [],
        loadedAt: new Date(),
        tags: [],
      };

      const result = await classifier.classify(reportDoc);

      expect(result.documentType).toBe(DocumentTypeEnum.REPORT);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should classify ambiguous document as UNKNOWN', async () => {
      const unknownDoc: Document = {
        id: 'unknown-1',
        fileName: 'file.txt',
        type: 'unknown',
        metadata: {
          hash: 'abc',
          size: 100,
          uploadedAt: new Date(),
          format: DocumentFormat.UNKNOWN,
          ocrApplied: false,
        },
        chunks: [
          {
            id: 'chunk-0',
            text: 'Some random text with no clear indicators of document type',
            pageNumber: 1,
            sectionId: 'section-0',
            offsetStart: 0,
            offsetEnd: 58,
            confidence: 1.0,
            isOcrExtracted: false,
            type: 'text',
            tags: [],
          },
        ],
        images: [],
        loadedAt: new Date(),
        tags: [],
      };

      const result = await classifier.classify(unknownDoc);

      expect(result.documentType).toBe(DocumentTypeEnum.UNKNOWN);
    });
  });

  describe('Confidence Constraint', () => {
    it('should never return confidence of 1.0', async () => {
      const invoiceDoc: Document = {
        id: 'invoice-1',
        fileName: 'invoice.pdf',
        type: 'invoice',
        metadata: {
          hash: 'abc',
          size: 1000,
          uploadedAt: new Date(),
          format: DocumentFormat.PDF,
          ocrApplied: false,
        },
        chunks: [
          {
            id: 'chunk-0',
            text: 'Invoice Number: INV-2024-001 Total: $1000 Date: 2024-01-15 Amount Due Date Terms Invoice Items',
            pageNumber: 1,
            sectionId: 'section-0',
            offsetStart: 0,
            offsetEnd: 95,
            confidence: 1.0,
            isOcrExtracted: false,
            type: 'text',
            tags: [],
          },
        ],
        images: [],
        loadedAt: new Date(),
        tags: [],
      };

      const result = await classifier.classify(invoiceDoc);

      expect(result.confidence).toBeLessThan(1.0);
      expect(result.confidence).toBeLessThanOrEqual(0.99);
    });

    it('should document uncertainty for low confidence results', async () => {
      const ambiguousDoc: Document = {
        id: 'ambig-1',
        fileName: 'file.txt',
        type: 'unknown',
        metadata: {
          hash: 'abc',
          size: 200,
          uploadedAt: new Date(),
          format: DocumentFormat.UNKNOWN,
          ocrApplied: false,
        },
        chunks: [
          {
            id: 'chunk-0',
            text: 'Some text that could be invoice or contract terms and conditions with items',
            pageNumber: 1,
            sectionId: 'section-0',
            offsetStart: 0,
            offsetEnd: 73,
            confidence: 1.0,
            isOcrExtracted: false,
            type: 'text',
            tags: [],
          },
        ],
        images: [],
        loadedAt: new Date(),
        tags: [],
      };

      const result = await classifier.classify(ambiguousDoc);

      expect(result.uncertainty).toBeDefined();
      expect(result.uncertainty).not.toBeNull();
    });
  });

  describe('Alternative Types', () => {
    it('should provide alternative classifications', async () => {
      const ambiguousDoc: Document = {
        id: 'ambig-1',
        fileName: 'file.txt',
        type: 'unknown',
        metadata: {
          hash: 'abc',
          size: 300,
          uploadedAt: new Date(),
          format: DocumentFormat.UNKNOWN,
          ocrApplied: false,
        },
        chunks: [
          {
            id: 'chunk-0',
            text: 'Invoice and Contract: This agreement outlines invoice terms with line items and payment conditions',
            pageNumber: 1,
            sectionId: 'section-0',
            offsetStart: 0,
            offsetEnd: 94,
            confidence: 1.0,
            isOcrExtracted: false,
            type: 'text',
            tags: [],
          },
        ],
        images: [],
        loadedAt: new Date(),
        tags: [],
      };

      const result = await classifier.classify(ambiguousDoc);

      if (result.alternativeTypes) {
        for (const alt of result.alternativeTypes) {
          expect(alt.confidence).toBeLessThan(1.0);
          expect(alt.type).toBeDefined();
        }
      }
    });
  });
});
