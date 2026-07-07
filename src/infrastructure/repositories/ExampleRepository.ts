/**
 * ExampleRepository Interface
 *
 * Repository-Pattern für Test-Beispiele.
 * Lädt: Quell-Dokumente, Expected Results, Expected Images
 * Nutzt: Vergleiche für Regressionstests
 */

import { ExtractionResult } from '@core/models';

/**
 * Metadaten für ein Test-Beispiel.
 */
export interface ExampleMetadata {
  id: string;
  name: string;
  description: string;
  documentType: string; // "invoice", "contract", etc.
  fileFormat: string; // "pdf", "docx", "html"
  createdAt: Date;
  tags: string[];
}

/**
 * Ein Test-Beispiel mit allen Komponenten.
 */
export interface TestExample {
  metadata: ExampleMetadata;
  sourceDocument: {
    fileName: string;
    buffer: Buffer;
    path: string;
  };
  expectedExtraction: ExtractionResult | null; // null falls no expected result
  expectedImages: ExampleImage[];
}

/**
 * Expected Image-Metadaten aus examples/expected-images/
 */
export interface ExampleImage {
  id: string;
  exampleId: string;
  pageNumber?: number;
  format: string;
  size: number;
  width?: number;
  height?: number;
  metadata?: Record<string, unknown>;
  path?: string; // Pfad zur Bild-Referenz
}

/**
 * Comparison-Resultat zwischen tatsächlichem und expected Result.
 */
export interface ComparisonResult {
  exampleId: string;
  documentFileName: string;
  passed: boolean;
  differences: ComparisonDifference[];
  metrics: {
    fieldAccuracy: number; // 0-1
    confidenceDeviation: number; // Avg absolute deviation
    sourcesMatched: number; // % der Sources korrekt
    missingFieldsMatched: boolean;
  };
}

/**
 * Ein einzelner Unterschied im Vergleich.
 */
export interface ComparisonDifference {
  field: string;
  actual: unknown;
  expected: unknown;
  type: 'value-mismatch' | 'confidence-mismatch' | 'missing-source' | 'extra-source' | 'missing-field' | 'extra-field';
  severity: 'error' | 'warning' | 'info';
}

/**
 * ExampleRepository - Lädt und verwaltet Test-Beispiele.
 */
export interface IExampleRepository {
  /**
   * Lädt ein Beispiel inkl. Dokument, Expected Results, Expected Images.
   *
   * @param exampleId z.B. "invoice-001"
   * @returns TestExample mit allen Komponenten
   * @throws ExampleNotFoundError falls Beispiel nicht existiert
   */
  loadExample(exampleId: string): Promise<TestExample>;

  /**
   * Lädt nur Expected JSON aus examples/expected-json/
   *
   * @param exampleId z.B. "invoice-001"
   * @returns ExtractionResult oder null falls keine expected results
   */
  loadExpectedJson(exampleId: string): Promise<ExtractionResult | null>;

  /**
   * Lädt Expected Images aus examples/expected-images/
   *
   * @param exampleId z.B. "invoice-001"
   * @returns Array von ExampleImage Metadaten
   */
  loadExpectedImages(exampleId: string): Promise<ExampleImage[]>;

  /**
   * Vergleicht tatsächliches Extraction-Result mit Expected.
   *
   * @param exampleId z.B. "invoice-001"
   * @param actualResult Aktuelles ExtractionResult
   * @returns ComparisonResult mit Differences + Metrics
   */
  compareResults(exampleId: string, actualResult: ExtractionResult): Promise<ComparisonResult>;

  /**
   * Lädt alle verfügbaren Beispiele.
   *
   * @returns Array von ExampleMetadata (ohne Daten)
   */
  listExamples(): Promise<ExampleMetadata[]>;

  /**
   * Filtert Beispiele nach Tags.
   *
   * @param tags z.B. ["invoice", "german"]
   * @returns Array von passenden ExampleMetadata
   */
  findExamplesByTags(tags: string[]): Promise<ExampleMetadata[]>;
}

/**
 * Fehlerklasse für fehlende Beispiele.
 */
export class ExampleNotFoundError extends Error {
  constructor(
    public readonly exampleId: string,
    public readonly component?: 'document' | 'expected-json' | 'expected-images'
  ) {
    super(`Example not found: ${exampleId}${component ? ` (${component})` : ''}`);
    this.name = 'ExampleNotFoundError';
  }
}

/**
 * Fehlerklasse für ungültige Beispiel-Struktur.
 */
export class InvalidExampleError extends Error {
  constructor(
    public readonly exampleId: string,
    message: string
  ) {
    super(`Invalid example structure: ${exampleId} - ${message}`);
    this.name = 'InvalidExampleError';
  }
}
