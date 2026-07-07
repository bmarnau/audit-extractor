/**
 * DocxParser
 *
 * Parsed DOCX-Dokumente mit mammoth.
 * Extrahiert: Text, Struktur, Metadaten, Image-Referenzen.
 */

import * as mammoth from 'mammoth';
import { BaseParser } from './BaseParser';
import { ParsingError } from './DocumentParser';

/**
 * Parser für DOCX-Dokumente.
 */
export class DocxParser extends BaseParser {
  /**
   * Prüft, ob Datei eine DOCX ist.
   */
  canHandle(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.docx');
  }

  /**
   * Gibt Format zurück.
   */
  getSupportedFormat(): string {
    return 'docx';
  }

  /**
   * Extrahiert nur Text aus DOCX.
   */
  async extractText(fileBuffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });

      if (!result.value || result.value.trim().length === 0) {
        console.warn('DOCX contains no extractable text');
        return '';
      }

      return result.value;
    } catch (error) {
      throw new ParsingError(
        `Failed to extract text from DOCX`,
        undefined,
        'docx',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Extrahiert Metadaten aus DOCX.
   */
  async extractMetadata(fileBuffer: Buffer, fileName: string): Promise<Record<string, unknown>> {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });

      // Mammoth bietet begrenzte Metadaten
      // Das meiste müsste aus dem OOXML extrahiert werden
      return {
        ...super.extractMetadata(fileBuffer, fileName),
        warnings: ((result as unknown as Record<string, unknown>).warnings ?? 0),
        hasImages: (((result as unknown as Record<string, unknown>).messages as Array<Record<string, unknown>>)?.some((m) => 
          Object.values(m).some(v => typeof v === 'string' && v.includes('image'))
        ) ?? false),
      };
    } catch (error) {
      console.error('Failed to extract DOCX metadata:', error);
      return super.extractMetadata(fileBuffer, fileName);
    }
  }

  /**
   * Extrahiert Image-Referenzen aus DOCX.
   * Nutzt mammoth image converter.
   */
  async extractImages(fileBuffer: Buffer): Promise<Record<string, unknown>[]> {
    try {
      const images: Record<string, unknown>[] = [];
      let imageIndex = 0;

      await mammoth.convertToHtml(
        { buffer: fileBuffer },
        {
          convertImage: mammoth.images.imgElement(async (image) => {
            // Image-Metadaten extrahieren
            const imageBuffer = await image.read('base64');

            images.push({
              id: `image-${imageIndex}`,
              format: image.contentType ?? 'unknown',
              size: imageBuffer.length,
              path: `image-${imageIndex}`, // Nur Referenz!
              description: undefined, // Kein auto-generated text!
              position: {
                x: 0,
                y: 0,
              },
            });

            imageIndex++;

            // Gebe leeres img zurück (wir speichern nicht die Bilder)
            return {
              src: `image-${imageIndex - 1}`,
            };
          }),
        }
      );

      return images;
    } catch (error) {
      console.error('Failed to extract images from DOCX:', error);
      return [];
    }
  }
}
