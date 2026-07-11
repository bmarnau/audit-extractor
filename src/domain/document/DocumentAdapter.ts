/**
 * DocumentAdapter - Interface for document format adapters
 *
 * Defines contract for converting various document formats to UnifiedDocument.
 * Implementations: PDF, HTML, DOCX, TXT
 *
 * @version 0.23.0
 * @phase 23 - Extraction Pipeline & UnifiedDocument
 */

import { UnifiedDocument } from './UnifiedDocument';

/**
 * DocumentAdapter - Interface
 *
 * Contract for adapting different document formats to UnifiedDocument.
 * Each adapter handles one format (PDF, HTML, DOCX, TXT).
 */
export interface DocumentAdapter {
  /**
   * Check if adapter can handle this file
   *
   * @param filePath - Path to document file
   * @returns true if adapter can process this file
   */
  canHandle(filePath: string): boolean;

  /**
   * Load and process document
   *
   * @param filePath - Path to document file
   * @param options - Optional adapter-specific options
   * @returns UnifiedDocument instance
   * @throws {DocumentAdapterError} If loading/processing fails
   */
  load(
    filePath: string,
    options?: Record<string, unknown>
  ): Promise<UnifiedDocument>;

  /**
   * Get adapter name for logging/debugging
   */
  getName(): string;

  /**
   * Get supported MIME types
   */
  getSupportedMimeTypes(): string[];

  /**
   * Validate document before loading
   *
   * @param filePath - Path to document
   * @throws {DocumentAdapterError} If validation fails
   */
  validate(filePath: string): Promise<void>;
}

/**
 * DocumentAdapterOptions - Options for document loading
 */
export interface DocumentAdapterOptions {
  // Common options
  maxPageSize?: number;        // Max file size in bytes (default: 500MB)
  timeout?: number;            // Timeout in milliseconds (default: 60000ms)
  encoding?: string;           // Text encoding (default: UTF-8)
  language?: string;           // Document language hint (e.g., 'de', 'en')

  // PDF-specific
  pdfPassword?: string;        // Password for encrypted PDFs
  pdfPages?: {                 // Extract specific pages only
    start?: number;            // First page (1-based)
    end?: number;              // Last page
  };
  pdfImageExtraction?: boolean; // Extract images from PDF

  // HTML-specific
  htmlPreserveLinks?: boolean; // Keep link URLs in text
  htmlPreserveImages?: boolean; // Note image locations
  htmlProcessScripts?: boolean; // Process dynamic content
  htmlRemoveStyles?: boolean;  // Remove CSS classes/styles

  // DOCX-specific
  docxPreserveFormatting?: boolean; // Try to preserve formatting

  // Extraction options
  includeMetadata?: boolean;   // Extract document metadata
  includeSections?: boolean;   // Analyze document structure
  includeTables?: boolean;     // Extract table data
  detectLanguage?: boolean;    // Auto-detect language
}

/**
 * DocumentAdapterFactory - Factory for getting appropriate adapter
 */
export interface DocumentAdapterFactory {
  /**
   * Get adapter for file
   *
   * @param filePath - Path to document
   * @returns Appropriate DocumentAdapter for file type
   * @throws {DocumentAdapterError} If no suitable adapter found
   */
  getAdapter(filePath: string): DocumentAdapter;

  /**
   * Get adapter by name
   *
   * @param adapterName - Name of adapter (e.g., 'pdf', 'html')
   * @returns DocumentAdapter instance
   * @throws {DocumentAdapterError} If adapter not found
   */
  getAdapterByName(adapterName: string): DocumentAdapter;

  /**
   * Register new adapter
   */
  register(adapter: DocumentAdapter): void;

  /**
   * Get all registered adapters
   */
  getAdapters(): DocumentAdapter[];
}

/**
 * DocumentAdapterError - Error class for adapter operations
 */
export class DocumentAdapterError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly adapter?: string,
    public readonly details?: Record<string, unknown>,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'DocumentAdapterError';
  }

  /**
   * Create validation error
   */
  static validation(
    message: string,
    adapter?: string,
    details?: Record<string, unknown>
  ): DocumentAdapterError {
    return new DocumentAdapterError('VALIDATION_FAILED', message, adapter, details);
  }

  /**
   * Create loading error
   */
  static loading(
    message: string,
    adapter?: string,
    cause?: Error,
    details?: Record<string, unknown>
  ): DocumentAdapterError {
    return new DocumentAdapterError(
      'LOADING_FAILED',
      message,
      adapter,
      details,
      cause
    );
  }

  /**
   * Create processing error
   */
  static processing(
    message: string,
    adapter?: string,
    cause?: Error,
    details?: Record<string, unknown>
  ): DocumentAdapterError {
    return new DocumentAdapterError(
      'PROCESSING_FAILED',
      message,
      adapter,
      details,
      cause
    );
  }

  /**
   * Create unsupported format error
   */
  static unsupported(
    filePath: string,
    details?: Record<string, unknown>
  ): DocumentAdapterError {
    return new DocumentAdapterError(
      'UNSUPPORTED_FORMAT',
      `No adapter found for file: ${filePath}`,
      undefined,
      details
    );
  }

  /**
   * Convert to plain object
   */
  toObject(): {
    code: string;
    message: string;
    adapter?: string;
    details?: Record<string, unknown>;
  } {
    return {
      code: this.code,
      message: this.message,
      adapter: this.adapter,
      details: this.details,
    };
  }
}
