/**
 * JobStructureApplicationService
 *
 * Anwendungs-Service für Job-Struktur Management
 * - Orchestriert Domain Models und Infrastructure Services
 * - Implementiert Business-Use-Cases
 * - Konvertiert zwischen DTOs und Domain Models
 *
 * @version 0.22.0
 * @phase 22 - Job-Based Architecture
 */

import { injectable, inject } from 'tsyringe';
import {
  Job,
  JobId,
  DocumentType,
  CreateJobRequest,
  RuntimeJob,
  JobSourceFactory,
  JobSchemaFactory,
  JobValidationError,
  JobPersistenceError,
  JobStatusError,
} from '@domain/job';
import { JobStructureService, ValidationResult } from '@infrastructure/services/JobStructureService';

@injectable()
export class JobStructureApplicationService {
  constructor(
    @inject(JobStructureService)
    private readonly jobStructureService: JobStructureService
  ) {}

  /**
   * Use-Case: Neuen Job erstellen
   * Erstellt Domain Model, persististiert Struktur, gibt RuntimeJob zurück
   */
  async createJob(request: CreateJobRequest): Promise<RuntimeJob> {
    try {
      // Validierung der Request
      this.validateCreateJobRequest(request);

      // Erstelle Domain Model
      const job = Job.create({
        documentType: request.documentType as DocumentType,
        sources: request.sourceFiles.map((src) =>
          JobSourceFactory.create({
            filePath: src.filePath,
            mimeType: src.mimeType,
            hash: src.hash,
            sizeBytes: src.sizeBytes,
          })
        ),
        schema: JobSchemaFactory.create({
          schemaId: request.schemaId,
          schemaName: request.schemaId,
          schemaPath: request.schemaPath,
          version: request.schemaVersion,
          fieldsCount: 0, // TODO: Parse schema untuk mendapatkan field count
        }),
        examples: [],
        options: request.options,
      });

      // Erstelle Verzeichnisstruktur
      await this.jobStructureService.createJobStructure(job);

      // Return DTO
      return job.toDTO();
    } catch (error) {
      throw this.handleError('createJob', error);
    }
  }

  /**
   * Use-Case: Job-Status abrufen
   */
  async getJobStatus(jobId: string): Promise<RuntimeJob> {
    try {
      // Validiere JobId Format
      if (!JobId.isValid(jobId)) {
        throw new JobValidationError('Invalid JobId format', {
          jobId: ['Must match JOB-xxxx format'],
        });
      }

      // Lade Metadaten
      const metadata = await this.jobStructureService.loadJobMetadata(jobId);
      return metadata;
    } catch (error) {
      throw this.handleError('getJobStatus', error);
    }
  }

  /**
   * Use-Case: Job-Status aktualisieren
   */
  async updateJobStatus(jobId: string, status: string, failureReason?: string): Promise<RuntimeJob> {
    try {
      if (!JobId.isValid(jobId)) {
        throw new JobValidationError('Invalid JobId format', {
          jobId: ['Must match JOB-xxxx format'],
        });
      }

      // Lade existierenden Job
      const metadata = await this.jobStructureService.loadJobMetadata(jobId);

      // Rekonstruiere Domain Model
      const metadataWithDates = {
        ...metadata,
        createdAt: typeof metadata.createdAt === 'string' ? new Date(metadata.createdAt) : metadata.createdAt,
        updatedAt: typeof metadata.updatedAt === 'string' ? new Date(metadata.updatedAt) : metadata.updatedAt,
        completedAt: metadata.completedAt ? (typeof metadata.completedAt === 'string' ? new Date(metadata.completedAt) : metadata.completedAt) : undefined,
        sources: metadata.sources.map((s: any) => ({
          ...s,
          uploadedAt: typeof s.uploadedAt === 'string' ? new Date(s.uploadedAt) : s.uploadedAt,
        })),
        schema: {
          ...metadata.schema,
          uploadedAt: typeof metadata.schema.uploadedAt === 'string' ? new Date(metadata.schema.uploadedAt) : metadata.schema.uploadedAt,
        },
      };
      const job = Job.restore({
        ...metadataWithDates,
        status,
      } as any);

      // Validiere Status-Transition
      if (status === 'running' && job.getStatus() === 'queued') {
        job.startProcessing();
      } else if (status === 'completed' && job.getStatus() === 'running') {
        job.markCompleted();
      } else if (status === 'failed' && job.getStatus() === 'running') {
        if (!failureReason) {
          throw new JobValidationError('failureReason required for failed status');
        }
        job.markFailed(failureReason);
      } else if (status === 'cancelled') {
        job.cancel();
      } else {
        throw new JobStatusError(jobId, job.getStatus(), status);
      }

      // Persistiere aktualisierte Metadaten
      await this.jobStructureService.saveJobMetadata(jobId, job);

      return job.toDTO();
    } catch (error) {
      throw this.handleError('updateJobStatus', error);
    }
  }

  /**
   * Use-Case: Validiere Job-Verzeichnisstruktur
   */
  async validateJobStructure(jobId: string): Promise<ValidationResult> {
    try {
      if (!JobId.isValid(jobId)) {
        throw new JobValidationError('Invalid JobId format', {
          jobId: ['Must match JOB-xxxx format'],
        });
      }

      return await this.jobStructureService.validateJobDirectory(jobId);
    } catch (error) {
      throw this.handleError('validateJobStructure', error);
    }
  }

  /**
   * Use-Case: Job löschen
   */
  async deleteJob(jobId: string): Promise<void> {
    try {
      if (!JobId.isValid(jobId)) {
        throw new JobValidationError('Invalid JobId format', {
          jobId: ['Must match JOB-xxxx format'],
        });
      }

      await this.jobStructureService.deleteJobDirectory(jobId);
    } catch (error) {
      throw this.handleError('deleteJob', error);
    }
  }

  /**
   * Use-Case: Liste aller Jobs abrufen
   */
  async listJobs(): Promise<{ jobIds: string[]; count: number }> {
    try {
      const jobIds = await this.jobStructureService.listJobs();
      return {
        jobIds,
        count: jobIds.length,
      };
    } catch (error) {
      throw this.handleError('listJobs', error);
    }
  }

  /**
   * Use-Case: Job-Verzeichnisgröße abrufen
   */
  async getJobSize(jobId: string): Promise<number> {
    try {
      if (!JobId.isValid(jobId)) {
        throw new JobValidationError('Invalid JobId format', {
          jobId: ['Must match JOB-xxxx format'],
        });
      }

      return await this.jobStructureService.getJobDirectorySize(jobId);
    } catch (error) {
      throw this.handleError('getJobSize', error);
    }
  }

  // ==================== Private Helpers ====================

  /**
   * Validiere CreateJobRequest
   */
  private validateCreateJobRequest(request: CreateJobRequest): void {
    const errors: Record<string, string[]> = {};

    if (!request.documentType) {
      errors['documentType'] = ['documentType is required'];
    }

    if (!request.sourceFiles || request.sourceFiles.length === 0) {
      errors['sourceFiles'] = ['At least one source file is required'];
    }

    if (!request.schemaId) {
      errors['schemaId'] = ['schemaId is required'];
    }

    if (!request.schemaPath) {
      errors['schemaPath'] = ['schemaPath is required'];
    }

    if (!request.schemaVersion) {
      errors['schemaVersion'] = ['schemaVersion is required'];
    }

    if (Object.keys(errors).length > 0) {
      throw new JobValidationError('Invalid CreateJobRequest', errors);
    }
  }

  /**
   * Zentrale Fehlerbehandlung
   */
  private handleError(operation: string, error: unknown): Error {
    if (error instanceof JobPersistenceError) {
      return error;
    }

    if (error instanceof Error) {
      return new JobPersistenceError(operation, 'unknown', error);
    }

    return new JobPersistenceError(
      operation,
      'unknown',
      new Error(String(error))
    );
  }
}
