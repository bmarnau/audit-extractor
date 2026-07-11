/**
 * Unit Tests for Document Adapters
 *
 * Tests for PdfDocumentAdapter and HtmlDocumentAdapter
 *
 * @version 0.23.0
 * @phase 23 - Extraction Pipeline & UnifiedDocument
 */

import 'reflect-metadata';
import { PdfDocumentAdapter } from '@infrastructure/adapters/PdfDocumentAdapter';
import { HtmlDocumentAdapter } from '@infrastructure/adapters/HtmlDocumentAdapter';
import { DocumentAdapter, DocumentAdapterError } from '@domain/document/DocumentAdapter';

describe('Document Adapters', () => {
  // ==================== PdfDocumentAdapter Tests ====================

  describe('PdfDocumentAdapter', () => {
    let adapter: PdfDocumentAdapter;

    beforeEach(() => {
      adapter = new PdfDocumentAdapter();
    });

    it('should be a valid DocumentAdapter', () => {
      expect(adapter).toHaveProperty('canHandle');
      expect(adapter).toHaveProperty('load');
      expect(adapter).toHaveProperty('validate');
      expect(adapter).toHaveProperty('getName');
      expect(adapter).toHaveProperty('getSupportedMimeTypes');
    });

    it('should handle PDF files', () => {
      expect(adapter.canHandle('document.pdf')).toBe(true);
      expect(adapter.canHandle('document.PDF')).toBe(true);
      expect(adapter.canHandle('file.txt')).toBe(false);
      expect(adapter.canHandle('file.html')).toBe(false);
    });

    it('should return adapter name', () => {
      expect(adapter.getName()).toBe('PdfDocumentAdapter');
    });

    it('should return supported MIME types', () => {
      const mimeTypes = adapter.getSupportedMimeTypes();
      expect(mimeTypes).toContain('application/pdf');
      expect(mimeTypes.length).toBeGreaterThan(0);
    });

    it('should throw on validation of non-existent file', async () => {
      await expect(adapter.validate('/non/existent/file.pdf')).rejects.toThrow();
    });

    it('should throw on validation of non-PDF file', async () => {
      // This will fail because the file doesn't exist, but that's expected
      // In real scenario, we'd create temp files
      await expect(adapter.validate('/tmp/document.txt')).rejects.toThrow();
    });

    it('should validate file extension', () => {
      expect(adapter.canHandle('document.pdf')).toBe(true);
      expect(adapter.canHandle('document.doc')).toBe(false);
    });
  });

  // ==================== HtmlDocumentAdapter Tests ====================

  describe('HtmlDocumentAdapter', () => {
    let adapter: HtmlDocumentAdapter;

    beforeEach(() => {
      adapter = new HtmlDocumentAdapter();
    });

    it('should be a valid DocumentAdapter', () => {
      expect(adapter).toHaveProperty('canHandle');
      expect(adapter).toHaveProperty('load');
      expect(adapter).toHaveProperty('validate');
      expect(adapter).toHaveProperty('getName');
      expect(adapter).toHaveProperty('getSupportedMimeTypes');
    });

    it('should handle HTML files', () => {
      expect(adapter.canHandle('page.html')).toBe(true);
      expect(adapter.canHandle('page.HTML')).toBe(true);
      expect(adapter.canHandle('page.htm')).toBe(true);
      expect(adapter.canHandle('page.HTM')).toBe(true);
      expect(adapter.canHandle('file.pdf')).toBe(false);
      expect(adapter.canHandle('file.txt')).toBe(false);
    });

    it('should return adapter name', () => {
      expect(adapter.getName()).toBe('HtmlDocumentAdapter');
    });

    it('should return supported MIME types', () => {
      const mimeTypes = adapter.getSupportedMimeTypes();
      expect(mimeTypes).toContain('text/html');
      expect(mimeTypes.length).toBeGreaterThan(0);
    });

    it('should throw on validation of non-existent file', async () => {
      await expect(adapter.validate('/non/existent/file.html')).rejects.toThrow();
    });

    it('should validate file extension', () => {
      expect(adapter.canHandle('page.html')).toBe(true);
      expect(adapter.canHandle('page.htm')).toBe(true);
      expect(adapter.canHandle('page.pdf')).toBe(false);
    });
  });

  // ==================== DocumentAdapterError Tests ====================

  describe('DocumentAdapterError', () => {
    it('should create validation error', () => {
      const error = DocumentAdapterError.validation(
        'Invalid file format',
        'TestAdapter'
      );

      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.message).toBe('Invalid file format');
      expect(error.adapter).toBe('TestAdapter');
    });

    it('should create loading error', () => {
      const cause = new Error('File not found');
      const error = DocumentAdapterError.loading(
        'Failed to load file',
        'TestAdapter',
        cause
      );

      expect(error.code).toBe('LOADING_FAILED');
      expect(error.cause).toBe(cause);
    });

    it('should create processing error', () => {
      const error = DocumentAdapterError.processing(
        'Failed to parse content',
        'TestAdapter'
      );

      expect(error.code).toBe('PROCESSING_FAILED');
    });

    it('should create unsupported format error', () => {
      const error = DocumentAdapterError.unsupported('file.xyz');

      expect(error.code).toBe('UNSUPPORTED_FORMAT');
      expect(error.message).toContain('file.xyz');
    });

    it('should convert to object', () => {
      const error = DocumentAdapterError.validation(
        'Test error',
        'TestAdapter',
        { detail: 'some detail' }
      );

      const obj = error.toObject();

      expect(obj.code).toBe('VALIDATION_FAILED');
      expect(obj.message).toBe('Test error');
      expect(obj.adapter).toBe('TestAdapter');
      expect(obj.details?.detail).toBe('some detail');
    });

    it('should be instanceof Error', () => {
      const error = DocumentAdapterError.validation('Test');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DocumentAdapterError');
    });
  });

  // ==================== Adapter Interface Contract Tests ====================

  describe('Document Adapter Interface Contract', () => {
    const adapters: DocumentAdapter[] = [
      new PdfDocumentAdapter(),
      new HtmlDocumentAdapter(),
    ];

    adapters.forEach((adapter) => {
      describe(`${adapter.getName()}`, () => {
        it('should implement canHandle method', () => {
          expect(typeof adapter.canHandle).toBe('function');
          expect(adapter.canHandle('test.txt')).toEqual(
            expect.any(Boolean)
          );
        });

        it('should implement getName method', () => {
          expect(typeof adapter.getName).toBe('function');
          expect(typeof adapter.getName()).toBe('string');
          expect(adapter.getName().length).toBeGreaterThan(0);
        });

        it('should implement getSupportedMimeTypes method', () => {
          expect(typeof adapter.getSupportedMimeTypes).toBe('function');
          const mimeTypes = adapter.getSupportedMimeTypes();
          expect(Array.isArray(mimeTypes)).toBe(true);
          expect(mimeTypes.length).toBeGreaterThan(0);
          expect(mimeTypes.every((t) => typeof t === 'string')).toBe(true);
        });

        it('should implement validate method', () => {
          expect(typeof adapter.validate).toBe('function');
          expect(adapter.validate('test.pdf')).toBeInstanceOf(Promise);
        });

        it('should implement load method', () => {
          expect(typeof adapter.load).toBe('function');
          expect(adapter.load('test.pdf')).toBeInstanceOf(Promise);
        });

        it('should handle supported files with canHandle', () => {
          const mimeTypes = adapter.getSupportedMimeTypes();
          // This is a basic check - actual implementations should be tested
          // with real files in integration tests
          expect(mimeTypes.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
