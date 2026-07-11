/**
 * HtmlDocumentAdapter - Adapter for HTML documents
 *
 * Loads HTML files and converts them to UnifiedDocument.
 * Analyzes DOM structure to identify sections, tables, and links.
 *
 * Features:
 * - h1-h6 heading hierarchy
 * - Table detection & extraction
 * - List processing (ul, ol)
 * - Link preservation
 * - Metadata extraction from HTML meta tags
 * - Clean text extraction
 *
 * @version 0.23.0
 * @phase 23 - Extraction Pipeline & UnifiedDocument
 */

import { readFile, stat } from 'fs/promises';
import { extname } from 'path';
import * as cheerio from 'cheerio';

import { DocumentAdapter, DocumentAdapterError, DocumentAdapterOptions } from '@domain/document/DocumentAdapter';
import { UnifiedDocument } from '@domain/document/UnifiedDocument';
import { DocumentMetadata, DocumentMetadataFactory } from '@domain/document/DocumentMetadata';
import { DocumentPageFactory } from '@domain/document/DocumentPage';
import { DocumentSection, DocumentSectionFactory, DocumentTableFactory } from '@domain/document/DocumentSection';

/**
 * HtmlDocumentAdapter - Implementation
 */
export class HtmlDocumentAdapter implements DocumentAdapter {
  private readonly maxPageSize: number = 50 * 1024 * 1024; // 50MB for HTML

  /**
   * Check if adapter can handle this file
   */
  canHandle(filePath: string): boolean {
    const ext = extname(filePath).toLowerCase();
    return ext === '.html' || ext === '.htm';
  }

  /**
   * Get adapter name
   */
  getName(): string {
    return 'HtmlDocumentAdapter';
  }

  /**
   * Get supported MIME types
   */
  getSupportedMimeTypes(): string[] {
    return ['text/html', 'application/xhtml+xml'];
  }

  /**
   * Validate HTML file before loading
   */
  async validate(filePath: string): Promise<void> {
    try {
      const fileStats = await stat(filePath);

      if (!fileStats.isFile()) {
        throw DocumentAdapterError.validation(
          `Path is not a file: ${filePath}`,
          this.getName()
        );
      }

      if (fileStats.size > this.maxPageSize) {
        throw DocumentAdapterError.validation(
          `HTML file is too large: ${fileStats.size} bytes (max: ${this.maxPageSize} bytes)`,
          this.getName(),
          { fileSize: fileStats.size, maxSize: this.maxPageSize }
        );
      }

      if (fileStats.size === 0) {
        throw DocumentAdapterError.validation(
          `HTML file is empty: ${filePath}`,
          this.getName()
        );
      }

      if (!this.canHandle(filePath)) {
        throw DocumentAdapterError.validation(
          `File is not HTML: ${filePath}`,
          this.getName()
        );
      }
    } catch (error) {
      if (error instanceof DocumentAdapterError) {
        throw error;
      }

      throw DocumentAdapterError.validation(
        `HTML validation failed: ${(error as Error).message}`,
        this.getName()
      );
    }
  }

  /**
   * Load HTML and convert to UnifiedDocument
   */
  async load(
    filePath: string,
    options?: DocumentAdapterOptions
  ): Promise<UnifiedDocument> {
    try {
      await this.validate(filePath);

      const htmlContent = await readFile(filePath, 'utf-8');
      const $ = cheerio.load(htmlContent);

      // Extract metadata
      const fileStats = await stat(filePath);
      const filename = filePath.split('/').pop() || 'document.html';
      const metadata = this.extractMetadata(filename, $, fileStats.size, options);

      // Since HTML is typically single-page in display, treat as one page
      const rawText = this.extractRawText($);
      const page = DocumentPageFactory.create(1, rawText, {
        encoding: 'UTF-8',
        textConfidence: rawText.length > 100 ? 0.95 : 0.7,
        isScanImage: false,
        extractionDurationMs: 0,
      });

      // Extract sections from heading hierarchy
      const sections = options?.includeSections !== false ? this.extractSections($, 1) : [];

      // Extract tables
      const tables = options?.includeTables !== false ? this.extractTables($, 1) : [];

      // Create UnifiedDocument
      const document = UnifiedDocument.create(metadata, [page], {
        sections,
        tables,
      });

      return document;
    } catch (error) {
      if (error instanceof DocumentAdapterError) {
        throw error;
      }

      throw DocumentAdapterError.loading(
        `Failed to load HTML: ${(error as Error).message}`,
        this.getName(),
        error as Error,
        { filePath }
      );
    }
  }

  /**
   * Extract metadata from HTML
   */
  private extractMetadata(
    filename: string,
    $: cheerio.CheerioAPI,
    fileSizeBytes: number,
    options?: DocumentAdapterOptions
  ): DocumentMetadata {
    // Extract from meta tags
    const title = $('meta[property="og:title"]').attr('content') ||
                  $('meta[name="title"]').attr('content') ||
                  $('title').text() ||
                  filename;

    const description = $('meta[name="description"]').attr('content');
    const author = $('meta[name="author"]').attr('content');
    const keywords = $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim());

    return DocumentMetadataFactory.createForHtml(filename, fileSizeBytes, {
      title,
      subject: description,
      author,
      keywords,
      language: options?.language,
    });
  }

  /**
   * Extract clean raw text from HTML
   */
  private extractRawText($: cheerio.CheerioAPI): string {
    // Remove script and style elements
    $('script, style, noscript').remove();

    // Extract body text or full content
    const content = $('body').length > 0 ? $('body') : $('html');
    const text = content.text();

    // Clean up whitespace
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');
  }

  /**
   * Extract sections from heading hierarchy
   */
  private extractSections($: cheerio.CheerioAPI, pageNumber: number): DocumentSection[] {
    const sections: DocumentSection[] = [];
    let currentSection: DocumentSection | null = null;
    let sectionText = '';

    // Find all headings (h1-h6)
    const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

    $('body').children().each((_, elem) => {
      const $elem = $(elem);
      const tagName = $elem.prop('tagName')?.toLowerCase();

      // Check if it's a heading
      if (tagName && headings.includes(tagName)) {
        // Save previous section
        if (currentSection) {
          currentSection = {
            ...currentSection,
            content: sectionText,
            contentLength: sectionText.length,
          };
          sections.push(currentSection);
        }

        // Create new section
        const level = parseInt(tagName.charAt(1), 10);
        const title = $elem.text().trim();
        sectionText = '';

        currentSection = DocumentSectionFactory.create(
          title,
          level,
          pageNumber,
          pageNumber,
          '' // Initial empty content
        );
      } else if (currentSection) {
        // Add content to current section
        sectionText += '\n' + $elem.text().trim();
      }
    });

    // Save last section
    if (currentSection) {
      // Create new section object with updated content
      const section = currentSection as DocumentSection;
      const finalSection = DocumentSectionFactory.create(
        section.title,
        section.level,
        section.startPageNumber,
        section.endPageNumber,
        sectionText,
        { parentSectionId: section.parentSectionId }
      );
      sections.push(finalSection);
    }

    return sections;
  }

  /**
   * Extract tables from HTML
   */
  private extractTables($: cheerio.CheerioAPI, pageNumber: number): ReturnType<typeof DocumentTableFactory.create>[] {
    const tables: ReturnType<typeof DocumentTableFactory.create>[] = [];
    let tablePosition = 0;

    $('table').each((_, table) => {
      tablePosition++;
      const $table = $(table);

      // Extract rows
      const rows: string[][] = [];

      $table.find('tr').each((_, tr) => {
        const row: string[] = [];

        $(tr)
          .find('th, td')
          .each((_, cell) => {
            const text = $(cell).text().trim();
            row.push(text);
          });

        if (row.length > 0) {
          rows.push(row);
        }
      });

      if (rows.length > 0) {
        // Detect if first row is header (typically contains text, not numbers)
        const hasHeaderRow = rows[0].some((cell) => !/^\d+$/.test(cell));

        try {
          const docTable = DocumentTableFactory.create(pageNumber, rows, {
            position: tablePosition,
            hasHeaderRow,
          });

          tables.push(docTable);
        } catch (error) {
          // Skip malformed tables
          console.warn(`Failed to create table at position ${tablePosition}:`, error);
        }
      }
    });

    return tables;
  }
}
