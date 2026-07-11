/**
 * JobStructureService
 *
 * Verwaltet die Dateistruktur für Jobs
 * Erstellt und validiert Verzeichnis-Hierarchie:
 *
 * jobs/
 * └── JOB-0001/
 *     ├── job.json (Metadaten)
 *     ├── sources/ (Eingabedateien)
 *     ├── schema/ (Schema-Datei)
 *     ├── examples/ (Trainingsbeispiele)
 *     ├── output/ (Extraktionsergebnisse)
 *     └── logs/ (Audit-Trail)
 *
 * @version 0.22.0
 * @phase 22 - Job-Based Architecture
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { injectable } from 'tsyringe';
import { Job, RuntimeJob } from '@domain/job';
import {
  JobDirectoryError,
  JobPersistenceError,
} from '@domain/job/JobErrors';

/**
 * Struktur eines Job-Verzeichnisses
 */
export interface JobDirectoryStructure {
  rootPath: string;
  jobMetadataPath: string;
  sourcesPath: string;
  schemaPath: string;
  examplesPath: string;
  outputPath: string;
  logsPath: string;
  allPaths: string[];
}

/**
 * Validierungs-Ergebnis
 */
export interface ValidationResult {
  valid: boolean;
  missingDirectories: string[];
  missingFiles: string[];
  issues: string[];
}

/**
 * JobStructureService - Infrastruktur-Service
 */
@injectable()
export class JobStructureService {
  private readonly baseJobsPath: string;

  constructor(baseJobsPath: string = process.cwd() + '/jobs') {
    this.baseJobsPath = path.resolve(baseJobsPath);
  }

  /**
   * Erstelle neue Job-Verzeichnisstruktur
   * Erzeugt alle notwendigen Ordner und job.json Metadatendatei
   */
  async createJobStructure(job: Job): Promise<JobDirectoryStructure> {
    const jobId = job.getJobId().toDirectoryName();
    const structure = this.getJobPaths(jobId);

    try {
      // Erstelle alle Verzeichnisse
      await this.ensureDirectories(structure);

      // Schreibe Metadaten
      await this.saveJobMetadata(jobId, job);

      return structure;
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error));
      throw new JobDirectoryError(
        structure.rootPath,
        'create',
        cause
      );
    }
  }

  /**
   * Lade Job-Metadaten aus Datei
   */
  async loadJobMetadata(jobId: string): Promise<RuntimeJob> {
    const paths = this.getJobPaths(jobId);

    try {
      const content = await fs.readFile(paths.jobMetadataPath, 'utf-8');
      const data = JSON.parse(content);
      return data as RuntimeJob;
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error));
      throw new JobPersistenceError('load', jobId, cause);
    }
  }

  /**
   * Speichere Job-Metadaten in Datei
   */
  async saveJobMetadata(jobId: string, job: Job): Promise<void> {
    const paths = this.getJobPaths(jobId);
    const dto = job.toDTO();

    try {
      const content = JSON.stringify(dto, null, 2);
      await fs.writeFile(paths.jobMetadataPath, content, 'utf-8');
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error));
      throw new JobPersistenceError('save', jobId, cause);
    }
  }

  /**
   * Aktualisiere Job-Metadaten
   */
  async updateJobMetadata(
    jobId: string,
    updates: Partial<RuntimeJob>
  ): Promise<void> {
    try {
      const existing = await this.loadJobMetadata(jobId);
      const updated = { ...existing, ...updates };
      const paths = this.getJobPaths(jobId);
      const content = JSON.stringify(updated, null, 2);
      await fs.writeFile(paths.jobMetadataPath, content, 'utf-8');
    } catch (error) {
      if (error instanceof JobPersistenceError) {
        throw error;
      }
      const cause = error instanceof Error ? error : new Error(String(error));
      throw new JobPersistenceError('update', jobId, cause);
    }
  }

  /**
   * Validiere Job-Verzeichnisstruktur
   * Prüft ob alle notwendigen Ordner und Dateien existieren
   */
  async validateJobDirectory(jobId: string): Promise<ValidationResult> {
    const paths = this.getJobPaths(jobId);
    const result: ValidationResult = {
      valid: true,
      missingDirectories: [],
      missingFiles: [],
      issues: [],
    };

    try {
      // Prüfe notwendige Verzeichnisse
      const requiredDirectories = [
        paths.sourcesPath,
        paths.schemaPath,
        paths.examplesPath,
        paths.outputPath,
        paths.logsPath,
      ];

      for (const dirPath of requiredDirectories) {
        const exists = await this.directoryExists(dirPath);
        if (!exists) {
          result.missingDirectories.push(
            path.relative(this.baseJobsPath, dirPath)
          );
          result.valid = false;
        }
      }

      // Prüfe Metadatei
      const metadataExists = await this.fileExists(paths.jobMetadataPath);
      if (!metadataExists) {
        result.missingFiles.push('job.json');
        result.valid = false;
      }

      // Zusätzliche Prüfungen
      if (result.missingDirectories.length > 0) {
        result.issues.push(
          `Missing directories: ${result.missingDirectories.join(', ')}`
        );
      }

      if (result.missingFiles.length > 0) {
        result.issues.push(
          `Missing files: ${result.missingFiles.join(', ')}`
        );
      }

      return result;
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error));
      throw new JobDirectoryError(
        paths.rootPath,
        'validate',
        cause
      );
    }
  }

  /**
   * Stelle sicher dass alle notwendigen Verzeichnisse existieren
   * Erstelle fehlende Verzeichnisse
   */
  async ensureDirectories(structure: JobDirectoryStructure): Promise<void> {
    const directories = [
      structure.rootPath,
      structure.sourcesPath,
      structure.schemaPath,
      structure.examplesPath,
      structure.outputPath,
      structure.logsPath,
    ];

    try {
      for (const dirPath of directories) {
        await fs.mkdir(dirPath, { recursive: true });
      }
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error));
      throw new JobDirectoryError(
        structure.rootPath,
        'ensure directories',
        cause
      );
    }
  }

  /**
   * Lösche komplette Job-Verzeichnisstruktur
   */
  async deleteJobDirectory(jobId: string): Promise<void> {
    const paths = this.getJobPaths(jobId);

    try {
      const exists = await this.directoryExists(paths.rootPath);
      if (!exists) {
        throw new Error(`Job directory not found: ${paths.rootPath}`);
      }

      await fs.rm(paths.rootPath, { recursive: true, force: true });
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error));
      throw new JobDirectoryError(paths.rootPath, 'delete', cause);
    }
  }

  /**
   * Gebe Größe des Job-Verzeichnisses in Bytes zurück
   */
  async getJobDirectorySize(jobId: string): Promise<number> {
    const paths = this.getJobPaths(jobId);

    try {
      return await this.calculateDirectorySize(paths.rootPath);
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error));
      throw new JobDirectoryError(paths.rootPath, 'calculate size', cause);
    }
  }

  /**
   * Liste alle Jobs auf
   */
  async listJobs(): Promise<string[]> {
    try {
      const exists = await this.directoryExists(this.baseJobsPath);
      if (!exists) {
        return [];
      }

      const entries = await fs.readdir(this.baseJobsPath, {
        withFileTypes: true,
      });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error));
      throw new JobDirectoryError(
        this.baseJobsPath,
        'list jobs',
        cause
      );
    }
  }

  /**
   * Gebe Verzeichnis-Pfade für einen Job zurück
   * (nicht async - nur Path-Berechnung)
   */
  getJobPaths(jobId: string): JobDirectoryStructure {
    const rootPath = path.join(this.baseJobsPath, jobId);

    return {
      rootPath,
      jobMetadataPath: path.join(rootPath, 'job.json'),
      sourcesPath: path.join(rootPath, 'sources'),
      schemaPath: path.join(rootPath, 'schema'),
      examplesPath: path.join(rootPath, 'examples'),
      outputPath: path.join(rootPath, 'output'),
      logsPath: path.join(rootPath, 'logs'),
      allPaths: [
        rootPath,
        path.join(rootPath, 'sources'),
        path.join(rootPath, 'schema'),
        path.join(rootPath, 'examples'),
        path.join(rootPath, 'output'),
        path.join(rootPath, 'logs'),
      ],
    };
  }

  // ==================== Private Helpers ====================

  /**
   * Prüfe ob Verzeichnis existiert
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Prüfe ob Datei existiert
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Berechne Verzeichnis-Größe rekursiv
   */
  private async calculateDirectorySize(dirPath: string): Promise<number> {
    let size = 0;

    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        size += await this.calculateDirectorySize(fullPath);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        size += stats.size;
      }
    }

    return size;
  }

  /**
   * Synchrone Hilfsmethode - Prüfe ob Verzeichnis existiert (synchron)
   * Für Tests und Init-Code
   */
  directoryExistsSync(dirPath: string): boolean {
    try {
      const stats = fsSync.statSync(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}
