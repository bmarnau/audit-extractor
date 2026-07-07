/**
 * DocumentImage Model
 *
 * Speichert Referenzen zu Bildern aus dem Dokument.
 * Enthält Links zu Bildern, nicht die Bilder selbst.
 *
 * @example
 * const image: DocumentImage = {
 *   id: "img-001",
 *   pageNumber: 1,
 *   description: "Invoice logo"
 * };
 */

/**
 * Referenz auf ein Bild aus dem Dokument.
 * Speichert Metadaten des Bildes, nicht das Bild selbst.
 */
export interface DocumentImage {
  /** Eindeutige Bild-ID (z.B. "img-001") */
  id: string;

  /** Seitennummer, auf der das Bild vorkommt (1-indexiert) */
  pageNumber: number;

  /** Dateityp des Bildes (z.B. "png", "jpg", "bmp") */
  format?: string;

  /** Größe des Bildes in Bytes */
  size?: number;

  /** Breite in Pixeln */
  width?: number;

  /** Höhe in Pixeln */
  height?: number;

  /** Beschreibung/Alt-Text für das Bild */
  description?: string;

  /** Pfad oder URI zum Bild (lokal oder extern) */
  path?: string;

  /** Wurde OCR auf das Bild angewendet? */
  ocrApplied?: boolean;

  /** OCR-Text aus dem Bild */
  ocrText?: string;

  /** Optionale Tags (z.B. ["logo", "signature", "table"]) */
  tags?: string[];

  /** Position im Dokument */
  position?: {
    /** X-Koordinate (oben-links) */
    x?: number;
    /** Y-Koordinate (oben-links) */
    y?: number;
  };
}
