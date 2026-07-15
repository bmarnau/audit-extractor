/**
 * PdfDocumentAdapter - Adapter for PDF documents
 *
 * Loads PDF files and converts them to UnifiedDocument.
 * Uses pdf-parse library for text extraction.
 *
 * Features:
 * - Multi-page support
 * - Text extraction per page
 * - Metadata extraction
 * - Large document support (streaming)
 * - Error handling & validation
 *
 * @version 0.23.0
 * @phase 23 - Extraction Pipeline & UnifiedDocument
 */

import { readFile, stat } from 'fs/promises';
import { extname } from 'path';
import pdfParse from 'pdf-parse';

import { DocumentAdapter, DocumentAdapterError, DocumentAdapterOptions } from '@domain/document/DocumentAdapter';
import { UnifiedDocument } from '@domain/document/UnifiedDocument';
import { DocumentMetadata, DocumentMetadataFactory } from '@domain/document/DocumentMetadata';
import { DocumentPage, DocumentPageFactory } from '@domain/document/DocumentPage';

/**
 * PdfDocumentAdapter - Implementation
 */
export class PdfDocumentAdapter implements DocumentAdapter {
  private readonly maxPageSize: number = 500 * 1024 * 1024; // 500MB default
  private readonly timeout: number = 60000; // 60s default

  /**
   * Check if adapter can handle this file
   */
  canHandle(filePath: string): boolean {
    const ext = extname(filePath).toLowerCase();
    return ext === '.pdf';
  }

  /**
   * Get adapter name
   */
  getName(): string {
    return 'PdfDocumentAdapter';
  }

  /**
   * Get supported MIME types
   */
  getSupportedMimeTypes(): string[] {
    return ['application/pdf'];
  }

  /**
   * Validate PDF before loading
   *
   * @throws {DocumentAdapterError} If validation fails
   */
  async validate(filePath: string): Promise<void> {
    try {
      // Check file exists
      const fileStats = await stat(filePath);

      if (!fileStats.isFile()) {
        throw DocumentAdapterError.validation(
          `Path is not a file: ${filePath}`,
          this.getName()
        );
      }

      // Check file size
      if (fileStats.size > this.maxPageSize) {
        throw DocumentAdapterError.validation(
          `PDF file is too large: ${fileStats.size} bytes (max: ${this.maxPageSize} bytes)`,
          this.getName(),
          { fileSize: fileStats.size, maxSize: this.maxPageSize }
        );
      }

      if (fileStats.size === 0) {
        throw DocumentAdapterError.validation(
          `PDF file is empty: ${filePath}`,
          this.getName()
        );
      }

      // Check file extension
      if (!this.canHandle(filePath)) {
        throw DocumentAdapterError.validation(
          `File is not a PDF: ${filePath}`,
          this.getName()
        );
      }
    } catch (error) {
      if (error instanceof DocumentAdapterError) {
        throw error;
      }

      throw DocumentAdapterError.validation(
        `PDF validation failed: ${(error as Error).message}`,
        this.getName()
      );
    }
  }

  /**
   * Load PDF and convert to UnifiedDocument
   *
   * @throws {DocumentAdapterError} If loading/processing fails
   */
  async load(
    filePath: string,
    options?: DocumentAdapterOptions
  ): Promise<UnifiedDocument> {
    try {
      // Validate first
      await this.validate(filePath);

      // Read file
      const pdfBuffer = await readFile(filePath);

      // Parse PDF
      const pdfData = await this.parsePdfWithTimeout(pdfBuffer, options?.timeout ?? this.timeout);

      // Extract metadata
      const fileStats = await stat(filePath);
      const metadata = this.extractMetadata(filePath, pdfData, fileStats.size, options);

      // Extract pages
      const pages = this.extractPages(pdfData, options);

      if (pages.length === 0) {
        throw DocumentAdapterError.processing(
          'No pages extracted from PDF',
          this.getName()
        );
      }

      // Create UnifiedDocument
      const document = UnifiedDocument.create(metadata, pages);

      return document;
    } catch (error) {
      if (error instanceof DocumentAdapterError) {
        throw error;
      }

      throw DocumentAdapterError.loading(
        `Failed to load PDF: ${(error as Error).message}`,
        this.getName(),
        error as Error,
        { filePath }
      );
    }
  }

  /**
   * Parse PDF with timeout
   */
  private async parsePdfWithTimeout(
    pdfBuffer: Buffer,
    timeout: number
  ): Promise<Record<string, unknown>> {
    return Promise.race([
      pdfParse(pdfBuffer),
      new Promise<Record<string, unknown>>((_, reject) =>
        setTimeout(() => reject(new Error('PDF parsing timeout')), timeout)
      ),
    ]);
  }

  /**
   * Extract metadata from PDF
   */
  private extractMetadata(
    filePath: string,
    pdfData: Record<string, unknown>,
    fileSizeBytes: number,
    options?: DocumentAdapterOptions
  ): DocumentMetadata {
    const filename = filePath.split('/').pop() || 'document.pdf';

    // Try to extract PDF metadata
    const info = pdfData.info as Record<string, unknown>;
    const metadata = DocumentMetadataFactory.createForPdf(filename, fileSizeBytes, {
      title: (info?.Title as string) || undefined,
      author: (info?.Author as string) || undefined,
      subject: (info?.Subject as string) || undefined,
      createdAt: info?.CreationDate ? new Date(info.CreationDate as string).toISOString() : undefined,
      modifiedAt: info?.ModDate ? new Date(info.ModDate as string).toISOString() : undefined,
      pdfVersion: `${pdfData.version}` || '1.7',
      production: (info?.Producer as string) || undefined,
      language: options?.language,
    });

    return metadata;
  }

  /**
   * Extract pages from PDF
   */
  private extractPages(
    pdfData: Record<string, unknown>,
    options?: DocumentAdapterOptions
  ): DocumentPage[] {
    const pages: DocumentPage[] = [];
    const text = (pdfData.text as string) || '';
    const textPages = text.split(/\f/);  // Split by form feed (page separator)

    // Handle page range
    let startPage = 1;
    let endPage = textPages.length;

    if (options?.pdfPages?.start) {
      startPage = Math.max(1, options.pdfPages.start);
    }

    if (options?.pdfPages?.end) {
      endPage = Math.min(textPages.length, options.pdfPages.end);
    }

    // Extract text per page
    for (let i = startPage; i <= endPage; i++) {
      const pageIndex = i - 1;
      const rawText = textPages[pageIndex] || '';

      const page = DocumentPageFactory.create(i, rawText, {
        encoding: 'UTF-8',
        textConfidence: this.estimateTextConfidence(rawText),
        isScanImage: this.isScanImage(rawText),
        extractionDurationMs: 0,
      });

      pages.push(page);
    }

    return pages;
  }

  /**
   * Estimate text extraction confidence
   *
   * Low confidence if mostly non-ASCII or very short
   */
  private estimateTextConfidence(text: string): number {
    if (!text || text.length === 0) {
      return 0;
    }

    // Very short text = lower confidence
    if (text.length < 50) {
      return 0.5;
    }

    // Check for mostly non-printable characters
    const printableChars = text.match(/[\x20-\x7E\t\n\r]/g) || [];
    const ratio = printableChars.length / text.length;

    if (ratio < 0.5) {
      return 0.3; // Mostly non-ASCII
    }

    if (ratio < 0.8) {
      return 0.6; // Mixed content
    }

    return 0.95; // Good quality text
  }

  /**
   * Check if page is likely a scanned image
   *
   * Simple heuristic: very short text or mostly structured characters
   */
  private isScanImage(text: string): boolean {
    if (!text || text.length < 20) {
      return true; // Too short = likely image
    }

    // If text is structured (lots of symbols, little space) = image
    const words = text.split(/\s+/).filter((w) => w.length > 2);
    if (words.length < 5) {
      return true;
    }

    return false;
  }
}
