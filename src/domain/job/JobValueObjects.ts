/**
 * Job Value Objects und Enums
 *
 * Immutable Value Objects für:
 * - JobStatus (enum)
 * - DocumentType (enum)
 * - JobSource, JobSchema, JobExample, JobOptions
 *
 * @version 0.22.0
 * @phase 22 - Job-Based Architecture
 */

/**
 * JobStatus - Lifecycle Status eines Jobs
 */
export enum JobStatus {
  QUEUED = 'queued',      // Job erstellt, wartet auf Verarbeitung
  RUNNING = 'running',    // Gerade in Verarbeitung
  COMPLETED = 'completed', // Erfolgreich abgeschlossen
  FAILED = 'failed',      // Fehlgeschlagen
  CANCELLED = 'cancelled', // Vom Benutzer abgebrochen
}

/**
 * DocumentType - Unterstützte Dokument-Formate
 */
export enum DocumentType {
  PDF = 'pdf',
  HTML = 'html',
  IMAGE = 'image',
  TEXT = 'text',
}

/**
 * JobSource Value Object
 * Repräsentiert eine Eingabedatei
 * Immutable
 */
export interface JobSource {
  readonly sourceId: string;           // Eindeutige ID
  readonly filePath: string;           // Pfad relativ zu jobs/JOB-xxxx/sources/
  readonly mimeType: string;           // z.B. application/pdf
  readonly hash: string;               // SHA256 für Integrität
  readonly uploadedAt: Date;           // Zeitstempel
  readonly sizeBytes: number;          // Dateigröße
}

/**
 * Factory für JobSource
 */
export class JobSourceFactory {
  static create(props: Omit<JobSource, 'uploadedAt' | 'sourceId'>): JobSource {
    return {
      sourceId: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      uploadedAt: new Date(),
      ...props,
    };
  }
}

/**
 * JobSchema Value Object
 * Referenziert das verwendete Schema
 * Immutable
 */
export interface JobSchema {
  readonly schemaId: string;           // Schema UUID
  readonly schemaName: string;         // z.B. "invoice-v1.0"
  readonly schemaPath: string;         // Pfad zu schema.json
  readonly version: string;            // Version
  readonly fieldsCount: number;        // Anzahl Felder
  readonly uploadedAt: Date;
}

/**
 * Factory für JobSchema
 */
export class JobSchemaFactory {
  static create(props: Omit<JobSchema, 'uploadedAt'>): JobSchema {
    return {
      uploadedAt: new Date(),
      ...props,
    };
  }
}

/**
 * JobExample Value Object
 * Referenziert ein Trainings-Beispiel
 * Immutable
 */
export interface JobExample {
  readonly exampleId: string;          // Example UUID
  readonly exampleName: string;        // z.B. "example-invoice-1"
  readonly examplePath: string;        // Pfad zu example file
  readonly associatedRules: string[];  // Welche Regeln werden mit diesem Beispiel getestet
  readonly uploadedAt: Date;
}

/**
 * Factory für JobExample
 */
export class JobExampleFactory {
  static create(props: Omit<JobExample, 'uploadedAt' | 'exampleId'>): JobExample {
    return {
      exampleId: `example-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      uploadedAt: new Date(),
      ...props,
    };
  }
}

/**
 * JobOptions Value Object
 * Konfigurationsoptionen für Job-Verarbeitung
 * Immutable
 */
export interface JobOptions {
  readonly enableHallucinationCheck: boolean;    // Halluzinations-Validierung aktiv?
  readonly confidenceThreshold: number;          // 0.0 - 1.0, default 0.8
  readonly maxRetries: number;                   // Max Retry-Versuche
  readonly timeoutMs: number;                    // Timeout pro Extraktion
  readonly enableAuditLogging: boolean;          // Audit-Trail schreiben?
  readonly notifyOnCompletion: boolean;          // Benachrichtigung nach Job?
}

/**
 * Default JobOptions
 */
export const DEFAULT_JOB_OPTIONS: JobOptions = {
  enableHallucinationCheck: true,
  confidenceThreshold: 0.8,
  maxRetries: 3,
  timeoutMs: 30000,
  enableAuditLogging: true,
  notifyOnCompletion: false,
};

/**
 * Factory für JobOptions
 */
export class JobOptionsFactory {
  static create(overrides?: Partial<JobOptions>): JobOptions {
    return {
      ...DEFAULT_JOB_OPTIONS,
      ...overrides,
    };
  }

  static validate(options: JobOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.confidenceThreshold < 0 || options.confidenceThreshold > 1) {
      errors.push('confidenceThreshold must be between 0 and 1');
    }

    if (options.maxRetries < 0) {
      errors.push('maxRetries must be >= 0');
    }

    if (options.timeoutMs <= 0) {
      errors.push('timeoutMs must be > 0');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
