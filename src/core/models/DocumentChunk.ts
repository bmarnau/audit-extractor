/**
 * DocumentChunk Model
 *
 * Repräsentiert einen Text-Chunk aus einem Dokument.
 * Ein Chunk ist ein zusammenhängender Textabschnitt mit Positionsinformation.
 *
 * @example
 * const chunk: DocumentChunk = {
 *   id: "chunk-001",
 *   text: "Invoice Number: INV-2024-001",
 *   pageNumber: 1,
 *   sectionId: "header",
 *   offsetStart: 0,
 *   offsetEnd: 28
 * };
 */

/**
 * Repräsentiert einen Text-Chunk aus einem Dokument.
 * Wichtig: Der Text ist raw aus dem Dokument, nicht verarbeitet.
 */
export interface DocumentChunk {
  /** Eindeutige Chunk-ID innerhalb des Dokuments (z.B. "chunk-001") */
  id: string;

  /** Der tatsächliche Text des Chunks */
  text: string;

  /** Seitennummer (1-indexiert, oder undefined für Single-Page) */
  pageNumber?: number;

  /** Abschnitt-ID (z.B. "header", "body", "footer", "table-1") */
  sectionId?: string;

  /** Byte-Offset Start im Original-Dokument */
  offsetStart?: number;

  /** Byte-Offset Ende im Original-Dokument */
  offsetEnd?: number;

  /** Vertrauensscore der OCR/Extraktion (0-1, optional) */
  confidence?: number;

  /** Wurde dieser Chunk durch OCR extrahiert? */
  isOcrExtracted?: boolean;

  /** Chunk-Typ (z.B. "text", "table", "heading", "code") */
  type?: 'text' | 'table' | 'heading' | 'code' | 'list' | 'other';

  /** Optionale Tags (z.B. ["invoice-number", "date"]) */
  tags?: string[];
}
