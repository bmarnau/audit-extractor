/**
 * ParserFactory Tests
 */

import { ParserFactory, ParsingError } from '@infrastructure/parsers';

describe('ParserFactory', () => {
  describe('getParser', () => {
    it('should return PdfParser for .pdf files', () => {
      const parser = ParserFactory.getParser('document.pdf');
      expect(parser.getSupportedFormat()).toBe('pdf');
    });

    it('should return DocxParser for .docx files', () => {
      const parser = ParserFactory.getParser('document.docx');
      expect(parser.getSupportedFormat()).toBe('docx');
    });

    it('should return HtmlParser for .html files', () => {
      const parser = ParserFactory.getParser('page.html');
      expect(parser.getSupportedFormat()).toBe('html');
    });

    it('should return HtmlParser for .htm files', () => {
      const parser = ParserFactory.getParser('page.htm');
      expect(parser.getSupportedFormat()).toBe('html');
    });

    it('should throw ParsingError for unsupported formats', () => {
      expect(() => ParserFactory.getParser('document.txt')).toThrow(ParsingError);
      expect(() => ParserFactory.getParser('document.unknown')).toThrow(ParsingError);
    });

    it('should handle filenames with paths', () => {
      const parser = ParserFactory.getParser('/path/to/document.pdf');
      expect(parser.getSupportedFormat()).toBe('pdf');
    });

    it('should be case-insensitive', () => {
      const parser1 = ParserFactory.getParser('document.PDF');
      const parser2 = ParserFactory.getParser('document.Pdf');
      expect(parser1.getSupportedFormat()).toBe('pdf');
      expect(parser2.getSupportedFormat()).toBe('pdf');
    });
  });

  describe('isSupported', () => {
    it('should return true for supported formats', () => {
      expect(ParserFactory.isSupported('doc.pdf')).toBe(true);
      expect(ParserFactory.isSupported('doc.docx')).toBe(true);
      expect(ParserFactory.isSupported('page.html')).toBe(true);
    });

    it('should return false for unsupported formats', () => {
      expect(ParserFactory.isSupported('doc.txt')).toBe(false);
      expect(ParserFactory.isSupported('doc.xlsx')).toBe(false);
    });
  });

  describe('getSupportedFormats', () => {
    it('should return array of supported formats', () => {
      const formats = ParserFactory.getSupportedFormats();
      expect(formats).toContain('pdf');
      expect(formats).toContain('docx');
      expect(formats).toContain('html');
    });

    it('should not be empty', () => {
      const formats = ParserFactory.getSupportedFormats();
      expect(formats.length).toBeGreaterThan(0);
    });
  });

  describe('getParsers', () => {
    it('should return array of all parsers', () => {
      const parsers = ParserFactory.getParsers();
      expect(parsers.length).toBeGreaterThanOrEqual(3); // Min. 3 Parser
    });

    it('should return new array each time', () => {
      const parsers1 = ParserFactory.getParsers();
      const parsers2 = ParserFactory.getParsers();
      expect(parsers1).not.toBe(parsers2); // Verschiedene Array-Instanzen
    });
  });

  describe('parse', () => {
    it('should reject unsupported file types', async () => {
      const buffer = Buffer.from('test');
      await expect(ParserFactory.parse(buffer, 'file.txt')).rejects.toThrow(ParsingError);
    });
  });

  describe('No Data Generation', () => {
    it('should not auto-fill unsupported formats', () => {
      // Factory sollte NICHT erfundene Parser zurückgeben
      const unsupportedFormats = ['xlsx', 'txt', 'csv', 'xml', 'pptx'];
      for (const fmt of unsupportedFormats) {
        expect(() => ParserFactory.getParser(`file.${fmt}`)).toThrow();
      }
    });
  });
});
