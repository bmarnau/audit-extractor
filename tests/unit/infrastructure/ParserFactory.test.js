"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parsers_1 = require("@infrastructure/parsers");
describe('ParserFactory', () => {
    describe('getParser', () => {
        it('should return PdfParser for .pdf files', () => {
            const parser = parsers_1.ParserFactory.getParser('document.pdf');
            expect(parser.getSupportedFormat()).toBe('pdf');
        });
        it('should return DocxParser for .docx files', () => {
            const parser = parsers_1.ParserFactory.getParser('document.docx');
            expect(parser.getSupportedFormat()).toBe('docx');
        });
        it('should return HtmlParser for .html files', () => {
            const parser = parsers_1.ParserFactory.getParser('page.html');
            expect(parser.getSupportedFormat()).toBe('html');
        });
        it('should return HtmlParser for .htm files', () => {
            const parser = parsers_1.ParserFactory.getParser('page.htm');
            expect(parser.getSupportedFormat()).toBe('html');
        });
        it('should throw ParsingError for unsupported formats', () => {
            expect(() => parsers_1.ParserFactory.getParser('document.txt')).toThrow(parsers_1.ParsingError);
            expect(() => parsers_1.ParserFactory.getParser('document.unknown')).toThrow(parsers_1.ParsingError);
        });
        it('should handle filenames with paths', () => {
            const parser = parsers_1.ParserFactory.getParser('/path/to/document.pdf');
            expect(parser.getSupportedFormat()).toBe('pdf');
        });
        it('should be case-insensitive', () => {
            const parser1 = parsers_1.ParserFactory.getParser('document.PDF');
            const parser2 = parsers_1.ParserFactory.getParser('document.Pdf');
            expect(parser1.getSupportedFormat()).toBe('pdf');
            expect(parser2.getSupportedFormat()).toBe('pdf');
        });
    });
    describe('isSupported', () => {
        it('should return true for supported formats', () => {
            expect(parsers_1.ParserFactory.isSupported('doc.pdf')).toBe(true);
            expect(parsers_1.ParserFactory.isSupported('doc.docx')).toBe(true);
            expect(parsers_1.ParserFactory.isSupported('page.html')).toBe(true);
        });
        it('should return false for unsupported formats', () => {
            expect(parsers_1.ParserFactory.isSupported('doc.txt')).toBe(false);
            expect(parsers_1.ParserFactory.isSupported('doc.xlsx')).toBe(false);
        });
    });
    describe('getSupportedFormats', () => {
        it('should return array of supported formats', () => {
            const formats = parsers_1.ParserFactory.getSupportedFormats();
            expect(formats).toContain('pdf');
            expect(formats).toContain('docx');
            expect(formats).toContain('html');
        });
        it('should not be empty', () => {
            const formats = parsers_1.ParserFactory.getSupportedFormats();
            expect(formats.length).toBeGreaterThan(0);
        });
    });
    describe('getParsers', () => {
        it('should return array of all parsers', () => {
            const parsers = parsers_1.ParserFactory.getParsers();
            expect(parsers.length).toBeGreaterThanOrEqual(3);
        });
        it('should return new array each time', () => {
            const parsers1 = parsers_1.ParserFactory.getParsers();
            const parsers2 = parsers_1.ParserFactory.getParsers();
            expect(parsers1).not.toBe(parsers2);
        });
    });
    describe('parse', () => {
        it('should reject unsupported file types', async () => {
            const buffer = Buffer.from('test');
            await expect(parsers_1.ParserFactory.parse(buffer, 'file.txt')).rejects.toThrow(parsers_1.ParsingError);
        });
    });
    describe('No Data Generation', () => {
        it('should not auto-fill unsupported formats', () => {
            const unsupportedFormats = ['xlsx', 'txt', 'csv', 'xml', 'pptx'];
            for (const fmt of unsupportedFormats) {
                expect(() => parsers_1.ParserFactory.getParser(`file.${fmt}`)).toThrow();
            }
        });
    });
});
//# sourceMappingURL=ParserFactory.test.js.map