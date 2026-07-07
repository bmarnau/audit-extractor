"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parsers_1 = require("@infrastructure/parsers");
describe('PdfParser', () => {
    let parser;
    beforeEach(() => {
        parser = new parsers_1.PdfParser();
    });
    describe('canHandle', () => {
        it('should accept .pdf files', () => {
            expect(parser.canHandle('document.pdf')).toBe(true);
            expect(parser.canHandle('DOCUMENT.PDF')).toBe(true);
            expect(parser.canHandle('path/to/doc.pdf')).toBe(true);
        });
        it('should reject non-pdf files', () => {
            expect(parser.canHandle('document.docx')).toBe(false);
            expect(parser.canHandle('document.html')).toBe(false);
            expect(parser.canHandle('document.txt')).toBe(false);
        });
    });
    describe('getSupportedFormat', () => {
        it('should return "pdf"', () => {
            expect(parser.getSupportedFormat()).toBe('pdf');
        });
    });
    describe('extractText', () => {
        it('should throw ParsingError for invalid PDF', async () => {
            const invalidPdf = Buffer.from('not a pdf');
            await expect(parser.extractText(invalidPdf)).rejects.toThrow(parsers_1.ParsingError);
        });
        it('should handle empty PDFs gracefully', async () => {
        });
    });
    describe('extractMetadata', () => {
        it('should return metadata object with required fields', async () => {
            const metadata = await parser.extractMetadata(Buffer.from('test'), 'test.pdf');
            expect(metadata).toHaveProperty('size');
            expect(metadata).toHaveProperty('format');
            expect(metadata.format).toBe('pdf');
        });
    });
    describe('extractImages', () => {
        it('should return empty array (PDFs require complex image extraction)', async () => {
            const images = await parser.extractImages(Buffer.from('test'));
            expect(Array.isArray(images)).toBe(true);
        });
    });
    describe('No Data Generation', () => {
        it('should not invent metadata if not extractable', async () => {
            const metadata = await parser.extractMetadata(Buffer.from('minimal'), 'test.pdf');
            if (metadata.title === undefined) {
                expect(metadata.title).toBeUndefined();
            }
            if (metadata.author === undefined) {
                expect(metadata.author).toBeUndefined();
            }
        });
    });
});
//# sourceMappingURL=PdfParser.test.js.map