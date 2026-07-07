/**
 * ExampleRepository Tests
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { FileSystemExampleRepository } from '@infrastructure/repositories/ExampleRepositoryImpl';
import { ExampleNotFoundError } from '@infrastructure/repositories/ExampleRepository';
import { ExtractionResult, ExtractedField } from '@core/models';

describe('FileSystemExampleRepository', () => {
  let repo: FileSystemExampleRepository;
  const testDir = path.join(__dirname, 'test-fixtures');

  beforeAll(async () => {
    // Setup test directories
    await fs.mkdir(path.join(testDir, 'source'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'expected-json'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'expected-images'), { recursive: true });

    // Create test files
    await fs.writeFile(path.join(testDir, 'source', 'invoice-001.pdf'), Buffer.from('PDF content'));
    await fs.writeFile(path.join(testDir, 'source', 'contract-001.docx'), Buffer.from('DOCX content'));

    // Create expected JSON
    const expectedResult: ExtractionResult = {
      extractedFields: new Map([
        [
          'invoiceNumber',
          {
            value: 'INV-2024-001',
            confidence: 0.95,
            sources: [
              { chunkId: 'chunk-0', textSnippet: 'Invoice Number: INV-2024-001' },
            ],
            uncertainty: undefined,
            extractedAt: new Date(),
          } as ExtractedField<string>,
        ],
      ]),
      missingFields: [],
      warnings: [],
    };

    await fs.writeFile(
      path.join(testDir, 'expected-json', 'invoice-001.json'),
      JSON.stringify(expectedResult)
    );

    // Create image metadata
    await fs.mkdir(path.join(testDir, 'expected-images', 'invoice-001'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'expected-images', 'invoice-001', 'image-0.json'),
      JSON.stringify({
        id: 'image-0',
        pageNumber: 1,
        format: 'jpg',
        size: 1024,
        path: 'image-0',
      })
    );
  });

  beforeEach(() => {
    repo = new FileSystemExampleRepository(testDir);
  });

  describe('loadExample', () => {
    it('should load complete example with all components', async () => {
      const example = await repo.loadExample('invoice-001');

      expect(example.metadata.id).toBe('invoice-001');
      expect(example.sourceDocument.fileName).toBe('invoice-001.pdf');
      expect(example.sourceDocument.buffer).toBeDefined();
      expect(example.expectedExtraction).toBeDefined();
      expect(example.expectedImages.length).toBeGreaterThan(0);
    });

    it('should throw ExampleNotFoundError for non-existent example', async () => {
      await expect(repo.loadExample('nonexistent-001')).rejects.toThrow(ExampleNotFoundError);
    });
  });

  describe('loadExpectedJson', () => {
    it('should load expected JSON result', async () => {
      const result = await repo.loadExpectedJson('invoice-001');

      expect(result).toBeDefined();
      expect(result?.extractedFields.has('invoiceNumber')).toBe(true);
    });

    it('should return null if expected JSON does not exist', async () => {
      const result = await repo.loadExpectedJson('contract-001');
      expect(result).toBeNull();
    });
  });

  describe('loadExpectedImages', () => {
    it('should load expected image metadata', async () => {
      const images = await repo.loadExpectedImages('invoice-001');

      expect(images.length).toBeGreaterThan(0);
      expect(images[0].id).toBe('image-0');
      expect(images[0].format).toBe('jpg');
    });

    it('should return empty array if no images exist', async () => {
      const images = await repo.loadExpectedImages('contract-001');
      expect(Array.isArray(images)).toBe(true);
      expect(images.length).toBe(0);
    });
  });

  describe('compareResults', () => {
    it('should compare actual vs expected results', async () => {
      const actualResult: ExtractionResult = {
        extractedFields: new Map([
          [
            'invoiceNumber',
            {
              value: 'INV-2024-001',
              confidence: 0.94,
              sources: [
                { chunkId: 'chunk-0', textSnippet: 'Invoice Number: INV-2024-001' },
              ],
              uncertainty: undefined,
              extractedAt: new Date(),
            } as ExtractedField<string>,
          ],
        ]),
        missingFields: [],
        warnings: [],
      };

      const comparison = await repo.compareResults('invoice-001', actualResult);

      expect(comparison.exampleId).toBe('invoice-001');
      expect(comparison.metrics.fieldAccuracy).toBeGreaterThan(0);
    });

    it('should detect missing fields', async () => {
      const actualResult: ExtractionResult = {
        extractedFields: new Map(),
        missingFields: [],
        warnings: [],
      };

      const comparison = await repo.compareResults('invoice-001', actualResult);

      expect(comparison.passed).toBe(false);
      expect(comparison.differences.length).toBeGreaterThan(0);
    });

    it('should throw error if expected JSON not found', async () => {
      const actualResult: ExtractionResult = {
        extractedFields: new Map(),
        missingFields: [],
        warnings: [],
      };

      await expect(repo.compareResults('nonexistent-001', actualResult)).rejects.toThrow(
        ExampleNotFoundError
      );
    });
  });

  describe('listExamples', () => {
    it('should list all available examples', async () => {
      const examples = await repo.listExamples();

      expect(examples.length).toBeGreaterThanOrEqual(2);
      expect(examples.some((e) => e.id === 'invoice-001')).toBe(true);
      expect(examples.some((e) => e.id === 'contract-001')).toBe(true);
    });

    it('should include metadata for each example', async () => {
      const examples = await repo.listExamples();

      for (const example of examples) {
        expect(example.id).toBeDefined();
        expect(example.name).toBeDefined();
        expect(example.fileFormat).toBeDefined();
      }
    });
  });

  describe('findExamplesByTags', () => {
    it('should find examples by tags', async () => {
      const examples = await repo.findExamplesByTags(['pdf']);

      expect(examples.length).toBeGreaterThan(0);
      expect(examples.some((e) => e.id === 'invoice-001')).toBe(true);
    });

    it('should return empty array for non-matching tags', async () => {
      const examples = await repo.findExamplesByTags(['nonexistent-tag']);

      expect(examples.length).toBe(0);
    });
  });

  describe('No Data Generation', () => {
    it('should not invent missing source documents', async () => {
      await expect(repo.loadExample('fake-example')).rejects.toThrow(ExampleNotFoundError);
    });

    it('should return null for missing expected JSON (not empty object)', async () => {
      const result = await repo.loadExpectedJson('contract-001');
      expect(result).toBeNull();
    });

    it('should return empty array for missing images (not null)', async () => {
      const images = await repo.loadExpectedImages('contract-001');
      expect(Array.isArray(images)).toBe(true);
      expect(images.length).toBe(0);
    });
  });

  afterAll(async () => {
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });
});
