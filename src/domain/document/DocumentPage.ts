/**
 * DocumentPage - Value Object for document pages
 *
 * Encapsulates a single page with text content and metadata.
 * Immutable and self-validating.
 *
 * @version 0.23.0
 * @phase 23 - Extraction Pipeline & UnifiedDocument
 */

/**
 * DocumentPage - Value Object
 *
 * Represents a single page in a document.
 * Contains extracted text and metadata per page.
 */
export interface DocumentPage {
  // Identification
  pageNumber: number;           // 1-based (first page = 1)
  pageId: string;               // Unique within document (e.g., "page_001")

  // Content
  rawText: string;              // Full extracted text
  textLength: number;           // Character count
  lineCount: number;            // Number of lines

  // Metadata
  width?: number;               // Page width in points (PDF-specific)
  height?: number;              // Page height in points (PDF-specific)
  rotation?: number;            // Rotation angle (0, 90, 180, 270)
  hasImages?: boolean;          // Contains images?
  imagePaths?: string[];        // Relative paths to extracted images

  // Extraction metadata
  extractedAt: string;          // ISO 8601 timestamp
  extractionDurationMs: number; // Time to extract this page
  encoding?: string;            // Text encoding (UTF-8, etc.)

  // Quality metrics
  hasText: boolean;             // Page has extractable text?
  textConfidence?: number;      // 0-1, text extraction confidence
  isScanImage?: boolean;        // Is this a scanned image (no text layer)?
}

/**
 * Factory for DocumentPage
 */
export class DocumentPageFactory {
  /**
   * Create a new DocumentPage
   */
  static create(
    pageNumber: number,
    rawText: string,
    options?: {
      width?: number;
      height?: number;
      rotation?: number;
      hasImages?: boolean;
      imagePaths?: string[];
      encoding?: string;
      textConfidence?: number;
      isScanImage?: boolean;
      extractionDurationMs?: number;
    }
  ): DocumentPage {
    if (pageNumber < 1) {
      throw new Error('pageNumber must be >= 1');
    }

    if (typeof rawText !== 'string') {
      throw new Error('rawText must be a string');
    }

    const lines = rawText.split(/\r?\n/).filter((line) => line.length > 0);

    return {
      pageNumber,
      pageId: `page_${String(pageNumber).padStart(3, '0')}`,
      rawText,
      textLength: rawText.length,
      lineCount: lines.length,
      width: options?.width,
      height: options?.height,
      rotation: options?.rotation ?? 0,
      hasImages: options?.hasImages ?? false,
      imagePaths: options?.imagePaths ?? [],
      extractedAt: new Date().toISOString(),
      extractionDurationMs: options?.extractionDurationMs ?? 0,
      encoding: options?.encoding ?? 'UTF-8',
      hasText: rawText.trim().length > 0,
      textConfidence: options?.textConfidence,
      isScanImage: options?.isScanImage ?? false,
    };
  }

  /**
   * Create empty page (for failed extractions)
   */
  static createEmpty(pageNumber: number): DocumentPage {
    return this.create(pageNumber, '', {
      isScanImage: false,
      textConfidence: 0,
      extractionDurationMs: 0,
    });
  }

  /**
   * Merge multiple pages into one (e.g., for multi-column layouts)
   */
  static merge(pages: DocumentPage[], separator: string = '\n'): DocumentPage {
    if (pages.length === 0) {
      throw new Error('Cannot merge empty page array');
    }

    const mergedText = pages.map((p) => p.rawText).join(separator);
    const mergedImages = pages.flatMap((p) => p.imagePaths ?? []);
    const minPageNumber = Math.min(...pages.map((p) => p.pageNumber));

    return this.create(minPageNumber, mergedText, {
      hasImages: mergedImages.length > 0,
      imagePaths: mergedImages,
      extractionDurationMs: pages.reduce((sum, p) => sum + p.extractionDurationMs, 0),
    });
  }
}
