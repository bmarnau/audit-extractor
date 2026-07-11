/**
 * DocumentMetadata - Value Object for document metadata
 *
 * Stores document-level information (author, creation date, etc.)
 * without coupling to specific document formats.
 *
 * @version 0.23.0
 * @phase 23 - Extraction Pipeline & UnifiedDocument
 */

/**
 * DocumentMetadata - Value Object
 *
 * Encapsulates document-level metadata.
 * Format-agnostic, extracted from various sources.
 */
export interface DocumentMetadata {
  // Basic info
  filename: string;            // Original filename
  sourceType: 'pdf' | 'html' | 'docx' | 'txt' | 'unknown';
  mimeType: string;            // MIME type (e.g., application/pdf)
  fileSizeBytes: number;       // File size in bytes

  // Document properties
  title?: string;              // Document title (from metadata)
  author?: string;             // Document author
  subject?: string;            // Document subject
  keywords?: string[];         // Document keywords

  // Creation & modification
  createdAt?: string;          // ISO 8601
  modifiedAt?: string;         // ISO 8601
  extractedAt: string;         // ISO 8601 - when extracted

  // Content characteristics
  language?: string;           // Detected language (e.g., 'de', 'en')
  encoding?: string;           // Character encoding (UTF-8, etc.)
  hasEncryption: boolean;      // Is document encrypted?
  hasSignatures?: boolean;     // Digital signatures present?

  // Format-specific
  pdfVersion?: string;         // e.g., "1.7"
  pageLayout?: string;         // e.g., "singlePage", "twoColumnLeft"
  production?: string;         // Producer (e.g., "iText")

  // Custom metadata
  customMetadata?: Record<string, string | number | boolean>;

  // Statistics
  estimatedReadingTimeMinutes?: number;
}

/**
 * Factory for DocumentMetadata
 */
export class DocumentMetadataFactory {
  /**
   * Create metadata from file information
   */
  static create(
    filename: string,
    sourceType: DocumentMetadata['sourceType'],
    fileSizeBytes: number,
    options?: Partial<DocumentMetadata>
  ): DocumentMetadata {
    if (!filename || filename.trim().length === 0) {
      throw new Error('filename must be non-empty');
    }

    if (fileSizeBytes < 0) {
      throw new Error('fileSizeBytes must be non-negative');
    }

    const mimeType = this.getMimeTypeForSourceType(sourceType);

    return {
      filename,
      sourceType,
      mimeType,
      fileSizeBytes,
      title: options?.title,
      author: options?.author,
      subject: options?.subject,
      keywords: options?.keywords,
      createdAt: options?.createdAt,
      modifiedAt: options?.modifiedAt,
      extractedAt: new Date().toISOString(),
      language: options?.language ?? 'unknown',
      encoding: options?.encoding ?? 'UTF-8',
      hasEncryption: options?.hasEncryption ?? false,
      hasSignatures: options?.hasSignatures,
      pdfVersion: options?.pdfVersion,
      pageLayout: options?.pageLayout,
      production: options?.production,
      customMetadata: options?.customMetadata,
      estimatedReadingTimeMinutes: options?.estimatedReadingTimeMinutes,
    };
  }

  /**
   * Create metadata with defaults for PDF
   */
  static createForPdf(
    filename: string,
    fileSizeBytes: number,
    pdfMetadata?: Partial<DocumentMetadata>
  ): DocumentMetadata {
    return this.create(filename, 'pdf', fileSizeBytes, {
      pdfVersion: '1.7',
      encoding: 'UTF-8',
      ...pdfMetadata,
    });
  }

  /**
   * Create metadata with defaults for HTML
   */
  static createForHtml(
    filename: string,
    fileSizeBytes: number,
    htmlMetadata?: Partial<DocumentMetadata>
  ): DocumentMetadata {
    return this.create(filename, 'html', fileSizeBytes, {
      encoding: 'UTF-8',
      ...htmlMetadata,
    });
  }

  /**
   * Create metadata with defaults for DOCX
   */
  static createForDocx(
    filename: string,
    fileSizeBytes: number,
    docxMetadata?: Partial<DocumentMetadata>
  ): DocumentMetadata {
    return this.create(filename, 'docx', fileSizeBytes, {
      encoding: 'UTF-8',
      ...docxMetadata,
    });
  }

  /**
   * Create metadata with defaults for TXT
   */
  static createForText(
    filename: string,
    fileSizeBytes: number,
    textMetadata?: Partial<DocumentMetadata>
  ): DocumentMetadata {
    return this.create(filename, 'txt', fileSizeBytes, {
      encoding: 'UTF-8',
      ...textMetadata,
    });
  }

  /**
   * Estimate reading time based on word count
   *
   * Assumes ~200 words per minute average reading speed
   */
  static estimateReadingTime(wordCount: number): number {
    const WORDS_PER_MINUTE = 200;
    return Math.ceil(wordCount / WORDS_PER_MINUTE);
  }

  /**
   * Get MIME type for source type
   */
  private static getMimeTypeForSourceType(sourceType: DocumentMetadata['sourceType']): string {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      html: 'text/html',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      unknown: 'application/octet-stream',
    };
    return mimeTypes[sourceType] || mimeTypes['unknown'];
  }
}
