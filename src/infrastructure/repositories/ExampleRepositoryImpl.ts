/**
 * ExampleRepository Implementation
 *
 * Lädt Test-Beispiele aus Verzeichnissen:
 * - examples/source/ (Quell-Dokumente)
 * - examples/expected-json/ (Expected ExtractionResults)
 * - examples/expected-images/ (Expected Image-Metadaten)
 *
 * Kritisch: Keine erfundenen Daten!
 * - Nur echte Dateien laden
 * - Fehlende Expected Results = null
 * - Keine Auto-filled Felder
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ExtractionResult } from '@core/models';
import {
  IExampleRepository,
  TestExample,
  ExampleMetadata,
  ExampleImage,
  ComparisonResult,
  ComparisonDifference,
  ExampleNotFoundError,
  InvalidExampleError,
} from './ExampleRepository';

/**
 * Konkrete Implementation des ExampleRepository.
 */
export class FileSystemExampleRepository implements IExampleRepository {
  private readonly sourcesDir: string;
  private readonly expectedJsonDir: string;
  private readonly expectedImagesDir: string;
  private metadataCache: Map<string, ExampleMetadata> = new Map();

  constructor(baseDir: string = 'examples') {
    this.sourcesDir = path.join(baseDir, 'source');
    this.expectedJsonDir = path.join(baseDir, 'expected-json');
    this.expectedImagesDir = path.join(baseDir, 'expected-images');
  }

  /**
   * Lädt ein komplettes Beispiel.
   */
  async loadExample(exampleId: string): Promise<TestExample> {
    try {
      // Lade alle Komponenten parallel
      const [sourceDoc, expectedJson, expectedImages] = await Promise.all([
        this.loadSourceDocument(exampleId),
        this.loadExpectedJson(exampleId),
        this.loadExpectedImages(exampleId),
      ]);

      // Lade/generiere Metadaten
      const metadata = await this.loadOrCreateMetadata(exampleId, sourceDoc.fileName);

      return {
        metadata,
        sourceDocument: sourceDoc,
        expectedExtraction: expectedJson,
        expectedImages,
      };
    } catch (error) {
      if (error instanceof ExampleNotFoundError || error instanceof InvalidExampleError) {
        throw error;
      }

      throw new InvalidExampleError(exampleId, `Failed to load example: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Lädt nur Expected JSON.
   */
  async loadExpectedJson(exampleId: string): Promise<ExtractionResult | null> {
    try {
      const jsonPath = path.join(this.expectedJsonDir, `${exampleId}.json`);

      // Prüfe ob Datei existiert
      try {
        await fs.access(jsonPath);
      } catch {
        // Datei existiert nicht - das ist OK, return null
        return null;
      }

      const jsonContent = await fs.readFile(jsonPath, 'utf-8');
      const data = JSON.parse(jsonContent);

      // Validiere Struktur
      if (!this.isValidExtractionResult(data)) {
        throw new InvalidExampleError(exampleId, `Invalid ExtractionResult structure in ${exampleId}.json`);
      }

      return data as ExtractionResult;
    } catch (error) {
      if (error instanceof InvalidExampleError) {
        throw error;
      }
      throw new ExampleNotFoundError(exampleId, 'expected-json');
    }
  }

  /**
   * Lädt Expected Images Metadaten.
   */
  async loadExpectedImages(exampleId: string): Promise<ExampleImage[]> {
    try {
      const imagesDir = path.join(this.expectedImagesDir, exampleId);

      // Prüfe ob Verzeichnis existiert
      try {
        await fs.access(imagesDir);
      } catch {
        // Verzeichnis existiert nicht - return leeres Array
        return [];
      }

      // Lese alle JSON-Dateien im Verzeichnis
      const files = await fs.readdir(imagesDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      const images: ExampleImage[] = [];

      for (const file of jsonFiles) {
        try {
          const jsonPath = path.join(imagesDir, file);
          const jsonContent = await fs.readFile(jsonPath, 'utf-8');
          const imageData = JSON.parse(jsonContent);

          images.push({
            id: imageData.id ?? path.basename(file, '.json'),
            exampleId,
            pageNumber: imageData.pageNumber,
            format: imageData.format ?? 'unknown',
            size: imageData.size ?? 0,
            width: imageData.width,
            height: imageData.height,
            metadata: imageData.metadata,
            path: imageData.path,
          });
        } catch (error) {
          console.warn(`Failed to load image metadata from ${file}:`, error);
          // Ignoriere fehlgeschlagene Image-Dateien
        }
      }

      return images;
    } catch (error) {
      // Verzeichnis nicht vorhanden = leeres Array
      return [];
    }
  }

  /**
   * Vergleicht tatsächliches Result mit Expected.
   */
  async compareResults(exampleId: string, actualResult: ExtractionResult): Promise<ComparisonResult> {
    const expectedResult = await this.loadExpectedJson(exampleId);

    if (!expectedResult) {
      throw new ExampleNotFoundError(exampleId, 'expected-json');
    }

    const differences: ComparisonDifference[] = [];
    let matchedFields = 0;
    let totalFields = 0;
    let confidenceDeviation = 0;
    let sourcesMatched = 0;
    let totalSources = 0;

    // Vergleiche extrahierte Felder
    const expectedFieldNames = Array.from(expectedResult.extractedFields.keys());
    const actualFieldNames = Array.from(actualResult.extractedFields.keys());

    // Prüfe erwartete Felder
    for (const fieldName of expectedFieldNames) {
      totalFields++;

      const expectedField = expectedResult.extractedFields.get(fieldName);
      const actualField = actualResult.extractedFields.get(fieldName);

      if (!actualField) {
        // Feld fehlt
        differences.push({
          field: fieldName,
          actual: undefined,
          expected: expectedField?.value,
          type: 'missing-field',
          severity: 'error',
        });
        continue;
      }

      // Vergleiche Wert
      if (JSON.stringify(actualField.value) !== JSON.stringify(expectedField?.value)) {
        differences.push({
          field: fieldName,
          actual: actualField.value,
          expected: expectedField?.value,
          type: 'value-mismatch',
          severity: 'error',
        });
      } else {
        matchedFields++;
      }

      // Vergleiche Confidence
      if (expectedField && Math.abs(actualField.confidence - expectedField.confidence) > 0.05) {
        differences.push({
          field: fieldName,
          actual: actualField.confidence,
          expected: expectedField.confidence,
          type: 'confidence-mismatch',
          severity: 'warning',
        });

        confidenceDeviation += Math.abs(actualField.confidence - expectedField.confidence);
      }

      // Vergleiche Sources
      if (expectedField?.sources && actualField.sources) {
        for (const expectedSource of expectedField.sources) {
          totalSources++;

          const actualSourceExists = actualField.sources.some(
            (s) => s.chunkId === expectedSource.chunkId && s.textSnippet === expectedSource.textSnippet
          );

          if (!actualSourceExists) {
            differences.push({
              field: fieldName,
              actual: actualField.sources.map((s) => s.chunkId),
              expected: [expectedSource.chunkId],
              type: 'missing-source',
              severity: 'warning',
            });
          } else {
            sourcesMatched++;
          }
        }
      }
    }

    // Prüfe extra Felder
    for (const fieldName of actualFieldNames) {
      if (!expectedFieldNames.includes(fieldName)) {
        differences.push({
          field: fieldName,
          actual: actualResult.extractedFields.get(fieldName)?.value,
          expected: undefined,
          type: 'extra-field',
          severity: 'info',
        });
      }
    }

    // Vergleiche missingFields
    const expectedMissing = new Set(expectedResult.missingFields ?? []);
    const actualMissing = new Set(actualResult.missingFields ?? []);

    const missingFieldsMatched =
      expectedMissing.size === actualMissing.size &&
      Array.from(expectedMissing).every((field) => actualMissing.has(field));

    if (!missingFieldsMatched) {
      differences.push({
        field: 'missingFields',
        actual: Array.from(actualMissing),
        expected: Array.from(expectedMissing),
        type: 'value-mismatch',
        severity: 'warning',
      });
    }

    const sourceDocFileName = await this.getSourceFileName(exampleId);

    return {
      exampleId,
      documentFileName: sourceDocFileName,
      passed: differences.filter((d) => d.severity === 'error').length === 0,
      differences,
      metrics: {
        fieldAccuracy: totalFields > 0 ? matchedFields / totalFields : 1,
        confidenceDeviation: totalFields > 0 ? confidenceDeviation / totalFields : 0,
        sourcesMatched: totalSources > 0 ? sourcesMatched / totalSources : 1,
        missingFieldsMatched,
      },
    };
  }

  /**
   * Lädt alle verfügbaren Beispiele.
   */
  async listExamples(): Promise<ExampleMetadata[]> {
    try {
      const files = await fs.readdir(this.sourcesDir);
      const examples: ExampleMetadata[] = [];

      for (const file of files) {
        const exampleId = this.extractExampleId(file);

        if (exampleId) {
          const metadata = await this.loadOrCreateMetadata(exampleId, file);
          examples.push(metadata);
        }
      }

      return examples;
    } catch (error) {
      console.warn('Failed to list examples:', error);
      return [];
    }
  }

  /**
   * Filtert Beispiele nach Tags.
   */
  async findExamplesByTags(tags: string[]): Promise<ExampleMetadata[]> {
    const allExamples = await this.listExamples();
    const tagsSet = new Set(tags.map((t) => t.toLowerCase()));

    return allExamples.filter((example) =>
      example.tags.some((t) => tagsSet.has(t.toLowerCase()))
    );
  }

  /**
   * Private: Lädt Quell-Dokument.
   * @private
   */
  private async loadSourceDocument(
    exampleId: string
  ): Promise<{ fileName: string; buffer: Buffer; path: string }> {
    try {
      const files = await fs.readdir(this.sourcesDir);
      const sourceFile = files.find((f) => this.extractExampleId(f) === exampleId);

      if (!sourceFile) {
        throw new ExampleNotFoundError(exampleId, 'document');
      }

      const filePath = path.join(this.sourcesDir, sourceFile);
      const buffer = await fs.readFile(filePath);

      return {
        fileName: sourceFile,
        buffer,
        path: filePath,
      };
    } catch (error) {
      if (error instanceof ExampleNotFoundError) {
        throw error;
      }
      throw new ExampleNotFoundError(exampleId, 'document');
    }
  }

  /**
   * Private: Extrahiert Example-ID aus Dateiname.
   * @private
   */
  private extractExampleId(fileName: string): string | null {
    // Format: "invoice-001.pdf" → "invoice-001"
    // Format: "invoice-001-expected.json" → "invoice-001"

    const match = fileName.match(/^(.+?)\.\w+$/);
    if (!match) {
      return null;
    }

    const baseName = match[1];

    // Entferne -expected suffix falls vorhanden
    return baseName.replace(/-expected$/, '');
  }

  /**
   * Private: Lädt oder erstellt Metadaten.
   * @private
   */
  private async loadOrCreateMetadata(exampleId: string, fileName: string): Promise<ExampleMetadata> {
    // Prüfe Cache
    if (this.metadataCache.has(exampleId)) {
      return this.metadataCache.get(exampleId)!;
    }

    // Versuche metadata.json zu laden
    const metadataPath = path.join(this.sourcesDir, `${exampleId}-metadata.json`);

    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent) as ExampleMetadata;

      this.metadataCache.set(exampleId, metadata);
      return metadata;
    } catch {
      // Keine metadata.json - generiere Standard-Metadaten
      const ext = fileName.split('.').pop()?.toLowerCase() ?? 'unknown';

      const metadata: ExampleMetadata = {
        id: exampleId,
        name: exampleId,
        description: `Test example: ${exampleId}`,
        documentType: this.guessDocumentType(exampleId),
        fileFormat: ext,
        createdAt: new Date(),
        tags: [ext],
      };

      this.metadataCache.set(exampleId, metadata);
      return metadata;
    }
  }

  /**
   * Private: Rät Dokument-Typ aus Example-ID.
   * @private
   */
  private guessDocumentType(exampleId: string): string {
    if (exampleId.includes('invoice')) return 'invoice';
    if (exampleId.includes('contract')) return 'contract';
    if (exampleId.includes('receipt')) return 'receipt';
    if (exampleId.includes('bill')) return 'bill';
    return 'document';
  }

  /**
   * Private: Validiert ExtractionResult Struktur.
   * @private
   */
  private isValidExtractionResult(data: unknown): boolean {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const result = data as Record<string, unknown>;

    // Muss Map<string, ExtractedField> haben (als Object in JSON)
    if (!result.extractedFields || typeof result.extractedFields !== 'object') {
      return false;
    }

    // missingFields muss Array sein (optional)
    if (result.missingFields && !Array.isArray(result.missingFields)) {
      return false;
    }

    return true;
  }

  /**
   * Private: Ermittelt Quell-Datei-Namen.
   * @private
   */
  private async getSourceFileName(exampleId: string): Promise<string> {
    try {
      const files = await fs.readdir(this.sourcesDir);
      const sourceFile = files.find((f) => this.extractExampleId(f) === exampleId);
      return sourceFile ?? exampleId;
    } catch {
      return exampleId;
    }
  }
}
