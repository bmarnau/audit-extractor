/**
 * HtmlParser
 *
 * Parsed HTML-Dokumente mit cheerio.
 * Extrahiert: Text, Struktur, Metadaten, Links, Images.
 */

import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { ParsingError } from './DocumentParser';

/**
 * Parser für HTML-Dokumente.
 */
export class HtmlParser extends BaseParser {
  /**
   * Prüft, ob Datei eine HTML ist.
   */
  canHandle(fileName: string): boolean {
    const lower = fileName.toLowerCase();
    return lower.endsWith('.html') || lower.endsWith('.htm');
  }

  /**
   * Gibt Format zurück.
   */
  getSupportedFormat(): string {
    return 'html';
  }

  /**
   * Extrahiert nur Text aus HTML.
   */
  async extractText(fileBuffer: Buffer): Promise<string> {
    try {
      const html = fileBuffer.toString('utf-8');
      const $ = cheerio.load(html);

      // Entferne Script und Style Tags
      $('script, style').remove();

      // Extrahiere Text
      const text = $('body').text();

      if (!text || text.trim().length === 0) {
        console.warn('HTML contains no extractable text');
        return '';
      }

      // Normalisiere Whitespace
      return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n');
    } catch (error) {
      throw new ParsingError(
        `Failed to extract text from HTML`,
        undefined,
        'html',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Extrahiert Metadaten aus HTML.
   */
  async extractMetadata(fileBuffer: Buffer, fileName: string): Promise<Record<string, unknown>> {
    try {
      const html = fileBuffer.toString('utf-8');
      const $ = cheerio.load(html);

      // Extrahiere Meta-Tags
      const title = $('title').text();
      const description = $('meta[name="description"]').attr('content');
      const keywords = $('meta[name="keywords"]').attr('content');
      const author = $('meta[name="author"]').attr('content');
      const charset = $('meta[charset]').attr('charset') || 'utf-8';

      return {
        ...super.extractMetadata(fileBuffer, fileName),
        title: title || undefined,
        description: description || undefined,
        keywords: keywords?.split(',').map((k) => k.trim()) || undefined,
        author: author || undefined,
        charset,
        language: $('html').attr('lang') || undefined,
        headings: {
          h1: $('h1').length,
          h2: $('h2').length,
          h3: $('h3').length,
        },
        links: $('a').length,
        images: $('img').length,
        tables: $('table').length,
      };
    } catch (error) {
      console.error('Failed to extract HTML metadata:', error);
      return super.extractMetadata(fileBuffer, fileName);
    }
  }

  /**
   * Extrahiert Image-Referenzen aus HTML.
   */
  async extractImages(fileBuffer: Buffer): Promise<Record<string, unknown>[]> {
    try {
      const html = fileBuffer.toString('utf-8');
      const $ = cheerio.load(html);

      const images: Record<string, unknown>[] = [];

      $('img').each((index, element) => {
        const $img = $(element);

        images.push({
          id: `image-${index}`,
          src: $img.attr('src'),
          alt: $img.attr('alt'), // Nur falls vorhanden!
          title: $img.attr('title'),
          width: parseInt($img.attr('width') ?? '0'),
          height: parseInt($img.attr('height') ?? '0'),
          format: 'reference', // Nur Referenz!
          path: $img.attr('src'),
          // NICHT: auto-generierte Beschreibung!
        });
      });

      return images;
    } catch (error) {
      console.error('Failed to extract images from HTML:', error);
      return [];
    }
  }

  /**
   * Überschreibt createChunks um HTML-Struktur zu respektieren.
   * @protected
   */
  protected createChunks(text: string, _fileName: string) {
    // Nutze Basis-Implementierung
    // Könnte hier HTML-Tags respektieren, aber für jetzt einfach Text-Chunks
    return super.createChunks(text, _fileName);
  }
}
