/**
 * TxtDocumentAdapter - Adapter for TXT documents
 *
 * Loads plain text files and converts them to UnifiedDocument.
 *
 * Features:
 * - Line-based pagination (configurable lines per page)
 * - Character encoding detection
 * - Metadata extraction from content
 * - Section/heading detection
 * - Error handling & validation
 *
 * @version 0.24.0
 * @phase 24 - Extended Adapters & Job Manager
 */

import { readFile, stat } from 'fs/promises';
import { extname } from 'path';

import { DocumentAdapter, DocumentAdapterError, DocumentAdapterOptions } from '@domain/document/DocumentAdapter';
import { UnifiedDocument } from '@domain/document/UnifiedDocument';
import { DocumentMetadataFactory } from '@domain/document/DocumentMetadata';
import { DocumentPage, DocumentPageFactory } from '@domain/document/DocumentPage';
import { DocumentSection, DocumentSectionFactory } from '@domain/document/DocumentSection';

/**
 * TxtDocumentAdapter - Implementation
 */
export class TxtDocumentAdapter implements DocumentAdapter {
  private readonly maxFileSize: number = 100 * 1024 * 1024; // 100MB default
  private readonly linesPerPage: number = 100; // Configurable

  /**
   * Check if adapter can handle this file
   */
  canHandle(filePath: string): boolean {
    const ext = extname(filePath).toLowerCase();
    return ext === '.txt';
  }

  /**
   * Get adapter name
   */
  getName(): string {
    return 'TxtDocumentAdapter';
  }

  /**
   * Get supported MIME types
   */
  getSupportedMimeTypes(): string[] {
    return ['text/plain'];
  }

  /**
   * Validate TXT before loading
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

      if (fileStats.size > this.maxFileSize) {
        throw DocumentAdapterError.validation(
          `TXT file is too large: ${fileStats.size} bytes (max: ${this.maxFileSize} bytes)`,
          this.getName(),
          { fileSize: fileStats.size, maxSize: this.maxFileSize }
        );
      }

      if (fileStats.size === 0) {
        throw DocumentAdapterError.validation(
          `TXT file is empty: ${filePath}`,
          this.getName()
        );
      }

      if (!this.canHandle(filePath)) {
        throw DocumentAdapterError.validation(
          `File is not a TXT: ${filePath}`,
          this.getName()
        );
      }
    } catch (error) {
      if (error instanceof DocumentAdapterError) {
        throw error;
      }

      throw DocumentAdapterError.validation(
        `Validation failed: ${(error as Error).message}`,
        this.getName()
      );
    }
  }

  /**
   * Load TXT and convert to UnifiedDocument
   */
  async load(filePath: string, options?: DocumentAdapterOptions): Promise<UnifiedDocument> {
    try {
      await this.validate(filePath);

      const buffer = await readFile(filePath);
      let fullText = this.detectEncoding(buffer);

      // Normalize line endings
      fullText = fullText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      // Split into pages based on lines
      const pages = this.parsePages(fullText);

      // Extract metadata
      const fileStats = await stat(filePath);
      const metadata = DocumentMetadataFactory.create(
        filePath,
        'txt',
        fileStats.size,
        {
          language: options?.language || 'unknown',
          title: this.extractTitle(fullText),
          encoding: 'UTF-8',
        }
      );

      // Extract sections if structured
      const sections = this.detectStructuredSections(fullText);

      // Create unified document
      return UnifiedDocument.create(metadata, pages, { sections: sections.length > 0 ? sections : undefined });
    } catch (error) {
      if (error instanceof DocumentAdapterError) {
        throw error;
      }

      throw DocumentAdapterError.loading(
        `Failed to load TXT: ${(error as Error).message}`,
        this.getName()
      );
    }
  }

  /**
   * Detect character encoding
   */
  private detectEncoding(buffer: Buffer): string {
    try {
      // Try UTF-8 first
      return buffer.toString('utf8');
    } catch {
      try {
        // Fallback to Latin-1
        return buffer.toString('latin1');
      } catch {
        // Fallback to ASCII
        return buffer.toString('ascii');
      }
    }
  }

  /**
   * Parse TXT into pages based on line count
   */
  private parsePages(fullText: string): DocumentPage[] {
    const lines = fullText.split('\n');
    const pages: DocumentPage[] = [];

    let currentPageLines: string[] = [];
    let pageNumber = 1;

    for (const line of lines) {
      currentPageLines.push(line);

      if (currentPageLines.length >= this.linesPerPage) {
        const pageText = currentPageLines.join('\n');
        pages.push(
          DocumentPageFactory.create(pageNumber, pageText, {
            encoding: 'UTF-8',
            textConfidence: 1.0, // Plain text has perfect confidence
            isScanImage: false,
          })
        );
        currentPageLines = [];
        pageNumber++;
      }
    }

    // Add final page
    if (currentPageLines.length > 0) {
      const pageText = currentPageLines.join('\n');
      pages.push(
        DocumentPageFactory.create(pageNumber, pageText, {
          encoding: 'UTF-8',
          textConfidence: 1.0,
          isScanImage: false,
        })
      );
    }

    return pages;
  }

  /**
   * Extract title from first non-empty line or use filename
   */
  private extractTitle(text: string): string {
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 0 && trimmed.length < 200) {
        return trimmed;
      }
    }
    return 'Untitled';
  }

  /**
   * Detect structured sections (chapters, sections, etc.)
   */
  private detectStructuredSections(fullText: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = fullText.split('\n');

    let lineCount = 0;
    let currentPage = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Update page count based on lines per page
      currentPage = Math.ceil((lineCount + 1) / this.linesPerPage) || 1;

      // Detect chapter headers (ALL CAPS on their own line)
      if (line.length > 5 && line.length < 80 && /^[A-Z\s]+$/.test(line) && line.split(' ').length < 8) {
        const section = DocumentSectionFactory.create(
          line,
          1,
          currentPage,
          currentPage,
          line, // Content is the heading itself initially
          { hasImages: false, hasTable: false }
        );
        sections.push(section);
      }

      lineCount++;
    }

    return sections;
  }
}
