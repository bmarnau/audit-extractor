/**
 * UnifiedDocument - Aggregate Root
 *
 * Domain-driven model for document-agnostic document representation.
 * Unifies PDF, HTML, DOCX, TXT into single interface.
 *
 * @version 0.23.0
 * @phase 23 - Extraction Pipeline & UnifiedDocument
 */

import { DocumentId } from './DocumentId';
import { DocumentPage } from './DocumentPage';
import { DocumentSection, DocumentTable } from './DocumentSection';
import { DocumentMetadata } from './DocumentMetadata';

/**
 * UnifiedDocument - Aggregate Root
 *
 * Represents a document in unified format regardless of source type.
 * Contains all pages, sections, tables, and metadata.
 *
 * Invariants:
 * - documentId is unique
 * - pages are sorted by pageNumber
 * - all sections belong to document
 * - all tables have valid pageNumber references
 * - metadata is consistent with content
 */
export class UnifiedDocument {
  private readonly documentId: DocumentId;
  private readonly metadata: DocumentMetadata;
  private readonly pages: Map<number, DocumentPage>;
  private readonly sections: Map<string, DocumentSection>;
  private readonly tables: Map<string, DocumentTable>;

  private createdAt: string;
  private updatedAt: string;

  /**
   * Constructor (use factory methods instead)
   */
  private constructor(
    documentId: DocumentId,
    metadata: DocumentMetadata,
    pages: DocumentPage[],
    sections?: DocumentSection[],
    tables?: DocumentTable[]
  ) {
    this.documentId = documentId;
    this.metadata = metadata;
    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt;

    // Initialize pages map (sorted)
    this.pages = new Map();
    pages.sort((a, b) => a.pageNumber - b.pageNumber);
    pages.forEach((page) => {
      this.pages.set(page.pageNumber, page);
    });

    // Initialize sections map
    this.sections = new Map();
    sections?.forEach((section) => {
      this.sections.set(section.sectionId, section);
    });

    // Initialize tables map
    this.tables = new Map();
    tables?.forEach((table) => {
      this.tables.set(table.tableId, table);
    });
  }

  /**
   * Create new UnifiedDocument from pages
   */
  static create(
    metadata: DocumentMetadata,
    pages: DocumentPage[],
    options?: {
      sections?: DocumentSection[];
      tables?: DocumentTable[];
    }
  ): UnifiedDocument {
    if (!pages || pages.length === 0) {
      throw new Error('UnifiedDocument must contain at least one page');
    }

    const documentId = DocumentId.create();
    return new UnifiedDocument(
      documentId,
      metadata,
      pages,
      options?.sections,
      options?.tables
    );
  }

  /**
   * Restore UnifiedDocument from persisted state
   */
  static restore(
    documentId: DocumentId,
    metadata: DocumentMetadata,
    pages: DocumentPage[],
    sections?: DocumentSection[],
    tables?: DocumentTable[],
    createdAt?: string,
    updatedAt?: string
  ): UnifiedDocument {
    const doc = new UnifiedDocument(documentId, metadata, pages, sections, tables);
    if (createdAt) doc.createdAt = createdAt;
    if (updatedAt) doc.updatedAt = updatedAt;
    return doc;
  }

  // ==================== Getters ====================

  /**
   * Get document ID
   */
  getId(): DocumentId {
    return this.documentId;
  }

  /**
   * Get document metadata
   */
  getMetadata(): DocumentMetadata {
    return this.metadata;
  }

  /**
   * Get all pages
   */
  getPages(): DocumentPage[] {
    return Array.from(this.pages.values());
  }

  /**
   * Get specific page by number
   */
  getPage(pageNumber: number): DocumentPage | undefined {
    return this.pages.get(pageNumber);
  }

  /**
   * Get page count
   */
  getPageCount(): number {
    return this.pages.size;
  }

  /**
   * Get all sections
   */
  getSections(): DocumentSection[] {
    return Array.from(this.sections.values());
  }

  /**
   * Get all tables
   */
  getTables(): DocumentTable[] {
    return Array.from(this.tables.values());
  }

  /**
   * Get creation timestamp
   */
  getCreatedAt(): string {
    return this.createdAt;
  }

  /**
   * Get last update timestamp
   */
  getUpdatedAt(): string {
    return this.updatedAt;
  }

  // ==================== Business Logic ====================

  /**
   * Get combined text from all pages
   *
   * @param separator - Text between pages (default: "\n\n")
   */
  getRawText(separator: string = '\n\n'): string {
    const sortedPages = Array.from(this.pages.values());
    return sortedPages.map((page) => page.rawText).join(separator);
  }

  /**
   * Get word count
   */
  getWordCount(): number {
    const text = this.getRawText();
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  /**
   * Get character count (all pages)
   */
  getCharacterCount(): boolean {
    return this.getPages().reduce((sum, page) => sum + page.textLength, 0) > 0;
  }

  /**
   * Check if document has any content
   */
  hasContent(): boolean {
    return this.getPages().some((page) => page.hasText);
  }

  /**
   * Check if document has tables
   */
  hasTables(): boolean {
    return this.tables.size > 0;
  }

  /**
   * Check if document has sections
   */
  hasSections(): boolean {
    return this.sections.size > 0;
  }

  /**
   * Add section to document
   *
   * @throws {Error} If section references invalid page
   */
  addSection(section: DocumentSection): void {
    // Validate section page numbers
    if (!this.pages.has(section.startPageNumber)) {
      throw new Error(
        `Section references invalid startPageNumber: ${section.startPageNumber}`
      );
    }

    if (!this.pages.has(section.endPageNumber)) {
      throw new Error(
        `Section references invalid endPageNumber: ${section.endPageNumber}`
      );
    }

    this.sections.set(section.sectionId, section);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Add table to document
   *
   * @throws {Error} If table references invalid page
   */
  addTable(table: DocumentTable): void {
    if (!this.pages.has(table.pageNumber)) {
      throw new Error(`Table references invalid pageNumber: ${table.pageNumber}`);
    }

    this.tables.set(table.tableId, table);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    documentId: string;
    pageCount: number;
    sectionCount: number;
    tableCount: number;
    wordCount: number;
    hasContent: boolean;
    createdAt: string;
  } {
    return {
      documentId: this.documentId.toString(),
      pageCount: this.getPageCount(),
      sectionCount: this.sections.size,
      tableCount: this.tables.size,
      wordCount: this.getWordCount(),
      hasContent: this.hasContent(),
      createdAt: this.createdAt,
    };
  }

  /**
   * Serialize to plain object
   */
  toObject(): {
    documentId: string;
    metadata: DocumentMetadata;
    pages: DocumentPage[];
    sections: DocumentSection[];
    tables: DocumentTable[];
    createdAt: string;
    updatedAt: string;
  } {
    return {
      documentId: this.documentId.toString(),
      metadata: this.metadata,
      pages: this.getPages(),
      sections: this.getSections(),
      tables: this.getTables(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
