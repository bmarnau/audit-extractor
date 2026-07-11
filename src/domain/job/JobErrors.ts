/**
 * Job Domain Errors
 *
 * Custom Error-Klassen für saubere Fehlerbehandlung
 * Folgen Error Handling Best Practice
 *
 * @version 0.22.0
 * @phase 22 - Job-Based Architecture
 */

/**
 * Base Job Error
 */
export abstract class JobError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, JobError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Ungültige Job-Konfiguration
 */
export class JobValidationError extends JobError {
  readonly code = 'JOB_VALIDATION_ERROR';
  readonly statusCode = 400;
  readonly details: Record<string, string[]>;

  constructor(message: string, details: Record<string, string[]> = {}) {
    super(message);
    this.details = details;
    Object.setPrototypeOf(this, JobValidationError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      details: this.details,
    };
  }
}

/**
 * Job nicht gefunden
 */
export class JobNotFoundError extends JobError {
  readonly code = 'JOB_NOT_FOUND';
  readonly statusCode = 404;
  readonly jobId: string;

  constructor(jobId: string) {
    super(`Job not found: ${jobId}`);
    this.jobId = jobId;
    Object.setPrototypeOf(this, JobNotFoundError.prototype);
  }
}

/**
 * Ungültiger Job-Status für Operation
 */
export class JobStatusError extends JobError {
  readonly code = 'JOB_INVALID_STATUS';
  readonly statusCode = 400;
  readonly currentStatus: string;
  readonly operation: string;

  constructor(jobId: string, currentStatus: string, operation: string) {
    super(
      `Cannot ${operation} job (${jobId}) with status: ${currentStatus}`
    );
    this.currentStatus = currentStatus;
    this.operation = operation;
    Object.setPrototypeOf(this, JobStatusError.prototype);
  }
}

/**
 * Verzeichnis-Fehler
 */
export class JobDirectoryError extends JobError {
  readonly code = 'JOB_DIRECTORY_ERROR';
  readonly statusCode = 500;
  readonly path: string;
  readonly operation: string;

  constructor(path: string, operation: string, cause?: Error) {
    const message = cause
      ? `Directory ${operation} failed for ${path}: ${cause.message}`
      : `Directory ${operation} failed for ${path}`;
    super(message);
    this.path = path;
    this.operation = operation;
    Object.setPrototypeOf(this, JobDirectoryError.prototype);
  }
}

/**
 * Datei-Persistierungs-Fehler
 */
export class JobPersistenceError extends JobError {
  readonly code = 'JOB_PERSISTENCE_ERROR';
  readonly statusCode = 500;
  readonly operation: string;
  readonly cause?: Error;

  constructor(operation: string, jobId: string, cause?: Error) {
    const message = cause
      ? `Failed to ${operation} job (${jobId}): ${cause.message}`
      : `Failed to ${operation} job (${jobId})`;
    super(message);
    this.operation = operation;
    this.cause = cause;
    Object.setPrototypeOf(this, JobPersistenceError.prototype);
  }
}

/**
 * Fehler bei Verzeichnis-Validierung
 */
export class JobDirectoryValidationError extends JobError {
  readonly code = 'JOB_DIRECTORY_VALIDATION_ERROR';
  readonly statusCode = 400;
  readonly path: string;
  readonly missingItems: string[];
  readonly invalidItems: string[];

  constructor(
    path: string,
    missingItems: string[] = [],
    invalidItems: string[] = []
  ) {
    const messages: string[] = [];
    if (missingItems.length > 0) {
      messages.push(`Missing: ${missingItems.join(', ')}`);
    }
    if (invalidItems.length > 0) {
      messages.push(`Invalid: ${invalidItems.join(', ')}`);
    }
    super(
      `Job directory validation failed for ${path}: ${messages.join('; ')}`
    );
    this.path = path;
    this.missingItems = missingItems;
    this.invalidItems = invalidItems;
    Object.setPrototypeOf(this, JobDirectoryValidationError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      path: this.path,
      missingItems: this.missingItems,
      invalidItems: this.invalidItems,
    };
  }
}

/**
 * Fehler bei Source-Datei
 */
export class JobSourceError extends JobError {
  readonly code = 'JOB_SOURCE_ERROR';
  readonly statusCode = 400;
  readonly sourceId: string;

  constructor(sourceId: string, message: string) {
    super(`Source file error (${sourceId}): ${message}`);
    this.sourceId = sourceId;
    Object.setPrototypeOf(this, JobSourceError.prototype);
  }
}

/**
 * Helper: Ist Error ein JobError?
 */
export function isJobError(error: unknown): error is JobError {
  return error instanceof JobError;
}
