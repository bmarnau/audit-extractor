/**
 * PDF Validator Service
 * Validates PDF structure and content before delivery
 * Central requirement: All downloads must contain VALID PDF structure
 * Version: 0.37.1
 */

export interface PDFValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileSize: number;
  hasContent: boolean;
  magicNumber: boolean;
}

export class PDFValidator {
  private static readonly PDF_MAGIC_NUMBER = Buffer.from('%PDF-1.', 'utf8');
  private static readonly EOF_MARKER = Buffer.from('%%EOF', 'utf8');
  private static readonly OBJECT_MARKER = Buffer.from('endobj', 'utf8');
  private static readonly STREAM_START = Buffer.from('stream', 'utf8');
  private static readonly STREAM_END = Buffer.from('endstream', 'utf8');

  /**
   * Validate PDF buffer structure
   */
  static validate(pdfBuffer: Buffer): PDFValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let isValid = true;

    // Check file size
    if (!pdfBuffer || pdfBuffer.length === 0) {
      errors.push('PDF buffer is empty');
      isValid = false;
    }

    // Check magic number (PDF header)
    const hasMagicNumber = this.checkMagicNumber(pdfBuffer);
    if (!hasMagicNumber) {
      errors.push('Invalid PDF magic number - file does not start with %PDF-');
      isValid = false;
    }

    // Check EOF marker
    const hasEOF = this.checkEOFMarker(pdfBuffer);
    if (!hasEOF) {
      warnings.push('Missing %%EOF marker - PDF may not be properly terminated');
    }

    // Check for objects
    const hasObjects = this.checkObjects(pdfBuffer);
    if (!hasObjects) {
      warnings.push('No PDF objects found - PDF may be empty or corrupted');
    }

    // Check for content streams
    const hasStreams = this.checkStreams(pdfBuffer);
    if (!hasStreams) {
      warnings.push('No content streams found - PDF may not have visible content');
    }

    // Check minimum size (valid PDFs are usually > 100 bytes)
    if (pdfBuffer.length < 100) {
      warnings.push('PDF size is unusually small - may indicate incomplete generation');
    }

    // Check for xref table
    const hasXref = this.checkXrefTable(pdfBuffer);
    if (!hasXref) {
      warnings.push('No xref table found - PDF structure may be corrupted');
    }

    return {
      isValid: isValid && errors.length === 0,
      errors,
      warnings,
      fileSize: pdfBuffer.length,
      hasContent: hasStreams,
      magicNumber: hasMagicNumber,
    };
  }

  /**
   * Check PDF magic number (%PDF-1.x)
   */
  private static checkMagicNumber(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 7) return false;
    const header = buffer.slice(0, 7).toString('utf8', 0, 5);
    return header === '%PDF-';
  }

  /**
   * Check for EOF marker
   */
  private static checkEOFMarker(buffer: Buffer): boolean {
    const bufferStr = buffer.toString('utf8');
    return bufferStr.includes('%%EOF');
  }

  /**
   * Check for PDF objects (endobj markers)
   */
  private static checkObjects(buffer: Buffer): boolean {
    return buffer.includes(this.OBJECT_MARKER);
  }

  /**
   * Check for content streams
   */
  private static checkStreams(buffer: Buffer): boolean {
    return buffer.includes(this.STREAM_START) && buffer.includes(this.STREAM_END);
  }

  /**
   * Check for xref table (cross-reference table)
   */
  private static checkXrefTable(buffer: Buffer): boolean {
    const bufferStr = buffer.toString('utf8');
    return bufferStr.includes('xref') || bufferStr.includes('startxref');
  }

  /**
   * Validate Content-Type for PDF
   */
  static validateContentType(contentType?: string): boolean {
    return contentType === 'application/pdf';
  }

  /**
   * Validate filename extension
   */
  static validateFilename(filename: string): boolean {
    return filename.toLowerCase().endsWith('.pdf');
  }

  /**
   * Enforce central requirement: No JSON/text as .pdf
   * Verify actual PDF structure exists
   */
  static enforceValidPDFStructure(buffer: Buffer, filename: string): void {
    // Central requirement: All downloads must contain VALID PDF structure
    if (!filename.toLowerCase().endsWith('.pdf')) {
      throw new Error(
        `Central Requirement Violation: Filename must end with .pdf, got: ${filename}`
      );
    }

    const validation = this.validate(buffer);

    if (!validation.isValid) {
      throw new Error(
        `Central Requirement Violation: PDF must have valid structure. Errors: ${validation.errors.join(', ')}`
      );
    }

    if (!validation.magicNumber) {
      throw new Error(
        `Central Requirement Violation: PDF must start with magic number (%PDF-), got binary: ${buffer.slice(0, 10).toString('hex')}`
      );
    }

    if (validation.warnings.length > 0) {
      console.warn(`PDF Validation Warnings: ${validation.warnings.join(', ')}`);
    }
  }
}
