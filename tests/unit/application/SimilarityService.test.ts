/**
 * Tests für SimilarityService (ChromaDB Implementation)
 */

import { ChromaDbSimilarityService } from '@application/similarity/ChromaDbSimilarityService';
import { SimilarityServiceError } from '@application/similarity/SimilarityService';
import { Embedding, EmbeddingMetadata } from '@application/similarity';
import fs from 'fs/promises';
import path from 'path';

describe('ChromaDbSimilarityService', () => {
  let service: ChromaDbSimilarityService;
  const testDir = 'test-embeddings';
  const testVectorDir = path.join(testDir, 'vectors');

  beforeAll(async () => {
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }

    service = new ChromaDbSimilarityService(testDir, testVectorDir);
    await service.initialize();
  });

  afterAll(async () => {
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('createEmbedding', () => {
    it('sollte Embedding aus Text erstellen', async () => {
      const text = 'Dies ist ein Test-Dokument';
      const embedding = await service.createEmbedding(text);

      expect(embedding).toBeDefined();
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(384); // all-MiniLM-L6-v2 hat 384 Dimensionen
      expect(embedding.every((v) => typeof v === 'number')).toBe(true);
    });

    it('sollte gleicher Text gleiches Embedding produzieren', async () => {
      const text = 'Konsistenz-Test';
      const embedding1 = await service.createEmbedding(text);
      const embedding2 = await service.createEmbedding(text);

      expect(embedding1).toEqual(embedding2);
    });

    it('sollte Error für leeren Text werfen', async () => {
      await expect(service.createEmbedding('')).rejects.toThrow(
        SimilarityServiceError
      );
    });

    it('sollte Error für Whitespace-Only Text werfen', async () => {
      await expect(service.createEmbedding('   ')).rejects.toThrow(
        SimilarityServiceError
      );
    });
  });

  describe('storeEmbedding', () => {
    it('sollte Embedding speichern', async () => {
      const embedding = await service.createEmbedding('Test Dokument');
      const metadata: EmbeddingMetadata = {
        documentId: 'doc-001',
        documentType: 'invoice',
        fileName: 'invoice.pdf',
        hash: 'abc123',
        timestamp: new Date(),
      };

      await service.storeEmbedding('doc-001', embedding, metadata);

      // Verify JSON saved (mit Collection-Name im Pfad)
      const filePath = path.join(testDir, 'documents', 'doc-001.json');
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('sollte Error für leeres Embedding werfen', async () => {
      const metadata: EmbeddingMetadata = {
        documentId: 'doc-002',
        documentType: 'contract',
        fileName: 'contract.docx',
        hash: 'def456',
        timestamp: new Date(),
      };

      await expect(
        service.storeEmbedding('doc-002', [], metadata)
      ).rejects.toThrow(SimilarityServiceError);
    });

    it('sollte Error für fehlende documentId werfen', async () => {
      const embedding = await service.createEmbedding('Test');
      const metadata: EmbeddingMetadata = {
        documentId: '',
        documentType: 'invoice',
        fileName: 'invoice.pdf',
        hash: 'xyz789',
        timestamp: new Date(),
      };

      await expect(
        service.storeEmbedding('', embedding, metadata)
      ).rejects.toThrow(SimilarityServiceError);
    });
  });

  describe('findSimilarDocuments', () => {
    beforeEach(async () => {
      // Cleanup collection vor jedem Test
      try {
        await fs.rm(testVectorDir, { recursive: true, force: true });
        await fs.mkdir(testVectorDir, { recursive: true });
      } catch {
        // Ignore
      }
      service = new ChromaDbSimilarityService(testDir, testVectorDir);
      await service.initialize();
    });

    it('sollte ähnliche Dokumente finden', async () => {
      // Store mehrere Dokumente
      const texts = [
        'Rechnung für Services',
        'Zahlungsbestätigung',
        'Nützliche Rezepte',
      ];
      const metadata: EmbeddingMetadata = {
        documentId: '',
        documentType: 'invoice',
        fileName: '',
        hash: '',
        timestamp: new Date(),
      };

      for (let i = 0; i < texts.length; i++) {
        const embedding = await service.createEmbedding(texts[i]);
        await service.storeEmbedding(`doc-${i}`, embedding, {
          ...metadata,
          documentId: `doc-${i}`,
          fileName: `doc-${i}.pdf`,
        });
      }

      // Query für ähnliche Dokumente
      const results = await service.findSimilarDocuments(
        'Rechnung und Zahlungen',
        5,
        0.0
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].similarity).toBeDefined();
      expect(results[0].similarity).toBeGreaterThanOrEqual(0);
      expect(results[0].similarity).toBeLessThanOrEqual(1);
    });

    it('sollte Threshold beachten', async () => {
      const embedding = await service.createEmbedding('Test Dokument');
      const metadata: EmbeddingMetadata = {
        documentId: 'doc-threshold',
        documentType: 'invoice',
        fileName: 'test.pdf',
        hash: 'test',
        timestamp: new Date(),
      };

      await service.storeEmbedding('doc-threshold', embedding, metadata);

      // Query mit hohem Threshold sollte keine oder wenige Resultate geben
      const resultsHighThreshold = await service.findSimilarDocuments(
        'Völlig anderes Thema',
        5,
        0.99
      );

      expect(Array.isArray(resultsHighThreshold)).toBe(true);
    });

    it('sollte Error für leery Query werfen', async () => {
      await expect(
        service.findSimilarDocuments('')
      ).rejects.toThrow(SimilarityServiceError);
    });
  });

  describe('findSimilarByEmbedding', () => {
    beforeEach(async () => {
      try {
        await fs.rm(testVectorDir, { recursive: true, force: true });
        await fs.mkdir(testVectorDir, { recursive: true });
      } catch {
        // Ignore
      }
      service = new ChromaDbSimilarityService(testDir, testVectorDir);
      await service.initialize();
    });

    it('sollte Dokumente basierend auf Embedding finden', async () => {
      const queryEmbedding = await service.createEmbedding('Query Text');
      const docEmbedding = await service.createEmbedding(
        'Similar Dokument'
      );

      const metadata: EmbeddingMetadata = {
        documentId: 'doc-emb',
        documentType: 'invoice',
        fileName: 'doc.pdf',
        hash: 'hash',
        timestamp: new Date(),
      };

      await service.storeEmbedding('doc-emb', docEmbedding, metadata);

      const results = await service.findSimilarByEmbedding(queryEmbedding, 5, 0.0);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('sollte Error für leeres Embedding werfen', async () => {
      await expect(
        service.findSimilarByEmbedding([], 5, 0.5)
      ).rejects.toThrow(SimilarityServiceError);
    });
  });

  describe('calculateSimilarity', () => {
    it('sollte Cosine Similarity berechnen', () => {
      const emb1: Embedding = [1, 0, 0];
      const emb2: Embedding = [1, 0, 0];

      const similarity = service.calculateSimilarity(emb1, emb2);

      expect(similarity).toBe(1.0); // Identical vectors
    });

    it('sollte 0.5 für orthogonale Vektoren zurückgeben', () => {
      const emb1: Embedding = [1, 0];
      const emb2: Embedding = [0, 1];

      const similarity = service.calculateSimilarity(emb1, emb2);

      expect(similarity).toBeCloseTo(0.5, 1); // Orthogonal -> similarity 0, normalized zu 0.5
    });

    it('sollte Error für unterschiedliche Längen werfen', () => {
      const emb1: Embedding = [1, 0, 0];
      const emb2: Embedding = [1, 0];

      expect(() => service.calculateSimilarity(emb1, emb2)).toThrow(
        SimilarityServiceError
      );
    });

    it('sollte Error für leere Embeddings werfen', () => {
      const emb1: Embedding = [];
      const emb2: Embedding = [];

      expect(() => service.calculateSimilarity(emb1, emb2)).toThrow(
        SimilarityServiceError
      );
    });
  });

  describe('getLocations', () => {
    it('sollte Speicherorte zurückgeben', () => {
      const locations = service.getLocations();

      expect(locations).toBeDefined();
      expect(locations.json).toBe(testDir);
      expect(locations.vectors).toBe(testVectorDir);
    });
  });

  describe('No Data Generation', () => {
    it('sollte keine Embeddings verändern', async () => {
      const originalEmbedding = await service.createEmbedding('Original Text');
      const embeddingCopy = [...originalEmbedding];

      const metadata: EmbeddingMetadata = {
        documentId: 'doc-nodatagen',
        documentType: 'invoice',
        fileName: 'test.pdf',
        hash: 'test',
        timestamp: new Date(),
      };

      await service.storeEmbedding(
        'doc-nodatagen',
        originalEmbedding,
        metadata
      );

      // Embedding sollte unverändert sein
      expect(originalEmbedding).toEqual(embeddingCopy);
    });

    it('sollte Query-Text nicht verändern', async () => {
      const queryText = 'Originaler Query Text';
      const queryTextCopy = queryText;

      await service.findSimilarDocuments(queryText, 5, 0.0);

      expect(queryText).toBe(queryTextCopy);
    });
  });
});
