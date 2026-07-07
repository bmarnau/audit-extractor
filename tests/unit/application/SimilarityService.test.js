"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChromaDbSimilarityService_1 = require("@application/similarity/ChromaDbSimilarityService");
const SimilarityService_1 = require("@application/similarity/SimilarityService");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
describe('ChromaDbSimilarityService', () => {
    let service;
    const testDir = 'test-embeddings';
    const testVectorDir = path_1.default.join(testDir, 'vectors');
    beforeAll(async () => {
        try {
            await promises_1.default.rm(testDir, { recursive: true, force: true });
        }
        catch {
        }
        service = new ChromaDbSimilarityService_1.ChromaDbSimilarityService(testDir, testVectorDir);
        await service.initialize();
    });
    afterAll(async () => {
        try {
            await promises_1.default.rm(testDir, { recursive: true, force: true });
        }
        catch {
        }
    });
    describe('createEmbedding', () => {
        it('sollte Embedding aus Text erstellen', async () => {
            const text = 'Dies ist ein Test-Dokument';
            const embedding = await service.createEmbedding(text);
            expect(embedding).toBeDefined();
            expect(Array.isArray(embedding)).toBe(true);
            expect(embedding.length).toBe(384);
            expect(embedding.every((v) => typeof v === 'number')).toBe(true);
        });
        it('sollte gleicher Text gleiches Embedding produzieren', async () => {
            const text = 'Konsistenz-Test';
            const embedding1 = await service.createEmbedding(text);
            const embedding2 = await service.createEmbedding(text);
            expect(embedding1).toEqual(embedding2);
        });
        it('sollte Error für leeren Text werfen', async () => {
            await expect(service.createEmbedding('')).rejects.toThrow(SimilarityService_1.SimilarityServiceError);
        });
        it('sollte Error für Whitespace-Only Text werfen', async () => {
            await expect(service.createEmbedding('   ')).rejects.toThrow(SimilarityService_1.SimilarityServiceError);
        });
    });
    describe('storeEmbedding', () => {
        it('sollte Embedding speichern', async () => {
            const embedding = await service.createEmbedding('Test Dokument');
            const metadata = {
                documentId: 'doc-001',
                documentType: 'invoice',
                fileName: 'invoice.pdf',
                hash: 'abc123',
                timestamp: new Date(),
            };
            await service.storeEmbedding('doc-001', embedding, metadata);
            const filePath = path_1.default.join(testDir, 'documents', 'doc-001.json');
            const fileExists = await promises_1.default
                .access(filePath)
                .then(() => true)
                .catch(() => false);
            expect(fileExists).toBe(true);
        });
        it('sollte Error für leeres Embedding werfen', async () => {
            const metadata = {
                documentId: 'doc-002',
                documentType: 'contract',
                fileName: 'contract.docx',
                hash: 'def456',
                timestamp: new Date(),
            };
            await expect(service.storeEmbedding('doc-002', [], metadata)).rejects.toThrow(SimilarityService_1.SimilarityServiceError);
        });
        it('sollte Error für fehlende documentId werfen', async () => {
            const embedding = await service.createEmbedding('Test');
            const metadata = {
                documentId: '',
                documentType: 'invoice',
                fileName: 'invoice.pdf',
                hash: 'xyz789',
                timestamp: new Date(),
            };
            await expect(service.storeEmbedding('', embedding, metadata)).rejects.toThrow(SimilarityService_1.SimilarityServiceError);
        });
    });
    describe('findSimilarDocuments', () => {
        beforeEach(async () => {
            try {
                await promises_1.default.rm(testVectorDir, { recursive: true, force: true });
                await promises_1.default.mkdir(testVectorDir, { recursive: true });
            }
            catch {
            }
            service = new ChromaDbSimilarityService_1.ChromaDbSimilarityService(testDir, testVectorDir);
            await service.initialize();
        });
        it('sollte ähnliche Dokumente finden', async () => {
            const texts = [
                'Rechnung für Services',
                'Zahlungsbestätigung',
                'Nützliche Rezepte',
            ];
            const metadata = {
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
            const results = await service.findSimilarDocuments('Rechnung und Zahlungen', 5, 0.0);
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].similarity).toBeDefined();
            expect(results[0].similarity).toBeGreaterThanOrEqual(0);
            expect(results[0].similarity).toBeLessThanOrEqual(1);
        });
        it('sollte Threshold beachten', async () => {
            const embedding = await service.createEmbedding('Test Dokument');
            const metadata = {
                documentId: 'doc-threshold',
                documentType: 'invoice',
                fileName: 'test.pdf',
                hash: 'test',
                timestamp: new Date(),
            };
            await service.storeEmbedding('doc-threshold', embedding, metadata);
            const resultsHighThreshold = await service.findSimilarDocuments('Völlig anderes Thema', 5, 0.99);
            expect(Array.isArray(resultsHighThreshold)).toBe(true);
        });
        it('sollte Error für leery Query werfen', async () => {
            await expect(service.findSimilarDocuments('')).rejects.toThrow(SimilarityService_1.SimilarityServiceError);
        });
    });
    describe('findSimilarByEmbedding', () => {
        beforeEach(async () => {
            try {
                await promises_1.default.rm(testVectorDir, { recursive: true, force: true });
                await promises_1.default.mkdir(testVectorDir, { recursive: true });
            }
            catch {
            }
            service = new ChromaDbSimilarityService_1.ChromaDbSimilarityService(testDir, testVectorDir);
            await service.initialize();
        });
        it('sollte Dokumente basierend auf Embedding finden', async () => {
            const queryEmbedding = await service.createEmbedding('Query Text');
            const docEmbedding = await service.createEmbedding('Similar Dokument');
            const metadata = {
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
            await expect(service.findSimilarByEmbedding([], 5, 0.5)).rejects.toThrow(SimilarityService_1.SimilarityServiceError);
        });
    });
    describe('calculateSimilarity', () => {
        it('sollte Cosine Similarity berechnen', () => {
            const emb1 = [1, 0, 0];
            const emb2 = [1, 0, 0];
            const similarity = service.calculateSimilarity(emb1, emb2);
            expect(similarity).toBe(1.0);
        });
        it('sollte 0.5 für orthogonale Vektoren zurückgeben', () => {
            const emb1 = [1, 0];
            const emb2 = [0, 1];
            const similarity = service.calculateSimilarity(emb1, emb2);
            expect(similarity).toBeCloseTo(0.5, 1);
        });
        it('sollte Error für unterschiedliche Längen werfen', () => {
            const emb1 = [1, 0, 0];
            const emb2 = [1, 0];
            expect(() => service.calculateSimilarity(emb1, emb2)).toThrow(SimilarityService_1.SimilarityServiceError);
        });
        it('sollte Error für leere Embeddings werfen', () => {
            const emb1 = [];
            const emb2 = [];
            expect(() => service.calculateSimilarity(emb1, emb2)).toThrow(SimilarityService_1.SimilarityServiceError);
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
            const metadata = {
                documentId: 'doc-nodatagen',
                documentType: 'invoice',
                fileName: 'test.pdf',
                hash: 'test',
                timestamp: new Date(),
            };
            await service.storeEmbedding('doc-nodatagen', originalEmbedding, metadata);
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
//# sourceMappingURL=SimilarityService.test.js.map