/**
 * ResultRepository Implementation
 *
 * Versionierte Persistierung mit Filesystem-Backend.
 * Speichert keine veränderten Daten - nur Original Results!
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ExtractionResult } from '@domain/ExtractionModels';
import {
  IResultRepository,
  VersionInfo,
  ResultLocation,
  ResultRepositoryError,
} from './ResultRepository';

/**
 * FileSystemResultRepository - Versionierte Result-Persistierung.
 */
export class FileSystemResultRepository implements IResultRepository {
  private jsonDir: string;
  private reportDir: string;

  constructor(
    jsonDir: string = 'results/json',
    reportDir: string = 'results/reports'
  ) {
    this.jsonDir = jsonDir;
    this.reportDir = reportDir;
  }

  /**
   * Speichert ExtractionResult mit automatischer Versionierung.
   */
  async saveResult(result: ExtractionResult, baseName: string): Promise<VersionInfo> {
    try {
      // Stelle Verzeichnis sicher
      await fs.mkdir(this.jsonDir, { recursive: true });

      // Finde nächste Versionsnummer
      const nextVersion = await this.getNextVersion(baseName);

      // Generiere Dateinamen: baseName_vX.json
      const fileName = `${baseName}_v${nextVersion}.json`;
      const filePath = path.join(this.jsonDir, fileName);

      // Serialize Result (NO modifications!)
      const data = this.serializeResult(result);

      // Schreibe Datei
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

      // Erstelle VersionInfo
      const versionInfo: VersionInfo = {
        version: nextVersion,
        documentId: 'unknown', // TODO: aus result extrahieren
        documentType: 'unknown',
        createdAt: new Date(),
        filePath,
      };

      return versionInfo;
    } catch (error) {
      throw new ResultRepositoryError(
        `Failed to save result: ${error instanceof Error ? error.message : String(error)}`,
        baseName
      );
    }
  }

  /**
   * Lädt ExtractionResult.
   */
  async loadResult(baseName: string, version?: number): Promise<ExtractionResult | null> {
    try {
      // Wenn keine Version gegeben, nimm neueste
      if (version === undefined) {
        const versions = await this.listVersions(baseName);
        if (versions.length === 0) {
          return null;
        }
        version = versions[0].version; // Neueste zuerst
      }

      // Generiere Dateinamen
      const fileName = `${baseName}_v${version}.json`;
      const filePath = path.join(this.jsonDir, fileName);

      // Prüfe ob Datei existiert
      try {
        await fs.access(filePath);
      } catch {
        return null;
      }

      // Lese Datei
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Deserialize Result
      return this.deserializeResult(data);
    } catch (error) {
      throw new ResultRepositoryError(
        `Failed to load result: ${error instanceof Error ? error.message : String(error)}`,
        baseName,
        version
      );
    }
  }

  /**
   * Listet alle Versionen auf.
   */
  async listVersions(baseName: string): Promise<VersionInfo[]> {
    try {
      // Lese Verzeichnis
      let files: string[] = [];
      try {
        files = await fs.readdir(this.jsonDir);
      } catch {
        // Verzeichnis existiert nicht
        return [];
      }

      // Filtere Dateien: baseName_vX.json
      const pattern = new RegExp(`^${baseName}_v(\\d+)\\.json$`);
      const versions: VersionInfo[] = [];

      for (const file of files) {
        const match = file.match(pattern);
        if (match) {
          const version = parseInt(match[1], 10);
          const filePath = path.join(this.jsonDir, file);

          // Hole Stat für createdAt
          const stat = await fs.stat(filePath);

          versions.push({
            version,
            documentId: baseName,
            documentType: 'unknown',
            createdAt: stat.birthtime || stat.mtime,
            filePath,
          });
        }
      }

      // Sortiere absteigend (neueste zuerst)
      versions.sort((a, b) => b.version - a.version);

      return versions;
    } catch (error) {
      throw new ResultRepositoryError(
        `Failed to list versions: ${error instanceof Error ? error.message : String(error)}`,
        baseName
      );
    }
  }

  /**
   * Löscht spezifische Version.
   */
  async deleteVersion(baseName: string, version: number): Promise<boolean> {
    try {
      const fileName = `${baseName}_v${version}.json`;
      const filePath = path.join(this.jsonDir, fileName);

      try {
        await fs.access(filePath);
      } catch {
        return false; // Datei existiert nicht
      }

      await fs.unlink(filePath);
      return true;
    } catch (error) {
      throw new ResultRepositoryError(
        `Failed to delete version: ${error instanceof Error ? error.message : String(error)}`,
        baseName,
        version
      );
    }
  }

  /**
   * Speichert Report.
   */
  async saveReport(
    content: string,
    baseName: string,
    format: 'markdown' | 'html' = 'markdown'
  ): Promise<string> {
    try {
      // Stelle Verzeichnis sicher
      await fs.mkdir(this.reportDir, { recursive: true });

      // Generiere Dateinamen
      const extension = format === 'html' ? 'html' : 'md';
      const fileName = `${baseName}.${extension}`;
      const filePath = path.join(this.reportDir, fileName);

      // Schreibe Datei
      await fs.writeFile(filePath, content, 'utf-8');

      return filePath;
    } catch (error) {
      throw new ResultRepositoryError(
        `Failed to save report: ${error instanceof Error ? error.message : String(error)}`,
        baseName
      );
    }
  }

  /**
   * Gibt Speicher-Locationen zurück.
   */
  getLocations(): ResultLocation {
    return {
      json: this.jsonDir,
      report: this.reportDir,
    };
  }

  /**
   * Findet nächste Versionsnummer.
   * @private
   */
  private async getNextVersion(baseName: string): Promise<number> {
    const versions = await this.listVersions(baseName);
    if (versions.length === 0) {
      return 1;
    }
    return Math.max(...versions.map((v) => v.version)) + 1;
  }

  /**
   * Serialisiert ExtractionResult zu JSON-serialisierbar.
   * @private
   */
  private serializeResult(result: ExtractionResult): Record<string, unknown> {
    const fields: Record<string, unknown> = {};

    // Konvertiere Map zu Object
    for (const [key, field] of result.extractedFields.entries()) {
      fields[key] = {
        value: field.value,
        confidence: field.confidence,
        sources: field.sources.map((s) => ({
          documentReference: s.documentReference,
          pageNumber: s.pageNumber,
          sectionId: s.sectionId,
          lineStart: s.lineStart,
          lineEnd: s.lineEnd,
          offsetStart: s.offsetStart,
          offsetEnd: s.offsetEnd,
          textSnippet: s.textSnippet,
        })),
        uncertainty: field.uncertainty,
        extractedAt: field.extractedAt,
      };
    }

    return {
      resultId: result.resultId,
      documentReference: result.documentReference,
      extractedFields: fields,
      missingFields: result.missingFields,
      warnings: result.warnings,
      extractedAt: result.extractedAt,
      version: result.version,
      ruleSetVersion: result.ruleSetVersion,
    };
  }

  /**
   * Deserialisiert JSON zurück zu ExtractionResult.
   * @private
   */
  private deserializeResult(data: Record<string, unknown>): ExtractionResult {
    const extractedFields = new Map();

    // Konvertiere Object zurück zu Map
    const fields = data.extractedFields as Record<string, any>;
    for (const [key, field] of Object.entries(fields)) {
      extractedFields.set(key, {
        value: field.value,
        confidence: field.confidence,
        sources: field.sources || [],
        uncertainty: field.uncertainty,
        extractedAt: new Date(field.extractedAt),
      });
    }

    return {
      resultId: (data.resultId as string) || 'unknown',
      documentReference: (data.documentReference as any) || {},
      extractedFields,
      missingFields: (data.missingFields as string[]) || [],
      warnings: (data.warnings as any[]) || [],
      extractedAt: new Date((data.extractedAt as string) || Date.now()),
      version: (data.version as string) || '1.0.0',
      ruleSetVersion: (data.ruleSetVersion as string) || '1.0.0',
    };
  }
}
