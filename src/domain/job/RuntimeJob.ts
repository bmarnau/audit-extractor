/**
 * RuntimeJob - Data Transfer Object (DTO)
 *
 * Serialisierbare Repräsentation eines Jobs
 * Für API-Responses und Persistierung
 * - Separiert vom Domain Model
 * - Einfach zu serialisieren/deserialisieren
 * - Keine Business-Logik
 *
 * @version 0.22.0
 * @phase 22 - Job-Based Architecture
 */

/**
 * RuntimeJob - DTO für Job-Persistierung und API-Responses
 */
export interface RuntimeJob {
  // Identifikation
  jobId: string;
  documentType: string;

  // Status & Lifecycle
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;      // ISO 8601
  updatedAt: string;      // ISO 8601
  completedAt?: string;   // ISO 8601 wenn fertig
  failureReason?: string;

  // Inhalte
  sources: {
    sourceId: string;
    filePath: string;
    mimeType: string;
    hash: string;
    uploadedAt: string;
    sizeBytes: number;
  }[];

  schema: {
    schemaId: string;
    schemaName: string;
    schemaPath: string;
    version: string;
    fieldsCount: number;
    uploadedAt: string;
  };

  examples: {
    exampleId: string;
    exampleName: string;
    examplePath: string;
    associatedRules: string[];
    uploadedAt: string;
  }[];

  // Konfiguration
  options: {
    enableHallucinationCheck: boolean;
    confidenceThreshold: number;
    maxRetries: number;
    timeoutMs: number;
    enableAuditLogging: boolean;
    notifyOnCompletion: boolean;
  };

  // Weitere Daten
  metadata?: Record<string, unknown>;

  // Statistics (später)
  statistics?: {
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    averageConfidence: number;
    totalDurationMs: number;
  };
}

/**
 * CreateJobRequest - DTO für Job-Erstellung
 */
export interface CreateJobRequest {
  documentType: string;
  sourceFiles: {
    filePath: string;
    mimeType: string;
    hash: string;
    sizeBytes: number;
  }[];
  schemaId: string;
  schemaPath: string;
  schemaVersion: string;
  exampleIds?: string[];
  options?: {
    enableHallucinationCheck?: boolean;
    confidenceThreshold?: number;
    maxRetries?: number;
    timeoutMs?: number;
    enableAuditLogging?: boolean;
    notifyOnCompletion?: boolean;
  };
  metadata?: Record<string, unknown>;
}

/**
 * UpdateJobRequest - DTO für Job-Update
 */
export interface UpdateJobRequest {
  status?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * JobResponse - Standard API-Response
 */
export interface JobResponse {
  success: boolean;
  data?: RuntimeJob;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

/**
 * JobListResponse - Liste von Jobs
 */
export interface JobListResponse {
  success: boolean;
  data?: {
    jobs: RuntimeJob[];
    total: number;
    limit: number;
    offset: number;
  };
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}
