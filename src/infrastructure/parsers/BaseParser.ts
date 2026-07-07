/**
 * BaseParser
 *
 * Abstrakte Basis-Klasse mit gemeinsamer Logik für alle Parser.
 * Implementiert DocumentParser Interface.
 */

import * as crypto from 'crypto';
import { Document, DocumentMetadata, DocumentChunk, DocumentImage, DocumentFormat } from '@core/models';
import { DocumentParser, ParsingError } from './DocumentParser';

/**
 * Abstrakte Base-Klasse für alle Parser.
 */
export abstract class BaseParser implements DocumentParser {
  /**
   * Abstrakte Methode: Text extrahieren.
   * Muss von Subklassen implementiert werden.
   */
  abstract extractText(fileBuffer: Buffer): Promise<string>;

  /**
   * Abstrakte Methode: Bild-Referenzen extrahieren.
   * Muss von Subklassen implementiert werden.
   */
  abstract extractImages(fileBuffer: Buffer): Promise<Record<string, unknown>[]>;

  /**
   * Abstrakte Methode: Dateityp-Prüfung.
   */
  abstract canHandle(fileName: string): boolean;

  /**
   * Abstrakte Methode: Supported-Format.
   */
  abstract getSupportedFormat(): string;

  /**
   * Standard parse(): Kombination von Text + Metadaten + Images.
   */
  async parse(fileBuffer: Buffer, fileName: string): Promise<Document> {
    try {
      const startTime = Date.now();

      // Extrahiere alle Komponenten
      const text = await this.extractText(fileBuffer);
      const metadata = await this.extractMetadata(fileBuffer, fileName);
      const images = await this.extractImages(fileBuffer);

      // Erstelle Chunks aus Text
      const chunks = this.createChunks(text, fileName);

      // Erstelle Document
      const document: Document = {
        id: this.generateDocumentId(fileBuffer, fileName),
        fileName,
        type: this.detectDocumentType(fileName),
        metadata: this.createMetadata(fileBuffer, fileName, metadata),
        chunks,
        images: this.createImageReferences(images),
        loadedAt: new Date(),
        tags: [],
      };

      console.log(`Parsed ${fileName} in ${Date.now() - startTime}ms - ${chunks.length} chunks, ${images.length} images`);
      return document;
    } catch (error) {
      throw new ParsingError(
        `Failed to parse ${fileName}`,
        fileName,
        this.getSupportedFormat(),
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Extrahiert Metadaten aus Puffer.
   * Basis-Implementierung - Subklassen können überschreiben.
   */
  async extractMetadata(fileBuffer: Buffer, fileName: string): Promise<Record<string, unknown>> {
    return {
      size: fileBuffer.length,
      format: this.getSupportedFormat(),
      fileName,
      extractedAt: new Date().toISOString(),
    };
  }

  /**
   * Erstellt DocumentMetadata aus Puffer und Extraktionen.
   * @protected
   */
  protected createMetadata(
    fileBuffer: Buffer,
    fileName: string,
    extractedMeta: Record<string, unknown>
  ): DocumentMetadata {
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    return {
      hash,
      size: fileBuffer.length,
      uploadedAt: new Date(),
      format: this.parseFormat(this.getSupportedFormat()),
      language: extractedMeta.language as string | undefined,
      encoding: 'utf-8',
      ocrApplied: (extractedMeta.ocrApplied as boolean) ?? false,
      source: fileName,
      uploadedBy: 'system',
      version: 1,
      description: `Parsed from ${fileName}`,
    };
  }

  /**
   * Erstellt Chunks aus Text.
   * Splittet nach Absätzen/Zeilen.
   * @protected
   */
  protected createChunks(text: string, _fileName: string): DocumentChunk[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks: DocumentChunk[] = [];
    const lines = text.split('\n');
    let charOffset = 0;
    let chunkIndex = 0;

    for (const line of lines) {
      if (line.trim().length > 0) {
        chunks.push({
          id: `chunk-${chunkIndex}-${Date.now()}`,
          text: line.trim(),
          pageNumber: Math.floor(chunkIndex / 50) + 1, // Ca. 50 Zeilen pro Seite
          sectionId: `section-${Math.floor(chunkIndex / 10)}`,
          offsetStart: charOffset,
          offsetEnd: charOffset + line.length,
          confidence: 1.0, // Vollständig extrahierter Text = volle Confidence
          isOcrExtracted: false, // Nur setzen wenn tatsächlich OCR
          type: 'text',
          tags: [],
        });

        charOffset += line.length + 1; // +1 für newline
        chunkIndex++;
      }
    }

    return chunks;
  }

  /**
   * Erstellt Image-References aus Extraktionen.
   * @protected
   */
  protected createImageReferences(extractedImages: Record<string, unknown>[]): DocumentImage[] {
    if (!extractedImages || extractedImages.length === 0) {
      return [];
    }

    return extractedImages.map((img, index) => ({
      id: `image-${index}`,
      pageNumber: (img.pageNumber as number) ?? undefined,
      format: (img.format as string) ?? 'unknown',
      size: (img.size as number) ?? 0,
      width: (img.width as number) ?? undefined,
      height: (img.height as number) ?? undefined,
      description: (img.description as string) ?? undefined, // Nur falls vorhanden!
      path: (img.path as string) ?? `image-${index}`, // Nur Referenz, keine Daten!
      ocrApplied: false,
      ocrText: undefined, // Nur wenn tatsächlich OCR appliziert
      tags: [],
      position: {
        x: (img.x as number) ?? 0,
        y: (img.y as number) ?? 0,
      },
    }));
  }

  /**
   * Generiert eindeutige Document-ID aus Hash.
   * @protected
   */
  protected generateDocumentId(fileBuffer: Buffer, _fileName: string): string {
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').substring(0, 12);
    return `doc-${hash}-${Date.now()}`;
  }

  /**
   * Erkennt Dokumenttyp aus Dateiname.
   * @protected
   */
  protected detectDocumentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? 'unknown';

    // Mapping von Dateiendung zu Dokumenttyp
    const typeMap: Record<string, string> = {
      pdf: 'invoice', // Standard-Annahme für PDF
      docx: 'contract',
      xlsx: 'spreadsheet',
      html: 'webpage',
      txt: 'text',
      json: 'data',
    };

    return typeMap[ext] ?? ext;
  }

  /**
   * Parsed Format-String zu DocumentFormat enum.
   * @protected
   */
  protected parseFormat(format: string): DocumentFormat {
    const upper = format.toUpperCase() as DocumentFormat;
    if (Object.values(DocumentFormat).includes(upper)) {
      return upper;
    }
    return DocumentFormat.UNKNOWN;
  }
}
