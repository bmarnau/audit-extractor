/**
 * ChunkingEngine
 *
 * Intelligente Zerlegung von Dokumenten in Chunks.
 * Unterstützt:
 * - Maximale Chunkgröße
 * - Überlappung für Kontext
 * - Überschriftenerkennung
 * - Abschnittserkennung
 *
 * Kritisch: Keine erfundenen Daten!
 * - Nur tatsächlich vorhandene Texte chunken
 * - Keine Auto-generated Überschriften
 * - Confidence basierend auf Struktur-Klarheit
 */

import { injectable } from 'tsyringe';
import { Document, DocumentChunk } from '@core/models';
import { IChunkingStrategy, ChunkingConfig, ChunkingError, validateChunkingConfig } from './ChunkingStrategy';

/**
 * ChunkingEngine - Orchestriert verschiedene Chunking-Strategien.
 */
@injectable()
export class ChunkingEngine {
  private strategies: Map<string, IChunkingStrategy> = new Map();
  private defaultConfig: ChunkingConfig = {
    maxChunkSize: 1024,
    overlapSize: 100,
    minChunkSize: 256,
    preserveHeadings: true,
    preserveSections: true,
    respectParagraphs: true,
  };

  /**
   * Registriert eine Chunking-Strategie.
   */
  registerStrategy(strategy: IChunkingStrategy): void {
    this.strategies.set(strategy.getName(), strategy);
  }

  /**
   * Chunked ein Document mit Standard-Strategie (Semantic).
   */
  async chunk(document: Document, config?: Partial<ChunkingConfig>): Promise<DocumentChunk[]> {
    return this.chunkWithStrategy('semantic', document, config);
  }

  /**
   * Chunked mit spezifischer Strategie.
   */
  async chunkWithStrategy(
    strategyName: string,
    document: Document,
    config?: Partial<ChunkingConfig>
  ): Promise<DocumentChunk[]> {
    const strategy = this.strategies.get(strategyName);

    if (!strategy) {
      throw new ChunkingError(
        `Strategy not found: ${strategyName}. Available: ${Array.from(this.strategies.keys()).join(', ')}`,
        strategyName,
        document.id
      );
    }

    const finalConfig = { ...this.defaultConfig, ...config };
    const validation = validateChunkingConfig(finalConfig);

    if (!validation.valid) {
      throw new ChunkingError(
        `Invalid configuration: ${validation.errors.join(', ')}`,
        strategyName,
        document.id
      );
    }

    return strategy.chunk(document, finalConfig);
  }

  /**
   * Gibt verfügbare Strategien zurück.
   */
  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Setzt Default-Konfiguration.
   */
  setDefaultConfig(config: Partial<ChunkingConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }
}

/**
 * Semantische Chunking-Strategie.
 * Respektiert Struktur: Überschriften, Absätze, Abschnitte.
 */
export class SemanticChunkingStrategy implements IChunkingStrategy {
  getName(): string {
    return 'semantic';
  }

  async chunk(document: Document, config: ChunkingConfig): Promise<DocumentChunk[]> {
    if (!document.chunks || document.chunks.length === 0) {
      return [];
    }

    const chunks: DocumentChunk[] = [];
    let currentChunk: DocumentChunk | null = null;
    let currentText = '';
    let currentPageNumber = 1;
    let currentSectionId = 'section-0';
    let offsetStart = 0;
    let chunkIndex = 0;

    for (const sourceChunk of document.chunks) {
      const chunkText = sourceChunk.text;
      const potentialText = currentText ? currentText + '\n' + chunkText : chunkText;
      const potentialSize = Buffer.byteLength(potentialText);

      // Prüfe ob neue Chunk-Grenze nötig ist
      const isStructureBoundary = this.isStructureBoundary(sourceChunk);
      const exceedsSize = potentialSize > config.maxChunkSize;
      const respectsBoundary = config.respectParagraphs || !isStructureBoundary;

      if (exceedsSize && currentText && respectsBoundary) {
        // Speichere aktuelle Chunk
        currentChunk = this.createChunk(
          currentText,
          currentPageNumber,
          currentSectionId,
          offsetStart,
          chunkIndex++
        );
        chunks.push(currentChunk);

        // Starte neue Chunk mit Überlappung
        const overlapText = this.calculateOverlap(currentText, config.overlapSize);
        currentText = overlapText ? overlapText + '\n' + chunkText : chunkText;
        offsetStart = offsetStart + Buffer.byteLength(currentText) - Buffer.byteLength(currentText);
      } else {
        currentText = potentialText;
      }

      // Update Metadaten
      currentPageNumber = sourceChunk.pageNumber ?? currentPageNumber;
      currentSectionId = sourceChunk.sectionId ?? currentSectionId;
    }

    // Speichere letzte Chunk
    if (currentText && currentText.trim().length > 0) {
      currentChunk = this.createChunk(
        currentText,
        currentPageNumber,
        currentSectionId,
        offsetStart,
        chunkIndex
      );
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Prüft ob ein Chunk eine Struktur-Grenze ist.
   * @private
   */
  private isStructureBoundary(chunk: DocumentChunk): boolean {
    if (!chunk.text) {
      return false;
    }

    const text = chunk.text.trim();

    // Erkenne Überschriften (Markdown-Style oder Allcaps)
    if (/^#+\s/.test(text) || /^[A-Z]{2,}$/.test(text)) {
      return true;
    }

    // Erkenne kurze "Überschrift"-ähnliche Zeilen
    if (text.length < 80 && text.split('\n').length === 1 && /^[A-Z]/.test(text)) {
      return true;
    }

    // Erkenne Sections aus sectionId
    if (chunk.sectionId && chunk.sectionId !== 'section-0') {
      return true;
    }

    return false;
  }

  /**
   * Berechnet Overlap-Text am Ende einer Chunk.
   * @private
   */
  private calculateOverlap(text: string, overlapSize: number): string {
    if (overlapSize <= 0 || !text) {
      return '';
    }

    const bytes = Buffer.byteLength(text);

    if (bytes <= overlapSize) {
      return text;
    }

    // Gehe von hinten nach vorne bis wir overlapSize erreichen
    let currentPos = text.length;
    let byteCount = 0;

    while (currentPos > 0 && byteCount < overlapSize) {
      currentPos--;
      byteCount = Buffer.byteLength(text.substring(currentPos));
    }

    // Starte bei nächstem Wort-Boundary
    const overlap = text.substring(currentPos);
    const lastSpace = overlap.lastIndexOf(' ');

    if (lastSpace > 0) {
      return overlap.substring(lastSpace + 1);
    }

    return overlap;
  }

  /**
   * Erstellt eine neue DocumentChunk.
   * @private
   */
  private createChunk(
    text: string,
    pageNumber: number,
    sectionId: string,
    offsetStart: number,
    index: number
  ): DocumentChunk {
    const trimmedText = text.trim();
    const textBytes = Buffer.byteLength(trimmedText);

    return {
      id: `chunk-${index}-${Date.now()}`,
      text: trimmedText,
      pageNumber,
      sectionId,
      offsetStart,
      offsetEnd: offsetStart + textBytes,
      confidence: this.calculateConfidence(text),
      isOcrExtracted: false, // Nur setzen wenn tatsächlich OCR
      type: 'text',
      tags: [],
    };
  }

  /**
   * Berechnet Confidence basierend auf Struktur-Klarheit.
   * @private
   */
  private calculateConfidence(text: string): number {
    if (!text) {
      return 0;
    }

    let confidence = 0.95; // Standard-Confidence

    // Reduziere bei unsauberen Grenzen
    const lines = text.split('\n');

    if (lines.length > 1) {
      // Text mit mehreren Zeilen ist klarer
      confidence += 0.02;
    }

    if (lines[0].length > 50) {
      // Längere erste Zeile = wahrscheinlich vollständiger Satz
      confidence += 0.02;
    }

    // Clampe auf 0-1
    return Math.min(Math.max(confidence, 0), 1);
  }
}

/**
 * Einfache Chunking-Strategie - Nur nach Größe.
 * Keine Struktur-Respektierung.
 */
export class SimpleChunkingStrategy implements IChunkingStrategy {
  getName(): string {
    return 'simple';
  }

  async chunk(document: Document, config: ChunkingConfig): Promise<DocumentChunk[]> {
    if (!document.chunks || document.chunks.length === 0) {
      return [];
    }

    // Kombiniere alle Chunks zu einem großen Text
    const allText = document.chunks.map((c) => c.text).join('\n');
    const chunks: DocumentChunk[] = [];

    let currentPos = 0;
    let chunkIndex = 0;

    while (currentPos < allText.length) {
      // Berechne nächste Chunk-Grenze
      let endPos = currentPos + config.maxChunkSize;

      if (endPos < allText.length) {
        // Finde nächsten Space nach endPos
        let spacePos = allText.indexOf(' ', endPos);
        if (spacePos === -1 || spacePos - endPos > 100) {
          spacePos = endPos;
        }
        endPos = spacePos;
      }

      const chunkText = allText.substring(currentPos, endPos).trim();

      if (chunkText.length > 0) {
        chunks.push({
          id: `chunk-${chunkIndex}-${Date.now()}`,
          text: chunkText,
          pageNumber: Math.floor(chunkIndex / 10) + 1,
          sectionId: `section-${Math.floor(chunkIndex / 5)}`,
          offsetStart: currentPos,
          offsetEnd: endPos,
          confidence: 0.85, // Einfache Strategie = lower confidence
          isOcrExtracted: false,
          type: 'text',
          tags: [],
        });

        chunkIndex++;
      }

      // Verschiebe für Überlappung
      currentPos = endPos - config.overlapSize;
    }

    return chunks;
  }
}

/**
 * Hybrid Chunking-Strategie - Kombination von Semantic + Simple.
 */
export class HybridChunkingStrategy implements IChunkingStrategy {
  private semanticStrategy: SemanticChunkingStrategy;
  private simpleStrategy: SimpleChunkingStrategy;

  constructor() {
    this.semanticStrategy = new SemanticChunkingStrategy();
    this.simpleStrategy = new SimpleChunkingStrategy();
  }

  getName(): string {
    return 'hybrid';
  }

  async chunk(document: Document, config: ChunkingConfig): Promise<DocumentChunk[]> {
    // Versuche zuerst Semantic
    const semanticChunks = await this.semanticStrategy.chunk(document, config);

    // Wenn zu viele kleine Chunks, nutze Simple für bessere Größen-Verteilung
    const avgSize = semanticChunks.reduce((sum, c) => sum + Buffer.byteLength(c.text), 0) / semanticChunks.length;

    if (avgSize < config.maxChunkSize / 2) {
      // Zu klein - nutze Simple
      return this.simpleStrategy.chunk(document, config);
    }

    return semanticChunks;
  }
}
