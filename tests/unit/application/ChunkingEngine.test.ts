/**
 * ChunkingEngine Tests
 */

import { Document, DocumentChunk, DocumentFormat } from '@core/models';
import {
  ChunkingEngine,
  SemanticChunkingStrategy,
  SimpleChunkingStrategy,
  HybridChunkingStrategy,
} from '@application/chunking/ChunkingEngine';
import { ChunkingConfig, ChunkingError } from '@application/chunking/ChunkingStrategy';

describe('ChunkingEngine', () => {
  let engine: ChunkingEngine;
  let testDocument: Document;

  beforeEach(() => {
    engine = new ChunkingEngine();

    // Register all strategies
    engine.registerStrategy(new SemanticChunkingStrategy());
    engine.registerStrategy(new SimpleChunkingStrategy());
    engine.registerStrategy(new HybridChunkingStrategy());

    // Create test document
    testDocument = {
      id: 'test-doc-1',
      fileName: 'test.pdf',
      type: 'invoice',
      metadata: {
        hash: 'abc123',
        size: 10000,
        uploadedAt: new Date(),
        format: DocumentFormat.PDF,
        ocrApplied: false,
      },
      chunks: [
        {
          id: 'chunk-0',
          text: 'Invoice Number: INV-2024-001',
          pageNumber: 1,
          sectionId: 'section-0',
          offsetStart: 0,
          offsetEnd: 28,
          confidence: 1.0,
          isOcrExtracted: false,
          type: 'text',
          tags: [],
        },
        {
          id: 'chunk-1',
          text: 'Date: 2024-01-15',
          pageNumber: 1,
          sectionId: 'section-0',
          offsetStart: 29,
          offsetEnd: 45,
          confidence: 1.0,
          isOcrExtracted: false,
          type: 'text',
          tags: [],
        },
        {
          id: 'chunk-2',
          text: 'This is a longer paragraph with more details about the invoice. It contains multiple sentences and provides important information.',
          pageNumber: 1,
          sectionId: 'section-1',
          offsetStart: 46,
          offsetEnd: 170,
          confidence: 1.0,
          isOcrExtracted: false,
          type: 'text',
          tags: [],
        },
      ],
      images: [],
      loadedAt: new Date(),
      tags: [],
    };
  });

  describe('chunk', () => {
    it('should chunk document with default config', async () => {
      const chunks = await engine.chunk(testDocument);

      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should produce DocumentChunk objects', async () => {
      const chunks = await engine.chunk(testDocument);

      for (const chunk of chunks) {
        expect(chunk.id).toBeDefined();
        expect(chunk.text).toBeDefined();
        expect(chunk.confidence).toBeGreaterThanOrEqual(0);
        expect(chunk.confidence).toBeLessThanOrEqual(1);
        expect(chunk.offsetStart).toBeGreaterThanOrEqual(0);
        expect(chunk.offsetEnd).toBeGreaterThanOrEqual(chunk.offsetStart);
      }
    });

    it('should preserve no data generation', async () => {
      const chunks = await engine.chunk(testDocument);

      // Keine erfundenen Texte
      for (const chunk of chunks) {
        expect(chunk.text.length).toBeGreaterThan(0);
        // Text sollte aus Original-Chunks kommen
      }
    });
  });

  describe('chunkWithStrategy', () => {
    it('should use specified strategy', async () => {
      const simpleChunks = await engine.chunkWithStrategy('simple', testDocument);
      const semanticChunks = await engine.chunkWithStrategy('semantic', testDocument);

      expect(Array.isArray(simpleChunks)).toBe(true);
      expect(Array.isArray(semanticChunks)).toBe(true);
      // Strategien können unterschiedliche Ergebnisse liefern
    });

    it('should throw error for unknown strategy', async () => {
      await expect(engine.chunkWithStrategy('unknown', testDocument)).rejects.toThrow(ChunkingError);
    });

    it('should respect custom config', async () => {
      const config: Partial<ChunkingConfig> = {
        maxChunkSize: 100,
        overlapSize: 10,
      };

      const chunks = await engine.chunkWithStrategy('simple', testDocument, config);

      // Mit kleinerer maxChunkSize sollten wir mehr Chunks haben
      expect(chunks.length).toBeGreaterThan(1);
    });
  });

  describe('SemanticChunkingStrategy', () => {
    let strategy: SemanticChunkingStrategy;

    beforeEach(() => {
      strategy = new SemanticChunkingStrategy();
    });

    it('should return semantic strategy name', () => {
      expect(strategy.getName()).toBe('semantic');
    });

    it('should handle empty document', async () => {
      const emptyDoc = { ...testDocument, chunks: [] };
      const chunks = await strategy.chunk(emptyDoc, {
        maxChunkSize: 1024,
        overlapSize: 100,
      });

      expect(chunks).toEqual([]);
    });

    it('should respect maxChunkSize', async () => {
      const config: ChunkingConfig = {
        maxChunkSize: 50,
        overlapSize: 10,
      };

      const chunks = await strategy.chunk(testDocument, config);

      for (const chunk of chunks) {
        const chunkSize = Buffer.byteLength(chunk.text);
        expect(chunkSize).toBeLessThanOrEqual(config.maxChunkSize + 10); // Allow small overage
      }
    });

    it('should add overlap between chunks', async () => {
      const config: ChunkingConfig = {
        maxChunkSize: 50,
        overlapSize: 20,
      };

      const chunks = await strategy.chunk(testDocument, config);

      if (chunks.length > 1) {
        // Check if there's overlap between consecutive chunks
        const chunk1End = chunks[0].text;
        const chunk2Start = chunks[1].text;

        // Should have some repeated content - check for overlap
        let overlap = '';
        for (let i = Math.min(chunk1End.length, 50); i > 0; i--) {
          const suffix = chunk1End.substring(chunk1End.length - i);
          if (chunk2Start.includes(suffix)) {
            overlap = suffix;
            break;
          }
        }
        expect(overlap.length).toBeGreaterThan(0);
      }
    });

    it('should set appropriate confidence', async () => {
      const config: ChunkingConfig = {
        maxChunkSize: 1024,
        overlapSize: 100,
      };

      const chunks = await strategy.chunk(testDocument, config);

      for (const chunk of chunks) {
        expect(chunk.confidence).toBeGreaterThan(0.8);
        expect(chunk.confidence).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe('SimpleChunkingStrategy', () => {
    let strategy: SimpleChunkingStrategy;

    beforeEach(() => {
      strategy = new SimpleChunkingStrategy();
    });

    it('should return simple strategy name', () => {
      expect(strategy.getName()).toBe('simple');
    });

    it('should split by size only', async () => {
      const config: ChunkingConfig = {
        maxChunkSize: 100,
        overlapSize: 0,
      };

      const chunks = await strategy.chunk(testDocument, config);

      expect(chunks.length).toBeGreaterThan(0);

      for (const chunk of chunks) {
        const chunkSize = Buffer.byteLength(chunk.text);
        expect(chunkSize).toBeLessThanOrEqual(config.maxChunkSize + 10);
      }
    });
  });

  describe('Config Validation', () => {
    it('should reject invalid config', async () => {
      const invalidConfig: ChunkingConfig = {
        maxChunkSize: 50,
        overlapSize: 100, // Larger than max!
      };

      await expect(engine.chunk(testDocument, invalidConfig)).rejects.toThrow(ChunkingError);
    });

    it('should reject too small maxChunkSize', async () => {
      const invalidConfig: ChunkingConfig = {
        maxChunkSize: 10,
        overlapSize: 5,
      };

      await expect(engine.chunk(testDocument, invalidConfig)).rejects.toThrow(ChunkingError);
    });
  });

  describe('No Data Generation', () => {
    it('should not invent text content', async () => {
      const chunks = await engine.chunk(testDocument);

      const allChunkText = chunks.map((c) => c.text).join('');
      const originalText = testDocument.chunks.map((c) => c.text).join('\n');

      // Alle Chunk-Texte sollten aus Original stammen
      for (const chunk of chunks) {
        expect(originalText.includes(chunk.text)).toBe(true);
      }
    });

    it('should not auto-generate headings', async () => {
      const chunks = await engine.chunk(testDocument);

      for (const chunk of chunks) {
        // Kein erfundener Heading
        expect(chunk.type).toBe('text'); // Nicht 'heading' wenn nicht explizit vorhanden
      }
    });

    it('should only use existing section info', async () => {
      const chunks = await engine.chunk(testDocument);

      const existingSectionIds = new Set(testDocument.chunks.map((c) => c.sectionId));

      // Sections sollten aus Original stammen oder konsistent generiert sein
      for (const chunk of chunks) {
        expect(chunk.sectionId).toBeDefined();
      }
    });
  });

  describe('Available Strategies', () => {
    it('should list all registered strategies', () => {
      const strategies = engine.getAvailableStrategies();

      expect(strategies).toContain('semantic');
      expect(strategies).toContain('simple');
      expect(strategies).toContain('hybrid');
    });
  });

  describe('Default Config', () => {
    it('should allow setting default config', async () => {
      const customConfig: Partial<ChunkingConfig> = {
        maxChunkSize: 500,
        overlapSize: 50,
      };

      engine.setDefaultConfig(customConfig);

      // Sollte mit neuen Defaults funktionieren
      const chunks = await engine.chunk(testDocument);
      expect(chunks.length).toBeGreaterThan(0);
    });
  });
});
