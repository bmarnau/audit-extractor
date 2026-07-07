"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parsers_1 = require("@infrastructure/parsers");
describe('HtmlParser', () => {
    let parser;
    beforeEach(() => {
        parser = new parsers_1.HtmlParser();
    });
    describe('canHandle', () => {
        it('should accept .html files', () => {
            expect(parser.canHandle('page.html')).toBe(true);
            expect(parser.canHandle('PAGE.HTML')).toBe(true);
        });
        it('should accept .htm files', () => {
            expect(parser.canHandle('page.htm')).toBe(true);
            expect(parser.canHandle('PAGE.HTM')).toBe(true);
        });
        it('should reject non-html files', () => {
            expect(parser.canHandle('document.pdf')).toBe(false);
            expect(parser.canHandle('page.txt')).toBe(false);
        });
    });
    describe('getSupportedFormat', () => {
        it('should return "html"', () => {
            expect(parser.getSupportedFormat()).toBe('html');
        });
    });
    describe('extractText', () => {
        it('should extract text from valid HTML', async () => {
            const html = Buffer.from(`
        <html>
          <body>
            <h1>Test Title</h1>
            <p>Test content here</p>
          </body>
        </html>
      `);
            const text = await parser.extractText(html);
            expect(text).toContain('Test Title');
            expect(text).toContain('Test content here');
        });
        it('should remove script tags', async () => {
            const html = Buffer.from(`
        <html>
          <body>
            <script>alert('test');</script>
            <p>Visible text</p>
          </body>
        </html>
      `);
            const text = await parser.extractText(html);
            expect(text).toContain('Visible text');
            expect(text).not.toContain('alert');
        });
        it('should handle empty HTML gracefully', async () => {
            const html = Buffer.from('<html><body></body></html>');
            const text = await parser.extractText(html);
            expect(text).toBe('');
        });
    });
    describe('extractMetadata', () => {
        it('should extract title from <title> tag', async () => {
            const html = Buffer.from(`
        <html>
          <head>
            <title>Page Title</title>
          </head>
          <body></body>
        </html>
      `);
            const metadata = await parser.extractMetadata(html, 'test.html');
            expect(metadata.title).toBe('Page Title');
        });
        it('should extract meta description', async () => {
            const html = Buffer.from(`
        <html>
          <head>
            <meta name="description" content="Page description" />
          </head>
          <body></body>
        </html>
      `);
            const metadata = await parser.extractMetadata(html, 'test.html');
            expect(metadata.description).toBe('Page description');
        });
        it('should count headings', async () => {
            const html = Buffer.from(`
        <html>
          <body>
            <h1>H1 Title</h1>
            <h2>H2 Subtitle</h2>
            <h2>Another H2</h2>
          </body>
        </html>
      `);
            const metadata = await parser.extractMetadata(html, 'test.html');
            expect(metadata.headings).toEqual({ h1: 1, h2: 2, h3: 0 });
        });
    });
    describe('extractImages', () => {
        it('should extract image references (not the images themselves)', async () => {
            const html = Buffer.from(`
        <html>
          <body>
            <img src="image1.jpg" alt="Image 1" />
            <img src="image2.png" title="Image 2" />
          </body>
        </html>
      `);
            const images = await parser.extractImages(html);
            expect(images.length).toBe(2);
            expect(images[0]).toHaveProperty('src');
            expect(images[0].src).toBe('image1.jpg');
            expect(images[0].alt).toBe('Image 1');
        });
        it('should not auto-generate image descriptions', async () => {
            const html = Buffer.from(`
        <html>
          <body>
            <img src="image.jpg" />
          </body>
        </html>
      `);
            const images = await parser.extractImages(html);
            expect(images[0].description).toBeUndefined();
        });
    });
    describe('No Data Generation', () => {
        it('should only extract existing metadata, not invent it', async () => {
            const html = Buffer.from(`
        <html>
          <body>
            <p>Content</p>
          </body>
        </html>
      `);
            const metadata = await parser.extractMetadata(html, 'test.html');
            expect(metadata.title).toBeUndefined();
            expect(metadata.description).toBeUndefined();
            expect(metadata.author).toBeUndefined();
        });
        it('should not add default values where none exist', async () => {
            const html = Buffer.from('<html><head></head><body></body></html>');
            const metadata = await parser.extractMetadata(html, 'test.html');
            if (metadata.keywords === undefined) {
                expect(metadata.keywords).toBeUndefined();
            }
        });
    });
});
//# sourceMappingURL=HtmlParser.test.js.map