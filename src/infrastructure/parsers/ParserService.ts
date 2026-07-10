/**
 * ParserService - Injectable Wrapper für ParserFactory
 *
 * Bietet eine DI-kompatible Schnittstelle für den Parser.
 * Wird von ExtractionPipeline als injizierbare Abhängigkeit verwendet.
 */

import { injectable } from 'tsyringe';
import { DocumentParser } from './DocumentParser';
import { ParserFactory } from './ParserFactory';

@injectable()
export class ParserService implements DocumentParser {
  /**
   * Parse a document from a Buffer using the appropriate parser based on filename
   */
  async parse(fileBuffer: Buffer, fileName: string): Promise<any> {
    const parser = ParserFactory.getParser(fileName);
    return await parser.parse(fileBuffer, fileName);
  }

  /**
   * Check if this parser can handle the file
   */
  canHandle(fileName: string): boolean {
    try {
      ParserFactory.getParser(fileName);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the supported format for this parser
   */
  getSupportedFormat(): string {
    return 'auto';
  }

  /**
   * Extract text from a document
   */
  async extractText(fileBuffer: Buffer): Promise<string> {
    // Try PDF first (most common)
    try {
      const parser = ParserFactory.getParser('dummy.pdf');
      return await parser.extractText(fileBuffer);
    } catch {
      // Fallback: try getting text from any parser
      const parsers = ParserFactory.getParsers();
      for (const parser of parsers) {
        try {
          return await parser.extractText(fileBuffer);
        } catch {
          continue;
        }
      }
      throw new Error('Could not extract text from document');
    }
  }

  /**
   * Extract metadata from a document
   */
  async extractMetadata(fileBuffer: Buffer, fileName: string): Promise<Record<string, unknown>> {
    const parser = ParserFactory.getParser(fileName);
    return await parser.extractMetadata(fileBuffer, fileName);
  }

  /**
   * Extract image references from a document
   */
  async extractImages(fileBuffer: Buffer): Promise<Record<string, unknown>[]> {
    // Try PDF first (most common)
    try {
      const parser = ParserFactory.getParser('dummy.pdf');
      return await parser.extractImages(fileBuffer);
    } catch {
      // Fallback: try getting images from any parser
      const parsers = ParserFactory.getParsers();
      for (const parser of parsers) {
        try {
          return await parser.extractImages(fileBuffer);
        } catch {
          continue;
        }
      }
      // Return empty array if no images found
      return [];
    }
  }
}
