/**
 * Unit Tests for UnifiedDocument Domain Models
 *
 * Tests for DocumentId, DocumentPage, DocumentSection, etc.
 *
 * @version 0.23.0
 * @phase 23 - Extraction Pipeline & UnifiedDocument
 */

import 'reflect-metadata';
import {
  DocumentId,
  DocumentPage,
  DocumentPageFactory,
  DocumentSectionFactory,
  DocumentTableFactory,
  DocumentMetadata,
  DocumentMetadataFactory,
  UnifiedDocument,
} from '@domain/document';

describe('UnifiedDocument Domain Models', () => {
  // ==================== DocumentId Tests ====================

  describe('DocumentId', () => {
    it('should create new DocumentId with UUID', () => {
      const docId = DocumentId.create();
      expect(docId.toString()).toMatch(/^DOC-[0-9a-f-]+$/i);
    });

    it('should create DocumentId from existing string', () => {
      const id = 'DOC-550e8400-e29b-41d4-a716-446655440000';
      const docId = DocumentId.fromString(id);
      expect(docId.toString()).toBe(id);
    });

    it('should throw on invalid format', () => {
      expect(() => DocumentId.fromString('INVALID-ID')).toThrow();
      expect(() => DocumentId.fromString('DOC-12345')).toThrow();
      expect(() => DocumentId.fromString('')).toThrow();
    });

    it('should support equality check', () => {
      const id1 = DocumentId.fromString('DOC-550e8400-e29b-41d4-a716-446655440000');
      const id2 = DocumentId.fromString('DOC-550e8400-e29b-41d4-a716-446655440000');
      const id3 = DocumentId.create();

      expect(id1.equals(id2)).toBe(true);
      expect(id1.equals(id3)).toBe(false);
    });

    it('should extract UUID', () => {
      const id = 'DOC-550e8400-e29b-41d4-a716-446655440000';
      const docId = DocumentId.fromString(id);
      expect(docId.getUuid()).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  // ==================== DocumentPage Tests ====================

  describe('DocumentPage', () => {
    it('should create document page with text', () => {
      const text = 'This is page content';
      const page = DocumentPageFactory.create(1, text);

      expect(page.pageNumber).toBe(1);
      expect(page.pageId).toBe('page_001');
      expect(page.rawText).toBe(text);
      expect(page.textLength).toBe(text.length);
      expect(page.hasText).toBe(true);
    });

    it('should create empty page', () => {
      const page = DocumentPageFactory.createEmpty(2);

      expect(page.pageNumber).toBe(2);
      expect(page.pageId).toBe('page_002');
      expect(page.hasText).toBe(false);
      expect(page.textLength).toBe(0);
    });

    it('should count lines correctly', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const page = DocumentPageFactory.create(1, text);

      expect(page.lineCount).toBe(3);
    });

    it('should throw on invalid page number', () => {
      expect(() => DocumentPageFactory.create(0, 'text')).toThrow();
      expect(() => DocumentPageFactory.create(-1, 'text')).toThrow();
    });

    it('should merge pages', () => {
      const page1 = DocumentPageFactory.create(1, 'Page 1');
      const page2 = DocumentPageFactory.create(2, 'Page 2');
      const page3 = DocumentPageFactory.create(3, 'Page 3');

      const merged = DocumentPageFactory.merge([page1, page2, page3], ' | ');

      expect(merged.pageNumber).toBe(1);
      expect(merged.rawText).toBe('Page 1 | Page 2 | Page 3');
    });

    it('should include images metadata', () => {
      const page = DocumentPageFactory.create(1, 'Text with image', {
        hasImages: true,
        imagePaths: ['/img1.jpg', '/img2.png'],
      });

      expect(page.hasImages).toBe(true);
      expect(page.imagePaths).toEqual(['/img1.jpg', '/img2.png']);
    });
  });

  // ==================== DocumentSection Tests ====================

  describe('DocumentSection', () => {
    it('should create document section', () => {
      const section = DocumentSectionFactory.create(
        'Introduction',
        1,
        1,
        2,
        'Introduction text here'
      );

      expect(section.title).toBe('Introduction');
      expect(section.level).toBe(1);
      expect(section.startPageNumber).toBe(1);
      expect(section.endPageNumber).toBe(2);
      expect(section.sectionId).toMatch(/^section_/);
    });

    it('should throw on invalid section level', () => {
      expect(() =>
        DocumentSectionFactory.create('Title', 0, 1, 1, 'text')
      ).toThrow();
    });

    it('should throw on invalid page range', () => {
      expect(() =>
        DocumentSectionFactory.create('Title', 1, 5, 3, 'text')
      ).toThrow();
    });

    it('should support parent-child relationships', () => {
      DocumentSectionFactory.reset();

      const parentSection = DocumentSectionFactory.create(
        'Chapter 1',
        1,
        1,
        5,
        'content'
      );

      const childSection = DocumentSectionFactory.create(
        'Section 1.1',
        2,
        1,
        3,
        'content',
        { parentSectionId: parentSection.sectionId }
      );

      expect(childSection.parentSectionId).toBe(parentSection.sectionId);
    });
  });

  // ==================== DocumentTable Tests ====================

  describe('DocumentTable', () => {
    it('should create document table', () => {
      const rows = [
        ['Header 1', 'Header 2'],
        ['Value 1', 'Value 2'],
        ['Value 3', 'Value 4'],
      ];

      const table = DocumentTableFactory.create(1, rows, { hasHeaderRow: true });

      expect(table.pageNumber).toBe(1);
      expect(table.rowCount).toBe(3);
      expect(table.columnCount).toBe(2);
      expect(table.hasHeaderRow).toBe(true);
      expect(table.estimatedDataRows).toBe(2); // 3 rows - 1 header
    });

    it('should throw on empty rows', () => {
      expect(() => DocumentTableFactory.create(1, [])).toThrow();
      expect(() => DocumentTableFactory.create(1, [[], []])).toThrow();
    });

    it('should throw on inconsistent column count', () => {
      const rows = [
        ['Col1', 'Col2'],
        ['Val1', 'Val2', 'Extra'],
      ];

      expect(() => DocumentTableFactory.create(1, rows)).toThrow();
    });

    it('should extract header row', () => {
      const rows = [
        ['Name', 'Age', 'City'],
        ['John', '30', 'Berlin'],
        ['Jane', '28', 'Munich'],
      ];

      const table = DocumentTableFactory.create(1, rows, { hasHeaderRow: true });

      expect(table.headerRow).toEqual(['Name', 'Age', 'City']);
    });

    it('should reset counter for testing', () => {
      DocumentTableFactory.reset();

      const table1 = DocumentTableFactory.create(1, [['A', 'B']]);
      const table2 = DocumentTableFactory.create(1, [['C', 'D']]);

      expect(table1.tableId).toBe('table_0001');
      expect(table2.tableId).toBe('table_0002');
    });
  });

  // ==================== DocumentMetadata Tests ====================

  describe('DocumentMetadata', () => {
    it('should create metadata for PDF', () => {
      const metadata = DocumentMetadataFactory.createForPdf(
        'document.pdf',
        102400
      );

      expect(metadata.filename).toBe('document.pdf');
      expect(metadata.sourceType).toBe('pdf');
      expect(metadata.mimeType).toBe('application/pdf');
      expect(metadata.fileSizeBytes).toBe(102400);
    });

    it('should create metadata for HTML', () => {
      const metadata = DocumentMetadataFactory.createForHtml(
        'page.html',
        51200
      );

      expect(metadata.sourceType).toBe('html');
      expect(metadata.mimeType).toBe('text/html');
    });

    it('should create metadata for DOCX', () => {
      const metadata = DocumentMetadataFactory.createForDocx(
        'document.docx',
        204800
      );

      expect(metadata.sourceType).toBe('docx');
      expect(metadata.mimeType).toContain('wordprocessingml');
    });

    it('should throw on invalid filename', () => {
      expect(() =>
        DocumentMetadataFactory.create('', 'pdf', 1000)
      ).toThrow();
    });

    it('should throw on negative file size', () => {
      expect(() =>
        DocumentMetadataFactory.create('file.pdf', 'pdf', -1)
      ).toThrow();
    });

    it('should estimate reading time', () => {
      const timeMinutes = DocumentMetadataFactory.estimateReadingTime(2000);
      expect(timeMinutes).toBe(10); // 2000 words / 200 wpm
    });
  });

  // ==================== UnifiedDocument Tests ====================

  describe('UnifiedDocument', () => {
    let metadata: DocumentMetadata;
    let page1: DocumentPage;
    let page2: DocumentPage;

    beforeEach(() => {
      metadata = DocumentMetadataFactory.createForPdf('test.pdf', 10000);
      page1 = DocumentPageFactory.create(1, 'Page 1 content');
      page2 = DocumentPageFactory.create(2, 'Page 2 content');
    });

    it('should create unified document', () => {
      const doc = UnifiedDocument.create(metadata, [page1, page2]);

      expect(doc.getId().toString()).toMatch(/^DOC-/);
      expect(doc.getPageCount()).toBe(2);
      expect(doc.getMetadata().sourceType).toBe('pdf');
    });

    it('should throw on empty pages', () => {
      expect(() => UnifiedDocument.create(metadata, [])).toThrow();
    });

    it('should get raw text from all pages', () => {
      const doc = UnifiedDocument.create(metadata, [page1, page2]);
      const text = doc.getRawText();

      expect(text).toContain('Page 1 content');
      expect(text).toContain('Page 2 content');
    });

    it('should calculate word count', () => {
      const doc = UnifiedDocument.create(metadata, [page1, page2]);
      const wordCount = doc.getWordCount();

      expect(wordCount).toBe(6); // "Page 1 content" (3) + "Page 2 content" (3) = 6 words
    });

    it('should check if document has content', () => {
      const emptyPage = DocumentPageFactory.createEmpty(1);
      const docEmpty = UnifiedDocument.create(metadata, [emptyPage]);
      const docWithContent = UnifiedDocument.create(metadata, [page1]);

      expect(docEmpty.hasContent()).toBe(false);
      expect(docWithContent.hasContent()).toBe(true);
    });

    it('should add sections', () => {
      const doc = UnifiedDocument.create(metadata, [page1, page2]);
      const section = DocumentSectionFactory.create(
        'Chapter 1',
        1,
        1,
        2,
        'content'
      );

      doc.addSection(section);

      expect(doc.getSections().length).toBe(1);
      expect(doc.hasSections()).toBe(true);
    });

    it('should throw on adding section with invalid page', () => {
      const doc = UnifiedDocument.create(metadata, [page1]);
      const section = DocumentSectionFactory.create(
        'Chapter 1',
        1,
        1,
        5, // Invalid page number
        'content'
      );

      expect(() => doc.addSection(section)).toThrow();
    });

    it('should add tables', () => {
      const doc = UnifiedDocument.create(metadata, [page1]);
      const table = DocumentTableFactory.create(1, [['A', 'B'], ['1', '2']]);

      doc.addTable(table);

      expect(doc.getTables().length).toBe(1);
      expect(doc.hasTables()).toBe(true);
    });

    it('should generate summary', () => {
      const section = DocumentSectionFactory.create('Intro', 1, 1, 1, 'text');
      const table = DocumentTableFactory.create(1, [['A'], ['B']]);

      const doc = UnifiedDocument.create(metadata, [page1, page2], {
        sections: [section],
        tables: [table],
      });

      const summary = doc.getSummary();

      expect(summary.pageCount).toBe(2);
      expect(summary.sectionCount).toBe(1);
      expect(summary.tableCount).toBe(1);
      expect(summary.wordCount).toBeGreaterThan(0);
      expect(summary.hasContent).toBe(true);
    });

    it('should serialize to object', () => {
      const doc = UnifiedDocument.create(metadata, [page1]);
      const obj = doc.toObject();

      expect(obj.documentId).toMatch(/^DOC-/);
      expect(obj.pages.length).toBe(1);
      expect(obj.metadata).toBeDefined();
      expect(obj.createdAt).toBeDefined();
    });

    it('should restore from serialized state', () => {
      const docId = DocumentId.create();
      const restored = UnifiedDocument.restore(
        docId,
        metadata,
        [page1, page2],
        undefined,
        undefined,
        '2026-07-11T10:00:00Z',
        '2026-07-11T10:30:00Z'
      );

      expect(restored.getId().equals(docId)).toBe(true);
      expect(restored.getPageCount()).toBe(2);
      expect(restored.getCreatedAt()).toBe('2026-07-11T10:00:00Z');
    });
  });
});
