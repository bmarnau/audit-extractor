/**
 * DocumentSection & DocumentTable - Value Objects for structured content
 *
 * Encapsulates sections and tables within documents.
 * Enables structured data extraction independent of document format.
 *
 * @version 0.23.0
 * @phase 23 - Extraction Pipeline & UnifiedDocument
 */

/**
 * DocumentSection - Represents a logical section in a document
 *
 * Sections can be hierarchical (nested).
 */
export interface DocumentSection {
  // Identification
  sectionId: string;           // Unique within document
  title: string;               // Section title
  level: number;               // Hierarchy level (1 = top, 2 = subsection, etc.)

  // Content
  startPageNumber: number;     // First page containing this section
  endPageNumber: number;       // Last page containing this section
  content: string;             // Section text content
  contentLength: number;       // Character count

  // Structure
  parentSectionId?: string;    // Parent section (for nested)
  subsectionIds: string[];     // Direct children

  // Metadata
  hasImages?: boolean;
  hasTable?: boolean;
  imageCount?: number;
  tableCount?: number;
  extractedAt: string;
}

/**
 * DocumentTable - Represents a table in a document
 *
 * Stores table structure for later extraction/analysis.
 */
export interface DocumentTable {
  // Identification
  tableId: string;             // Unique within document
  pageNumber: number;          // Page where table appears
  position?: number;           // Position on page (1st table, 2nd table, etc.)

  // Structure
  rowCount: number;            // Number of rows (including header)
  columnCount: number;         // Number of columns

  // Content (raw - for preprocessing only)
  headerRow?: string[];        // First row (column names)
  rows: string[][];            // All rows as 2D array
  rawTableText: string;        // Raw table text from OCR

  // Metadata
  hasHeaderRow: boolean;       // First row is header?
  hasRowNumbers?: boolean;     // Has row numbers?
  hasColumnNumbers?: boolean;  // Has column numbers?
  estimatedDataRows: number;   // Rows excluding headers/footers
  extractedAt: string;
}

/**
 * Factory for DocumentSection
 */
export class DocumentSectionFactory {
  private static sectionCounter = 0;

  /**
   * Create new section
   */
  static create(
    title: string,
    level: number,
    startPageNumber: number,
    endPageNumber: number,
    content: string,
    options?: {
      parentSectionId?: string;
      hasImages?: boolean;
      hasTable?: boolean;
      imageCount?: number;
      tableCount?: number;
    }
  ): DocumentSection {
    if (level < 1) {
      throw new Error('Section level must be >= 1');
    }

    if (startPageNumber > endPageNumber) {
      throw new Error('startPageNumber cannot be greater than endPageNumber');
    }

    this.sectionCounter++;
    const sectionId = `section_${String(this.sectionCounter).padStart(4, '0')}`;

    return {
      sectionId,
      title: title || `Section ${level}`,
      level,
      startPageNumber,
      endPageNumber,
      content,
      contentLength: content.length,
      parentSectionId: options?.parentSectionId,
      subsectionIds: [],
      hasImages: options?.hasImages ?? false,
      hasTable: options?.hasTable ?? false,
      imageCount: options?.imageCount,
      tableCount: options?.tableCount,
      extractedAt: new Date().toISOString(),
    };
  }

  /**
   * Reset counter (for testing)
   */
  static reset(): void {
    this.sectionCounter = 0;
  }
}

/**
 * Factory for DocumentTable
 */
export class DocumentTableFactory {
  private static tableCounter = 0;

  /**
   * Create new table from raw data
   */
  static create(
    pageNumber: number,
    rows: string[][],
    options?: {
      position?: number;
      hasHeaderRow?: boolean;
      hasRowNumbers?: boolean;
      hasColumnNumbers?: boolean;
      rawTableText?: string;
    }
  ): DocumentTable {
    if (rows.length === 0) {
      throw new Error('Table must have at least one row');
    }

    if (rows.some((row) => row.length === 0)) {
      throw new Error('All rows must have at least one column');
    }

    const columnCount = rows[0].length;
    if (!rows.every((row) => row.length === columnCount)) {
      throw new Error('All rows must have the same number of columns');
    }

    this.tableCounter++;
    const tableId = `table_${String(this.tableCounter).padStart(4, '0')}`;

    const headerRow = options?.hasHeaderRow ? rows[0] : undefined;
    const dataRowsStart = options?.hasHeaderRow ? 1 : 0;
    const estimatedDataRows = rows.length - dataRowsStart;

    const rawTableText = this.formatTableAsText(rows);

    return {
      tableId,
      pageNumber,
      position: options?.position ?? 1,
      rowCount: rows.length,
      columnCount,
      headerRow,
      rows,
      rawTableText: options?.rawTableText ?? rawTableText,
      hasHeaderRow: options?.hasHeaderRow ?? false,
      hasRowNumbers: options?.hasRowNumbers ?? false,
      hasColumnNumbers: options?.hasColumnNumbers ?? false,
      estimatedDataRows,
      extractedAt: new Date().toISOString(),
    };
  }

  /**
   * Reset counter (for testing)
   */
  static reset(): void {
    this.tableCounter = 0;
  }

  /**
   * Format table as pipe-separated text (for preview)
   */
  private static formatTableAsText(rows: string[][]): string {
    return rows.map((row) => `| ${row.join(' | ')} |`).join('\n');
  }
}
