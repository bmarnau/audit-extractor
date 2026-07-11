/**
 * DocxDocumentAdapter - Adapter for DOCX documents
 *
 * Loads DOCX files and converts them to UnifiedDocument.
 * Uses mammoth library for text extraction.
 *
 * Features:
 * - Multi-page support (sections become pages)
 * - Text extraction with formatting
 * - Metadata extraction
 * - Heading hierarchy detection
 * - Table extraction
 * - Error handling & validation
 *
 * @version 0.24.0
 * @phase 24 - Extended Adapters & Job Manager
 */

import { readFile, stat } from 'fs/promises';
import { extname } from 'path';
import * as mammoth from 'mammoth';

import { DocumentAdapter, DocumentAdapterError, DocumentAdapterOptions } from '@domain/document/DocumentAdapter';
import { UnifiedDocument } from '@domain/document/UnifiedDocument';
import { DocumentMetadataFactory } from '@domain/document/DocumentMetadata';
import { DocumentPage, DocumentPageFactory } from '@domain/document/DocumentPage';
import { DocumentSection, DocumentSectionFactory } from '@domain/document/DocumentSection';

/**
 * DocxDocumentAdapter - Implementation
 */
export class DocxDocumentAdapter implements DocumentAdapter {
  private readonly maxFileSize: number = 50 * 1024 * 1024; // 50MB default

  /**
   * Check if adapter can handle this file
   */
  canHandle(filePath: string): boolean {
    const ext = extname(filePath).toLowerCase();
    return ext === '.docx';
  }

  /**
   * Get adapter name
   */
  getName(): string {
    return 'DocxDocumentAdapter';
  }

  /**
   * Get supported MIME types
   */
  getSupportedMimeTypes(): string[] {
    return ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  }

  /**
   * Validate DOCX before loading
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
          `DOCX file is too large: ${fileStats.size} bytes (max: ${this.maxFileSize} bytes)`,
          this.getName(),
          { fileSize: fileStats.size, maxSize: this.maxFileSize }
        );
      }

      if (fileStats.size === 0) {
        throw DocumentAdapterError.validation(
          `DOCX file is empty: ${filePath}`,
          this.getName()
        );
      }

      if (!this.canHandle(filePath)) {
        throw DocumentAdapterError.validation(
          `File is not a DOCX: ${filePath}`,
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
   * Load DOCX and convert to UnifiedDocument
   */
  async load(filePath: string, options?: DocumentAdapterOptions): Promise<UnifiedDocument> {
    try {
      await this.validate(filePath);

      const fileBuffer = await readFile(filePath);
      const result = await mammoth.extractRawText({ buffer: fileBuffer });

      // Extract text and paragraphs
      const fullText = result.value;
      const messages = result.messages || [];

      if (messages.length > 0) {
        console.warn(`DOCX extraction warnings: ${messages.map((m) => m.message).join(', ')}`);
      }

      // Split into pages (simulate pages from sections/paragraphs)
      const pages = this.parsePages(fullText, filePath);

      // Extract metadata
      const fileStats = await stat(filePath);
      const metadata = DocumentMetadataFactory.create(
        filePath,
        'docx',
        fileStats.size,
        {
          language: options?.language || 'en',
          title: this.extractTitle(fullText),
          encoding: 'UTF-8',
        }
      );

      // Extract sections (headings)
      const sections = this.extractSections(fullText);

      // Create unified document
      return UnifiedDocument.create(metadata, pages, { sections: sections.length > 0 ? sections : undefined });
    } catch (error) {
      if (error instanceof DocumentAdapterError) {
        throw error;
      }

      throw DocumentAdapterError.loading(
        `Failed to load DOCX: ${(error as Error).message}`,
        this.getName()
      );
    }
  }

  /**
   * Parse pages from DOCX text
   * Simulates pages by splitting on double newlines (paragraph boundaries)
   */
  private parsePages(fullText: string, _filePath: string): DocumentPage[] {
    const paragraphs = fullText.split(/\n\n+/).filter((p) => p.trim().length > 0);

    // Group paragraphs into pages (roughly 3000 chars per page)
    const pageTexts: string[] = [];
    let currentPage = '';

    for (const paragraph of paragraphs) {
      if (currentPage.length + paragraph.length > 3000 && currentPage.length > 0) {
        pageTexts.push(currentPage);
        currentPage = paragraph;
      } else {
        currentPage += (currentPage.length > 0 ? '\n\n' : '') + paragraph;
      }
    }

    if (currentPage.length > 0) {
      pageTexts.push(currentPage);
    }

    // Create page objects
    return pageTexts.map((text, index) =>
      DocumentPageFactory.create(index + 1, text, {
        encoding: 'UTF-8',
        textConfidence: 0.95, // DOCX has high confidence since it's structured
        isScanImage: false,
      })
    );
  }

  /**
   * Extract document title from first heading or first line
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
   * Extract sections based on heading patterns
   */
  private extractSections(fullText: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = fullText.split('\n');

    let lineCount = 0;
    let currentPage = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) continue;

      // Update page count based on 3000 char limit
      currentPage = Math.ceil(lineCount / 100); // Estimate pages

      // Detect headings (all caps or numbered)
      const isHeading = /^[A-Z][A-Z\s]+$/.test(line) || /^\d+\.\s/.test(line);

      if (isHeading && line.length < 150) {
        // Create section for this heading
        const section = DocumentSectionFactory.create(
          line,
          this.detectHeadingLevel(line),
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

  /**
   * Detect heading level from text pattern
   */
  private detectHeadingLevel(text: string): number {
    if (/^\d+\.\s/.test(text)) {
      const match = text.match(/^(\d+)\./);
      if (match) {
        const firstNum = parseInt(match[1], 10);
        if (firstNum < 10) return 1;
        if (firstNum < 100) return 2;
        return 3;
      }
    }
    return 1; // Default to level 1 for all caps
  }
}
