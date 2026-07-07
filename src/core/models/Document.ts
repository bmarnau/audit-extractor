/**
 * Document Model
 *
 * Repräsentiert ein Eingabedokument mit Metadaten und Chunks.
 * Keine Extraktionsergebnisse - reine Dokumentdarstellung.
 *
 * @example
 * const doc: Document = {
 *   id: "doc-001",
 *   fileName: "invoice.pdf",
 *   metadata: { ... },
 *   chunks: [ ... ],
 *   images: [ ... ]
 * };
 */

import { DocumentMetadata } from './DocumentMetadata';
import { DocumentChunk } from './DocumentChunk';
import { DocumentImage } from './DocumentImage';

/**
 * Repräsentiert ein vollständiges Dokument mit allen seinen Komponenten.
 */
export interface Document {
  /** Eindeutige Dokument-ID (z.B. "doc-001", "invoice-2024-001") */
  id: string;

  /** Ursprünglicher Dateiname (z.B. "invoice.pdf", "contract.docx") */
  fileName: string;

  /** Dokumenttyp zur Rule-Zuordnung (z.B. "invoice", "contract", "purchase-order") */
  type: string;

  /** Metadaten des Dokuments (Hash, Größe, Datum, etc.) */
  metadata: DocumentMetadata;

  /** Text-Chunks des Dokuments */
  chunks: DocumentChunk[];

  /** Bilder/Referenzen aus dem Dokument */
  images?: DocumentImage[];

  /** Zeitstempel, wann das Dokument geladen wurde */
  loadedAt: Date;

  /** Optionale Tags zur Kategorisierung */
  tags?: string[];

  /** Optionale Notizen zum Dokument */
  notes?: string;
}
