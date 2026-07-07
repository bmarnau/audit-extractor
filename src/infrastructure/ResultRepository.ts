import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ExtractionResult, ExtractedValue } from '@domain/ExtractionModels';

/**
 * ResultRepository - Speichert und lädt Extraktions-Ergebnisse
 */
export class ResultRepository {
  constructor(private readonly resultsDir: string = './results') {
    this.ensureDirectory(this.resultsDir);
  }

  save(result: ExtractionResult): string {
    const fileName = `${result.resultId}-${Date.now()}.json`;
    const filePath = path.join(this.resultsDir, fileName);

    const payload = this.serializeResult(result);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');

    return filePath;
  }

  load(resultId: string): ExtractionResult | null {
    const pattern = new RegExp(`^${resultId}-\\d+\\.json$`);
    const files = fs.readdirSync(this.resultsDir);
    const matchedFile = files.find((f) => pattern.test(f));

    if (!matchedFile) {
      return null;
    }

    const filePath = path.join(this.resultsDir, matchedFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    return this.deserializeResult(JSON.parse(content));
  }

  listResults(limit: number = 100): Array<{ resultId: string; fileName: string }> {
    const files = fs.readdirSync(this.resultsDir);
    return files
      .slice(0, limit)
      .map((f) => ({
        resultId: f.split('-')[0],
        fileName: f
      }));
  }

  private serializeResult(result: ExtractionResult): any {
    return {
      resultId: result.resultId,
      documentReference: result.documentReference,
      extractedFields: Array.from(result.extractedFields.entries()).map(
        ([key, value]) => ({
          field: key,
          value: value.value,
          confidence: value.confidence,
          sources: value.sources,
          uncertainty: value.uncertainty,
          extractedAt: value.extractedAt.toISOString()
        })
      ),
      missingFields: result.missingFields,
      warnings: result.warnings,
      extractedAt: result.extractedAt.toISOString(),
      version: result.version,
      ruleSetVersion: result.ruleSetVersion
    };
  }

  private deserializeResult(data: any): ExtractionResult {
    const extractedFields = new Map<string, ExtractedValue<any>>(
      (data.extractedFields as Array<{ field: string; value: any; confidence: number; sources: any; uncertainty?: string; extractedAt: string }>).map((item: any) => [
        item.field,
        {
          value: item.value,
          confidence: item.confidence,
          sources: item.sources,
          uncertainty: item.uncertainty,
          extractedAt: new Date(item.extractedAt)
        }
      ])
    );

    return {
      resultId: data.resultId,
      documentReference: data.documentReference,
      extractedFields,
      missingFields: data.missingFields,
      warnings: data.warnings,
      extractedAt: new Date(data.extractedAt),
      version: data.version,
      ruleSetVersion: data.ruleSetVersion
    };
  }

  private ensureDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * DocumentHasher - SHA256 Hashing für Integrität
 */
export class DocumentHasher {
  static hash(filePath: string): string {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  static verify(filePath: string, expectedHash: string): boolean {
    return DocumentHasher.hash(filePath) === expectedHash;
  }
}
